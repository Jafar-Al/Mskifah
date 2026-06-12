import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db: Database;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    await initDb();
  }
  return db;
}

async function initDb() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
      score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY,
      week_id INTEGER NOT NULL,
      week_title TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer_index INTEGER NOT NULL,
      points INTEGER DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS weeks (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      is_unlocked BOOLEAN NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      is_correct BOOLEAN NOT NULL,
      answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, question_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('video', 'exam', 'file')),
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT NOT NULL,
      semester INTEGER NOT NULL CHECK(semester IN (1, 2, 3)),
      unit INTEGER NOT NULL,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wazari_lessons (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      unit_title TEXT NOT NULL,
      is_unlocked BOOLEAN NOT NULL DEFAULT 0,
      lesson_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS wazari_questions (
      id INTEGER PRIMARY KEY,
      lesson_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer_index INTEGER NOT NULL,
      points INTEGER DEFAULT 10,
      image_url TEXT,
      FOREIGN KEY (lesson_id) REFERENCES wazari_lessons(id)
    );

    CREATE TABLE IF NOT EXISTS wazari_user_progress (
      user_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      is_correct BOOLEAN NOT NULL,
      answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, question_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (question_id) REFERENCES wazari_questions(id)
    );
  `);

  // Migration: add created_by_admin_id to users if missing
  const userCols = await db.all(`PRAGMA table_info(users);`);
  const hasCreatedBy = userCols.some((c: any) => c.name === 'created_by_admin_id');
  if (!hasCreatedBy) {
    await db.exec('ALTER TABLE users ADD COLUMN created_by_admin_id TEXT');
  }

  // Migration: add image_url to questions if missing
  const questionCols = await db.all(`PRAGMA table_info(questions);`);
  const hasImageUrl = questionCols.some((c: any) => c.name === 'image_url');
  if (!hasImageUrl) {
    await db.exec('ALTER TABLE questions ADD COLUMN image_url TEXT');
  }

  // Migration: add category to resources if missing
  const resourceCols = await db.all(`PRAGMA table_info(resources);`);
  const hasCategory = resourceCols.some((c: any) => c.name === 'category');
  if (!hasCategory) {
    await db.exec('ALTER TABLE resources ADD COLUMN category TEXT');
  }

  // Migration: update CHECK constraint on resources.semester to allow 3 (مكثف)
  const sqlCheck = await db.get(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='resources'`
  );
  if (sqlCheck?.sql && !sqlCheck.sql.includes('semester IN (1, 2, 3)')) {
    await db.exec(`
      CREATE TABLE resources_new (
        id INTEGER PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('video', 'exam', 'file')),
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT NOT NULL,
        semester INTEGER NOT NULL CHECK(semester IN (1, 2, 3)),
        unit INTEGER NOT NULL,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO resources_new SELECT * FROM resources;
      DROP TABLE resources;
      ALTER TABLE resources_new RENAME TO resources;
    `);
  }

  // Backfill category for existing file rows
  await db.run(
    `UPDATE resources
     SET category = CASE
       WHEN title LIKE '%NotebookLM%' THEN 'cheat'
       ELSE 'worksheets'
     END
     WHERE type = 'file' AND (category IS NULL OR category = '')`
  );

  // Remove old admin account
  await db.run("DELETE FROM users WHERE email = 'admin@kifahbiology.com'");

  // Seed new admin accounts
  const admins = [
    { email: 'Jafaradmin@mskifah.com', name: 'Jafar Admin', password: 'Jafar#Mskifah$9917' },
    { email: 'kifahadmin@mskifah.com', name: 'Kifah Admin', password: 'Kifah#Mskifah$8823' },
    { email: 'Rashedadmin@mskifah.com', name: 'Rashed Admin', password: 'Rashed#Mskifah$7741' },
  ];

  for (const admin of admins) {
    const exists = await db.get(
      'SELECT 1 FROM users WHERE LOWER(email) = LOWER(?)',
      [admin.email]
    );
    if (!exists) {
      const hashedPassword = await bcrypt.hash(admin.password, 12);
      await db.run(
        'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [crypto.randomUUID(), admin.name, admin.email, hashedPassword, 'admin']
      );
      console.log(`Seeded admin: ${admin.email}`);
    }
  }

  // Seed questions if empty
  const count = await db.get('SELECT COUNT(*) as count FROM questions');
  if (count.count === 0) {
    console.log('Seeding questions...');
    await seedQuestions();
  }

  // Ensure weeks table is populated for existing DBs
  const weeksCount = await db.get('SELECT COUNT(*) as count FROM weeks');
  if (weeksCount.count === 0) {
    await db.exec(`
      INSERT OR IGNORE INTO weeks (id, title, is_unlocked)
      SELECT week_id, week_title, CASE WHEN week_id = 1 THEN 1 ELSE 0 END
      FROM questions
      GROUP BY week_id, week_title
    `);
  }

  // Seed wazari lessons if empty
  const wazariCount = await db.get('SELECT COUNT(*) as count FROM wazari_lessons');
  if (wazariCount.count === 0) {
    await seedWazariLessons();
  }

  // Migration: add new wazari lessons (IDs 12-24) if missing
  const hasNewLessons = await db.get('SELECT 1 FROM wazari_lessons WHERE id = 12');
  if (!hasNewLessons) {
    const newLessons = [
      { id: 12, title: 'الجهاز العصبي',          unit_title: 'الوحدة الخامسة: التنسيق والتنظيم',   order: 12 },
      { id: 13, title: 'الاحساس و الاستجابة',     unit_title: 'الوحدة الخامسة: التنسيق والتنظيم',   order: 13 },
      { id: 14, title: 'الغدد الصم',              unit_title: 'الوحدة الخامسة: التنسيق والتنظيم',   order: 14 },
      { id: 15, title: 'الدعامة و الحركة',        unit_title: 'الوحدة السادسة: الدعامة والحركة',    order: 15 },
      { id: 16, title: 'العضلات',                 unit_title: 'الوحدة السادسة: الدعامة والحركة',    order: 16 },
      { id: 17, title: 'الجهاز الهضمي',           unit_title: 'الوحدة السابعة: أجهزة جسم الإنسان',  order: 17 },
      { id: 18, title: 'جهاز الدوران',            unit_title: 'الوحدة السابعة: أجهزة جسم الإنسان',  order: 18 },
      { id: 19, title: 'الجهاز التنفسي',          unit_title: 'الوحدة السابعة: أجهزة جسم الإنسان',  order: 19 },
      { id: 20, title: 'جهاز الاخراج',            unit_title: 'الوحدة السابعة: أجهزة جسم الإنسان',  order: 20 },
      { id: 21, title: 'الاجهزة التناسلية',       unit_title: 'الوحدة الثامنة: التكاثر والمناعة',   order: 21 },
      { id: 22, title: 'جهاز المناعة',            unit_title: 'الوحدة الثامنة: التكاثر والمناعة',   order: 22 },
      { id: 23, title: 'المضادات الحيوية',        unit_title: 'الوحدة الثامنة: التكاثر والمناعة',   order: 23 },
      { id: 24, title: 'الاثراء والتوسع',         unit_title: 'الإثراء والتوسع',                    order: 24 },
    ];
    const stmt = await db.prepare(
      'INSERT OR IGNORE INTO wazari_lessons (id, title, unit_title, is_unlocked, lesson_order) VALUES (?, ?, ?, ?, ?)'
    );
    for (const l of newLessons) {
      await stmt.run(l.id, l.title, l.unit_title, 0, l.order);
    }
    await stmt.finalize();
    console.log('Migrated: added 13 new wazari lessons.');
  }

  // Seed resources if empty
  const resourcesCount = await db.get('SELECT COUNT(*) as count FROM resources');
  if (resourcesCount.count === 0) {
    console.log('Seeding resources...');
    await seedResources();
  }
}

async function seedWazariLessons() {
  const lessons = [
    { id: 1,  title: 'المركبات العضوية الحيوية',           unit_title: 'الوحدة الأولى: كيمياء الحياة',                            order: 1  },
    { id: 2,  title: 'الإنزيمات وجزيء حفظ الطاقة ATP',     unit_title: 'الوحدة الأولى: كيمياء الحياة',                            order: 2  },
    { id: 3,  title: 'التفاعلات الكيميائية في الخلية',       unit_title: 'الوحدة الأولى: كيمياء الحياة',                            order: 3  },
    { id: 4,  title: 'دورة الخلية',                          unit_title: 'الوحدة الثانية: دورة الخلية وتصنيع البروتينات',           order: 4  },
    { id: 5,  title: 'الانقسام الخلوي وأهميته',              unit_title: 'الوحدة الثانية: دورة الخلية وتصنيع البروتينات',           order: 5  },
    { id: 6,  title: 'تضاعف DNA والتعبير الجيني',            unit_title: 'الوحدة الثانية: دورة الخلية وتصنيع البروتينات',           order: 6  },
    { id: 7,  title: 'وراثة الصفات المندلية',                unit_title: 'الوحدة الثالثة: الوراثة',                                 order: 7  },
    { id: 8,  title: 'الوراثة بعد مندل',                     unit_title: 'الوحدة الثالثة: الوراثة',                                 order: 8  },
    { id: 9,  title: 'الطفرات والاختلالات الوراثية',          unit_title: 'الوحدة الثالثة: الوراثة',                                 order: 9  },
    { id: 10, title: 'أدوات التكنولوجيا الحيوية',             unit_title: 'الوحدة الرابعة: التكنولوجيا الحيوية',                     order: 10 },
    { id: 11, title: 'تطبيقات التكنولوجيا الحيوية',           unit_title: 'الوحدة الرابعة: التكنولوجيا الحيوية',                     order: 11 },
    { id: 12, title: 'الجهاز العصبي',                        unit_title: 'الوحدة الخامسة: التنسيق والتنظيم',                        order: 12 },
    { id: 13, title: 'الاحساس و الاستجابة',                   unit_title: 'الوحدة الخامسة: التنسيق والتنظيم',                        order: 13 },
    { id: 14, title: 'الغدد الصم',                            unit_title: 'الوحدة الخامسة: التنسيق والتنظيم',                        order: 14 },
    { id: 15, title: 'الدعامة و الحركة',                      unit_title: 'الوحدة السادسة: الدعامة والحركة',                         order: 15 },
    { id: 16, title: 'العضلات',                               unit_title: 'الوحدة السادسة: الدعامة والحركة',                         order: 16 },
    { id: 17, title: 'الجهاز الهضمي',                         unit_title: 'الوحدة السابعة: أجهزة جسم الإنسان',                       order: 17 },
    { id: 18, title: 'جهاز الدوران',                          unit_title: 'الوحدة السابعة: أجهزة جسم الإنسان',                       order: 18 },
    { id: 19, title: 'الجهاز التنفسي',                        unit_title: 'الوحدة السابعة: أجهزة جسم الإنسان',                       order: 19 },
    { id: 20, title: 'جهاز الاخراج',                          unit_title: 'الوحدة السابعة: أجهزة جسم الإنسان',                       order: 20 },
    { id: 21, title: 'الاجهزة التناسلية',                     unit_title: 'الوحدة الثامنة: التكاثر والمناعة',                        order: 21 },
    { id: 22, title: 'جهاز المناعة',                          unit_title: 'الوحدة الثامنة: التكاثر والمناعة',                        order: 22 },
    { id: 23, title: 'المضادات الحيوية',                      unit_title: 'الوحدة الثامنة: التكاثر والمناعة',                        order: 23 },
    { id: 24, title: 'الاثراء والتوسع',                       unit_title: 'الإثراء والتوسع',                                         order: 24 },
  ];

  const stmt = await db.prepare(
    'INSERT OR IGNORE INTO wazari_lessons (id, title, unit_title, is_unlocked, lesson_order) VALUES (?, ?, ?, ?, ?)'
  );
  for (const l of lessons) {
    await stmt.run(l.id, l.title, l.unit_title, 0, l.order);
  }
  await stmt.finalize();
  console.log('Seeded wazari lessons.');
}

async function seedQuestions() {
  const weeksData = [
    {
      id: 1,
      title: "Week 1",
      isUnlocked: true,
      questions: [
        { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome"], correctAnswer: 1, points: 10 },
        { question: "Which organelle is responsible for protein synthesis?", options: ["Ribosome", "Lysosome", "Golgi apparatus"], correctAnswer: 0, points: 10 },
        { question: "What is the basic unit of life?", options: ["Tissue", "Organ", "Cell"], correctAnswer: 2, points: 10 },
        { question: "Which molecule carries genetic information?", options: ["RNA", "DNA", "Protein"], correctAnswer: 1, points: 10 },
        { question: "What is the process of cell division called?", options: ["Mitosis", "Osmosis", "Diffusion"], correctAnswer: 0, points: 10 },
        { question: "Which structure controls what enters and leaves the cell?", options: ["Cell wall", "Cell membrane", "Cytoplasm"], correctAnswer: 1, points: 10 },
        { question: "What is the gel-like substance inside cells?", options: ["Cytoplasm", "Nucleoplasm", "Protoplasm"], correctAnswer: 0, points: 10 },
        { question: "Which organelle contains digestive enzymes?", options: ["Peroxisome", "Lysosome", "Centrosome"], correctAnswer: 1, points: 10 },
        { question: "What is the function of chloroplasts?", options: ["Respiration", "Photosynthesis", "Digestion"], correctAnswer: 1, points: 10 },
        { question: "Which organelle stores water in plant cells?", options: ["Vacuole", "Vesicle", "Plastid"], correctAnswer: 0, points: 10 },
        { question: "What is the shape of DNA?", options: ["Single helix", "Double helix", "Triple helix"], correctAnswer: 1, points: 10 },
        { question: "Which base pairs with Adenine?", options: ["Guanine", "Cytosine", "Thymine"], correctAnswer: 2, points: 10 },
        { question: "What is the process of copying DNA called?", options: ["Translation", "Transcription", "Replication"], correctAnswer: 2, points: 10 },
        { question: "Which organelle modifies and packages proteins?", options: ["ER", "Golgi apparatus", "Ribosome"], correctAnswer: 1, points: 10 },
        { question: "What type of cell lacks a nucleus?", options: ["Eukaryotic", "Prokaryotic", "Multicellular"], correctAnswer: 1, points: 10 },
      ]
    },
    {
      id: 2,
      title: "Week 2",
      isUnlocked: false,
      questions: [
        { question: "What is the process by which plants make food?", options: ["Respiration", "Photosynthesis", "Fermentation"], correctAnswer: 1, points: 10 },
        { question: "Which pigment gives plants their green color?", options: ["Carotene", "Chlorophyll", "Xanthophyll"], correctAnswer: 1, points: 10 },
        { question: "What gas do plants release during photosynthesis?", options: ["Carbon dioxide", "Nitrogen", "Oxygen"], correctAnswer: 2, points: 10 },
        { question: "Where does photosynthesis occur?", options: ["Mitochondria", "Chloroplast", "Nucleus"], correctAnswer: 1, points: 10 },
        { question: "What is the main product of photosynthesis?", options: ["Protein", "Glucose", "Fat"], correctAnswer: 1, points: 10 },
        { question: "Which part of the plant absorbs water?", options: ["Leaves", "Stem", "Roots"], correctAnswer: 2, points: 10 },
        { question: "What is transpiration?", options: ["Water absorption", "Water loss", "Water storage"], correctAnswer: 1, points: 10 },
        { question: "Which tissue transports water in plants?", options: ["Phloem", "Xylem", "Cambium"], correctAnswer: 1, points: 10 },
        { question: "What transports sugar in plants?", options: ["Xylem", "Phloem", "Epidermis"], correctAnswer: 1, points: 10 },
        { question: "What are stomata?", options: ["Root cells", "Leaf pores", "Stem tissues"], correctAnswer: 1, points: 10 },
        { question: "Which cells control stomata opening?", options: ["Guard cells", "Palisade cells", "Spongy cells"], correctAnswer: 0, points: 10 },
        { question: "What is the equation for photosynthesis?", options: ["CO2 + H2O → C6H12O6 + O2", "C6H12O6 + O2 → CO2 + H2O", "N2 + H2 → NH3"], correctAnswer: 0, points: 10 },
        { question: "Light reactions occur in which structure?", options: ["Stroma", "Thylakoid", "Matrix"], correctAnswer: 1, points: 10 },
        { question: "The Calvin cycle occurs in the?", options: ["Thylakoid", "Stroma", "Cytoplasm"], correctAnswer: 1, points: 10 },
        { question: "What is the role of ATP in cells?", options: ["Storage", "Energy currency", "Structure"], correctAnswer: 1, points: 10 },
      ]
    },
    {
      id: 3,
      title: "Week 3",
      isUnlocked: false,
      questions: [
        { question: "What is cellular respiration?", options: ["Making food", "Breaking down glucose", "Cell division"], correctAnswer: 1, points: 10 },
        { question: "Where does glycolysis occur?", options: ["Mitochondria", "Cytoplasm", "Nucleus"], correctAnswer: 1, points: 10 },
        { question: "How many ATP are produced in glycolysis?", options: ["2 ATP", "36 ATP", "4 ATP"], correctAnswer: 0, points: 10 },
        { question: "The Krebs cycle occurs in?", options: ["Cytoplasm", "Matrix", "Cristae"], correctAnswer: 1, points: 10 },
        { question: "What is the final electron acceptor in ETC?", options: ["Carbon dioxide", "Water", "Oxygen"], correctAnswer: 2, points: 10 },
        { question: "Anaerobic respiration produces?", options: ["More ATP", "Less ATP", "No ATP"], correctAnswer: 1, points: 10 },
        { question: "What is fermentation?", options: ["Aerobic process", "Anaerobic process", "Photosynthesis"], correctAnswer: 1, points: 10 },
        { question: "Yeast fermentation produces?", options: ["Lactic acid", "Ethanol", "Acetic acid"], correctAnswer: 1, points: 10 },
        { question: "Muscle fermentation produces?", options: ["Ethanol", "Lactic acid", "Pyruvate"], correctAnswer: 1, points: 10 },
        { question: "How many ATP from one glucose (aerobic)?", options: ["2 ATP", "18 ATP", "36-38 ATP"], correctAnswer: 2, points: 10 },
        { question: "NAD+ is a?", options: ["Enzyme", "Electron carrier", "Protein"], correctAnswer: 1, points: 10 },
        { question: "What is FADH2?", options: ["Sugar", "Electron carrier", "Hormone"], correctAnswer: 1, points: 10 },
        { question: "Oxidative phosphorylation occurs in?", options: ["Cytoplasm", "Inner membrane", "Outer membrane"], correctAnswer: 1, points: 10 },
        { question: "What drives ATP synthesis?", options: ["Proton gradient", "Electron flow", "Heat"], correctAnswer: 0, points: 10 },
        { question: "ATP synthase is a/an?", options: ["Carrier", "Enzyme", "Hormone"], correctAnswer: 1, points: 10 },
      ]
    },
    {
      id: 4,
      title: "Week 4",
      isUnlocked: false,
      questions: [
        { question: "What is genetics?", options: ["Study of cells", "Study of heredity", "Study of ecology"], correctAnswer: 1, points: 10 },
        { question: "Who is the father of genetics?", options: ["Darwin", "Mendel", "Watson"], correctAnswer: 1, points: 10 },
        { question: "What is a gene?", options: ["Chromosome part", "Unit of heredity", "Cell organelle"], correctAnswer: 1, points: 10 },
        { question: "What is an allele?", options: ["Gene variant", "Chromosome", "Protein"], correctAnswer: 0, points: 10 },
        { question: "Dominant alleles are represented by?", options: ["Lowercase", "Uppercase", "Numbers"], correctAnswer: 1, points: 10 },
        { question: "What is a genotype?", options: ["Physical traits", "Genetic makeup", "Behavior"], correctAnswer: 1, points: 10 },
        { question: "What is a phenotype?", options: ["Genetic code", "Observable traits", "DNA sequence"], correctAnswer: 1, points: 10 },
        { question: "Homozygous means?", options: ["Same alleles", "Different alleles", "No alleles"], correctAnswer: 0, points: 10 },
        { question: "Heterozygous means?", options: ["Same alleles", "Different alleles", "One allele"], correctAnswer: 1, points: 10 },
        { question: "What is a Punnett square?", options: ["DNA model", "Genetic prediction tool", "Cell diagram"], correctAnswer: 1, points: 10 },
        { question: "What ratio does Mendel's monohybrid cross give?", options: ["1:2:1", "3:1", "9:3:3:1"], correctAnswer: 1, points: 10 },
        { question: "What is codominance?", options: ["One allele dominates", "Both alleles expressed", "Neither expressed"], correctAnswer: 1, points: 10 },
        { question: "Blood type is an example of?", options: ["Codominance", "Multiple alleles", "Both A and B"], correctAnswer: 2, points: 10 },
        { question: "What causes genetic mutations?", options: ["Only radiation", "DNA changes", "Only chemicals"], correctAnswer: 1, points: 10 },
        { question: "What is a carrier?", options: ["Has disease", "Carries recessive allele", "Has immunity"], correctAnswer: 1, points: 10 },
      ]
    }
  ];

  const weekStmt = await db.prepare(
    'INSERT OR IGNORE INTO weeks (id, title, is_unlocked) VALUES (?, ?, ?)'
  );
  for (const week of weeksData) {
    await weekStmt.run(week.id, week.title, week.isUnlocked ? 1 : 0);
  }
  await weekStmt.finalize();

  const stmt = await db.prepare(
    'INSERT INTO questions (week_id, week_title, question_text, options, correct_answer_index, points) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const week of weeksData) {
    for (const q of week.questions) {
      await stmt.run(week.id, week.title, q.question, JSON.stringify(q.options), q.correctAnswer, q.points);
    }
  }
  await stmt.finalize();
  console.log('Seeded questions successfully.');
}

async function seedResources() {
  const resources = [
    { type: 'video', title: 'قناة أحياء 2008', url: 'https://youtube.com/@kassebio08?si=FEDshZniXGiRTZC6', description: 'القناة الرسمية لأحياء 2008 – جميع وحدات ومناهج الأحياء', semester: 1, unit: 1 },
    { type: 'video', title: 'المركبات العضوية الحيوية', url: 'https://youtube.com/playlist?list=PLk48jzLrmNnFQmVzolY7Axsgv_fge6Urk&si=d-V6HYIAV9wPoRVB', description: 'الوحدة الأولى – الدرس الأول: المركبات العضوية الحيوية', semester: 1, unit: 1 },
    { type: 'video', title: 'التفاعلات الكيميائية في الخلية', url: 'https://youtube.com/playlist?list=PLk48jzLrmNnEEj33y4dBwgS_7Ga4v5IYP&si=5r3V_8ZLuraxqAuA', description: 'الوحدة الأولى – الدرس الثالث: التفاعلات الكيميائية في الخلية', semester: 1, unit: 1 },
    { type: 'video', title: 'دورة الخلية', url: 'https://youtube.com/playlist?list=PLk48jzLrmNnF6nfzcGSHZUyzy04TdfFt1&si=zmq6rZd_2kCUNkUu', description: 'الوحدة الثانية – الدرس الأول: دورة الخلية', semester: 1, unit: 2 },
    { type: 'video', title: 'الانقسام الخلوي وأهميته', url: 'https://youtube.com/playlist?list=PLk48jzLrmNnE5qSh267V6u5CrqbySUw2i&si=YeHjCXjzEgx-0ODm', description: 'الوحدة الثانية – الدرس الثاني: الانقسام الخلوي وأهميته', semester: 1, unit: 2 },
    { type: 'video', title: 'تضاعف DNA والتعبير الجيني', url: 'https://youtube.com/playlist?list=PLk48jzLrmNnFsx2ltM2perQ6RcbVrNl4_&si=RWX5SMltjHvJzjDg', description: 'الوحدة الثانية – الدرس الثالث: تضاعف DNA والتعبير الجيني', semester: 1, unit: 2 },
    { type: 'video', title: 'وراثة الصفات المندلية', url: 'https://youtube.com/playlist?list=PLk48jzLrmNnFll2_OOT690UG4EdQSptOS&si=ht_9ddEBH2ZGyNWQ', description: 'الوحدة الثالثة – الدرس الأول: وراثة الصفات المندلية', semester: 1, unit: 3 },
    { type: 'video', title: 'الوراثة بعد مندل', url: 'https://youtube.com/playlist?list=PLk48jzLrmNnGj4a3Iu-ftaNubfpWydvzZ&si=b0TP0wZcAPatizle', description: 'الوحدة الثالثة – الدرس الثاني: الوراثة بعد مندل', semester: 1, unit: 3 },
    { type: 'video', title: 'الطفرات والاختلالات الوراثية', url: 'https://youtube.com/playlist?list=PLk48jzLrmNnGPW6gOZL9xyxS_0SFZX467&si=cNxqQQO1VkDkFihH', description: 'الوحدة الثالثة – الدرس الثالث: الطفرات والاختلالات الوراثية', semester: 1, unit: 3 },
    { type: 'video', title: 'أدوات التكنولوجيا الحيوية', url: 'https://www.youtube.com/playlist?list=PLk48jzLrmNnFE69ELdXithSksxYYdfpWL', description: 'الوحدة الرابعة – الدرس الأول: أدوات التكنولوجيا الحيوية', semester: 1, unit: 4 },
    { type: 'video', title: 'تطبيقات التكنولوجيا الحيوية', url: 'https://www.youtube.com/playlist?list=PLk48jzLrmNnFmBgnV5dLDt_v7sF9EbFtR', description: 'الوحدة الرابعة – الدرس الثاني: تطبيقات التكنولوجيا الحيوية', semester: 1, unit: 4 },
    { type: 'exam', title: 'تحدي الثامنة 1', url: '/exams/challenge-1.pdf', description: 'المركبات العضوية', semester: 1, unit: 1 },
    { type: 'exam', title: 'تحدي الثامنة 2', url: '/exams/challenge-2.pdf', description: 'المركبات العضوية', semester: 1, unit: 1 },
    { type: 'exam', title: 'تحدي الثامنة 3', url: '/exams/challenge-3.pdf', description: 'الإنزيمات', semester: 1, unit: 1 },
    { type: 'exam', title: 'تحدي الثامنة 4', url: '/exams/challenge-4.pdf', description: 'التنفس الخلوي', semester: 1, unit: 1 },
    { type: 'exam', title: 'تحدي الثامنة 5', url: '/exams/challenge-5.pdf', description: 'البناء الضوئي', semester: 1, unit: 1 },
    { type: 'exam', title: 'تحدي الثامنة 6', url: '/exams/challenge-6.pdf', description: 'دورة الخلية', semester: 1, unit: 1 },
    { type: 'exam', title: 'تحدي الثامنة 7', url: 'https://forms.gle/obDv17NRvmcub1xU8', description: 'الانقسام الخلوي', semester: 1, unit: 1 },
    { type: 'exam', title: 'تحدي الثامنة 8', url: 'https://forms.gle/sbNmgASbHu8HH2QEA', description: 'تضاعف الـDNA', semester: 1, unit: 1 },
    { type: 'exam', title: 'تحدي الثامنة 9', url: 'https://forms.gle/vCDCij99XTypnUps5', description: 'الوراثة المندلية', semester: 1, unit: 1 },
    { type: 'exam', title: 'تحدي الثامنة 10', url: 'https://docs.google.com/forms/d/1JoJqxXs4vmygTGqZtl9k3rCZViY1XfUq3dYGc3cw_tM/edit', description: 'الوراثة المندلية', semester: 1, unit: 1 },
    { type: 'exam', title: 'تحدي الثامنة 11', url: 'https://forms.gle/dmqadV2ATbxF6u8U6', description: 'الوراثة المندلية', semester: 1, unit: 1 },
    { type: 'exam', title: 'تحدي الثامنة 12', url: 'https://forms.gle/ag6BECBXMNjCw7pR8', description: 'الوراثة المندلية', semester: 1, unit: 1 },
    { type: 'file', title: 'ورقة عمل 1 - الكربوهيدرات', url: '/files/worksheet-1.pdf', description: 'ورقة عمل عن الكربوهيدرات - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 2 - البروتينات', url: '/files/worksheet-2.pdf', description: 'ورقة عمل عن البروتينات - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 3 - الليبيدات', url: '/files/worksheet-3.pdf', description: 'ورقة عمل عن الليبيدات - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 4 - الحموض النووية', url: '/files/worksheet-4.pdf', description: 'ورقة عمل عن الحموض النووية - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 5 - الإنزيمات', url: '/files/worksheet-5.pdf', description: 'ورقة عمل عن الإنزيمات - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 6 - التنفس الخلوي', url: '/files/worksheet-6.pdf', description: 'ورقة عمل عن التنفس الخلوي - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 7 - البناء الضوئي', url: '/files/worksheet-7.pdf', description: 'ورقة عمل عن البناء الضوئي - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 8 - دورة الخلية', url: '/files/worksheet-8.pdf', description: 'ورقة عمل عن دورة الخلية - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 9 - الانقسام الخلوي', url: '/files/worksheet-9.pdf', description: 'ورقة عمل عن الانقسام الخلوي - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 10 - نسخ وتضاعف DNA', url: '/files/worksheet-10.pdf', description: 'ورقة عمل عن نسخ وتضاعف DNA - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 11 - الوراثة المندلية', url: '/files/worksheet-11.pdf', description: 'ورقة عمل عن الوراثة المندلية - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 12 - الوراثة بعد مندل', url: '/files/worksheet-12.pdf', description: 'ورقة عمل عن الوراثة بعد مندل - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 13 - الطفرات والاختلالات الوراثية', url: '/files/worksheet-13.pdf', description: 'ورقة عمل عن الطفرات والاختلالات الوراثية - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 14 - أدوات تكنولوجيا الجينات', url: '/files/worksheet-14.pdf', description: 'ورقة عمل عن أدوات تكنولوجيا الجينات - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'ورقة عمل 15 - تطبيقات تكنولوجيا الجينات', url: '/files/worksheet-15.pdf', description: 'ورقة عمل عن تطبيقات تكنولوجيا الجينات - ثاني أكاديمي', semester: 1, unit: 1, category: 'worksheets' },
    { type: 'file', title: 'تخليصات مع NotebookLM', url: 'https://drive.google.com/drive/folders/1o_WnUhR4Ah9UbVnEa78wO0-Vu-nGeb6X?usp=sharing', description: 'مجلد يحتوي على تخليصات ومراجعات باستخدام NotebookLM', semester: 1, unit: 1, category: 'cheat' },
  ];

  const stmt = await db.prepare(
    'INSERT INTO resources (type, title, url, description, semester, unit, category) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  for (const r of resources) {
    await stmt.run(r.type, r.title, r.url, r.description, r.semester, r.unit, (r as any).category ?? null);
  }
  await stmt.finalize();
  console.log('Seeded resources successfully.');
}
