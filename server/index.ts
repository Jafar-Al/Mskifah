import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from './db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'super-secret-key-change-this-in-production';
const ALLOWED_RESOURCE_TYPES = new Set(['video', 'exam', 'file']);
const ALLOWED_FILE_CATEGORIES = new Set(['worksheets', 'cheat']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const stamp = Date.now();
        cb(null, `${stamp}-${safeName}`);
    }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const getUserFromAuthHeader = (req: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;
    try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
};

const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ── Auth Routes ──────────────────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    const db = await getDb();
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();
        await db.run(
            'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [id, name, email, hashedPassword, role || 'student']
        );
        const token = jwt.sign({ id, email, role: role || 'student' }, JWT_SECRET);
        res.json({ token, user: { id, name, email, role: role || 'student', score: 0, answeredQuestions: {}, wazariAnsweredQuestions: {} } });
    } catch (err: any) {
        if (err.code === 'SQLITE_CONSTRAINT') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (!user) return res.status(400).json({ error: 'User not found' });

    if (await bcrypt.compare(password, user.password_hash)) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);

        const answered = await db.all(
            'SELECT question_id, is_correct, answered_at FROM user_progress WHERE user_id = ?',
            [user.id]
        );
        const answeredMap: any = {};
        answered.forEach((a: any) => {
            answeredMap[a.question_id] = { correct: !!a.is_correct, answeredAt: a.answered_at };
        });

        const wazariAnswered = await db.all(
            'SELECT question_id, is_correct, answered_at FROM wazari_user_progress WHERE user_id = ?',
            [user.id]
        );
        const wazariAnsweredMap: any = {};
        wazariAnswered.forEach((a: any) => {
            wazariAnsweredMap[a.question_id] = { correct: !!a.is_correct, answeredAt: a.answered_at };
        });

        res.json({
            token, user: {
                id: user.id, name: user.name, email: user.email, role: user.role, score: user.score,
                answeredQuestions: answeredMap,
                wazariAnsweredQuestions: wazariAnsweredMap
            }
        });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    const db = await getDb();
    const user = await db.get('SELECT id, name, email, role, score FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.sendStatus(404);

    const answered = await db.all(
        'SELECT question_id, is_correct, answered_at FROM user_progress WHERE user_id = ?',
        [user.id]
    );
    const answeredMap: any = {};
    answered.forEach((a: any) => {
        answeredMap[a.question_id] = { correct: !!a.is_correct, answeredAt: a.answered_at };
    });

    const wazariAnswered = await db.all(
        'SELECT question_id, is_correct, answered_at FROM wazari_user_progress WHERE user_id = ?',
        [user.id]
    );
    const wazariAnsweredMap: any = {};
    wazariAnswered.forEach((a: any) => {
        wazariAnsweredMap[a.question_id] = { correct: !!a.is_correct, answeredAt: a.answered_at };
    });

    res.json({ ...user, answeredQuestions: answeredMap, wazariAnsweredQuestions: wazariAnsweredMap });
});

// ── Admin Routes – Regular Questions ─────────────────────────────────────────

app.post('/api/questions', authenticateToken, requireAdmin, async (req: any, res) => {
    const { weekId, weekTitle, question, options, correctAnswer, points, imageUrl } = req.body;
    const db = await getDb();
    try {
        await db.run(
            'INSERT INTO weeks (id, title, is_unlocked) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title',
            [weekId, weekTitle, 0]
        );
        await db.run(
            'INSERT INTO questions (week_id, week_title, question_text, options, correct_answer_index, points, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [weekId, weekTitle, question, JSON.stringify(options), correctAnswer, points, imageUrl || null]
        );
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to create question' });
    }
});

app.put('/api/questions/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { question, options, correctAnswer, points, imageUrl } = req.body;
    const db = await getDb();
    try {
        await db.run(
            'UPDATE questions SET question_text = ?, options = ?, correct_answer_index = ?, points = ?, image_url = ? WHERE id = ?',
            [question, JSON.stringify(options), correctAnswer, points, imageUrl ?? null, id]
        );
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to update question' });
    }
});

app.delete('/api/questions/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const db = await getDb();
    try {
        await db.run('DELETE FROM questions WHERE id = ?', [id]);
        await db.run('DELETE FROM user_progress WHERE question_id = ?', [id]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

app.post('/api/upload', authenticateToken, requireAdmin, upload.single('file'), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.originalname });
});

// ── Admin Routes – Resources ──────────────────────────────────────────────────

app.post('/api/resources', authenticateToken, requireAdmin, async (req: any, res) => {
    const { type, title, url, description, semester, unit, category } = req.body;
    const db = await getDb();
    if (!ALLOWED_RESOURCE_TYPES.has(type)) return res.status(400).json({ error: 'Invalid type' });
    if (![1, 2, 3].includes(Number(semester))) return res.status(400).json({ error: 'Invalid semester' });
    if (!Number.isInteger(Number(unit)) || Number(unit) < 1) return res.status(400).json({ error: 'Invalid unit' });
    if (type === 'file' && category && !ALLOWED_FILE_CATEGORIES.has(category)) return res.status(400).json({ error: 'Invalid category' });
    try {
        await db.run(
            'INSERT INTO resources (type, title, url, description, semester, unit, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [type, title, url, description, Number(semester), Number(unit), category ?? null]
        );
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to create resource' });
    }
});

app.put('/api/resources/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { type, title, url, description, semester, unit, category } = req.body;
    const db = await getDb();
    if (!ALLOWED_RESOURCE_TYPES.has(type)) return res.status(400).json({ error: 'Invalid type' });
    if (![1, 2, 3].includes(Number(semester))) return res.status(400).json({ error: 'Invalid semester' });
    if (!Number.isInteger(Number(unit)) || Number(unit) < 1) return res.status(400).json({ error: 'Invalid unit' });
    if (type === 'file' && category && !ALLOWED_FILE_CATEGORIES.has(category)) return res.status(400).json({ error: 'Invalid category' });
    try {
        await db.run(
            'UPDATE resources SET type = ?, title = ?, url = ?, description = ?, semester = ?, unit = ?, category = ? WHERE id = ?',
            [type, title, url, description, Number(semester), Number(unit), category ?? null, id]
        );
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to update resource' });
    }
});

app.delete('/api/resources/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const db = await getDb();
    try {
        await db.run('DELETE FROM resources WHERE id = ?', [id]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete resource' });
    }
});

// ── Data Routes – Regular Questions ──────────────────────────────────────────

app.get('/api/questions', async (req, res) => {
    const db = await getDb();
    const user = getUserFromAuthHeader(req) as any;
    const isAdmin = user?.role === 'admin';

    const questions = await db.all(`
        SELECT q.*, w.is_unlocked, w.title as week_name
        FROM questions q
        LEFT JOIN weeks w ON w.id = q.week_id
    `);

    const weeksMap = new Map();
    questions.forEach((q: any) => {
        if (!isAdmin && !q.is_unlocked) return;
        if (!weeksMap.has(q.week_id)) {
            weeksMap.set(q.week_id, {
                id: q.week_id,
                title: q.week_name || q.week_title,
                isUnlocked: !!q.is_unlocked,
                questions: []
            });
        }
        const week = weeksMap.get(q.week_id);
        week.questions.push({
            id: q.id,
            question: q.question_text,
            options: JSON.parse(q.options),
            correctAnswer: q.correct_answer_index,
            points: q.points,
            imageUrl: q.image_url || null
        });
    });

    res.json(Array.from(weeksMap.values()));
});

app.get('/api/weeks', authenticateToken, requireAdmin, async (_req, res) => {
    const db = await getDb();
    const weeks = await db.all('SELECT id, title, is_unlocked FROM weeks ORDER BY id');
    res.json(weeks);
});

app.put('/api/weeks/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { isUnlocked } = req.body;
    const db = await getDb();
    try {
        await db.run('UPDATE weeks SET is_unlocked = ? WHERE id = ?', [isUnlocked ? 1 : 0, id]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to update week' });
    }
});

app.get('/api/resources', async (_req, res) => {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM resources ORDER BY id DESC');
    res.json(rows);
});

app.post('/api/progress', authenticateToken, async (req: any, res) => {
    const { questionId, isCorrect, points } = req.body;
    const userId = req.user.id;
    const db = await getDb();
    try {
        const lockRow = await db.get(
            `SELECT w.is_unlocked FROM questions q LEFT JOIN weeks w ON w.id = q.week_id WHERE q.id = ?`,
            [questionId]
        );
        if (!lockRow?.is_unlocked) return res.status(403).json({ error: 'Week is locked' });

        const existing = await db.get(
            'SELECT * FROM user_progress WHERE user_id = ? AND question_id = ?',
            [userId, questionId]
        );
        if (existing) return res.status(400).json({ error: 'Question already answered' });

        await db.run(
            'INSERT INTO user_progress (user_id, question_id, is_correct) VALUES (?, ?, ?)',
            [userId, questionId, isCorrect]
        );
        if (isCorrect) await db.run('UPDATE users SET score = score + ? WHERE id = ?', [points, userId]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// ── Wazari Intensive Routes ───────────────────────────────────────────────────

app.get('/api/wazari/lessons', async (req, res) => {
    const db = await getDb();
    const user = getUserFromAuthHeader(req) as any;
    const isAdmin = user?.role === 'admin';

    const lessons = await db.all(
        'SELECT * FROM wazari_lessons ORDER BY lesson_order ASC'
    );
    const questions = await db.all(
        'SELECT * FROM wazari_questions ORDER BY id ASC'
    );

    const result = lessons
        .filter((l: any) => isAdmin || l.is_unlocked)
        .map((l: any) => ({
            id: l.id,
            title: l.title,
            unitTitle: l.unit_title,
            isUnlocked: !!l.is_unlocked,
            questions: questions
                .filter((q: any) => q.lesson_id === l.id)
                .map((q: any) => ({
                    id: q.id,
                    question: q.question_text,
                    options: JSON.parse(q.options),
                    correctAnswer: q.correct_answer_index,
                    points: q.points,
                    imageUrl: q.image_url || null
                }))
        }));

    res.json(result);
});

app.post('/api/wazari/questions', authenticateToken, requireAdmin, async (req: any, res) => {
    const { lessonId, question, options, correctAnswer, points, imageUrl } = req.body;
    const db = await getDb();
    try {
        await db.run(
            'INSERT INTO wazari_questions (lesson_id, question_text, options, correct_answer_index, points, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [lessonId, question, JSON.stringify(options), correctAnswer, points, imageUrl || null]
        );
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to create wazari question' });
    }
});

app.put('/api/wazari/questions/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { question, options, correctAnswer, points, imageUrl } = req.body;
    const db = await getDb();
    try {
        await db.run(
            'UPDATE wazari_questions SET question_text = ?, options = ?, correct_answer_index = ?, points = ?, image_url = ? WHERE id = ?',
            [question, JSON.stringify(options), correctAnswer, points, imageUrl ?? null, id]
        );
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to update wazari question' });
    }
});

app.delete('/api/wazari/questions/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const db = await getDb();
    try {
        await db.run('DELETE FROM wazari_questions WHERE id = ?', [id]);
        await db.run('DELETE FROM wazari_user_progress WHERE question_id = ?', [id]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete wazari question' });
    }
});

app.put('/api/wazari/lessons/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { isUnlocked } = req.body;
    const db = await getDb();
    try {
        await db.run('UPDATE wazari_lessons SET is_unlocked = ? WHERE id = ?', [isUnlocked ? 1 : 0, id]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to update lesson' });
    }
});

app.post('/api/wazari/progress', authenticateToken, async (req: any, res) => {
    const { questionId, isCorrect, points } = req.body;
    const userId = req.user.id;
    const db = await getDb();
    try {
        const lockRow = await db.get(
            `SELECT l.is_unlocked FROM wazari_questions q
             LEFT JOIN wazari_lessons l ON l.id = q.lesson_id
             WHERE q.id = ?`,
            [questionId]
        );
        if (!lockRow?.is_unlocked) return res.status(403).json({ error: 'Lesson is locked' });

        const existing = await db.get(
            'SELECT * FROM wazari_user_progress WHERE user_id = ? AND question_id = ?',
            [userId, questionId]
        );
        if (existing) return res.status(400).json({ error: 'Question already answered' });

        await db.run(
            'INSERT INTO wazari_user_progress (user_id, question_id, is_correct) VALUES (?, ?, ?)',
            [userId, questionId, isCorrect]
        );
        if (isCorrect) await db.run('UPDATE users SET score = score + ? WHERE id = ?', [points, userId]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to update wazari progress' });
    }
});

// ── Users Routes ──────────────────────────────────────────────────────────────

app.get('/api/users', async (_req, res) => {
    const db = await getDb();
    const users = await db.all('SELECT id, name, email, role, score, created_at FROM users');

    const usersWithProgress = await Promise.all(users.map(async (u: any) => {
        const answered = await db.all(
            'SELECT question_id, is_correct, answered_at FROM user_progress WHERE user_id = ?',
            [u.id]
        );
        const answeredMap: any = {};
        answered.forEach((a: any) => {
            answeredMap[a.question_id] = { correct: !!a.is_correct, answeredAt: a.answered_at };
        });

        const correctRows = await db.all(
            `SELECT p.question_id, p.answered_at, q.points
             FROM user_progress p
             JOIN questions q ON q.id = p.question_id
             WHERE p.user_id = ? AND p.is_correct = 1
             ORDER BY p.answered_at ASC, p.question_id ASC`,
            [u.id]
        );

        let runningScore = 0;
        let scoreAchievedAt: string | null = null;
        if (u.score > 0) {
            for (const row of correctRows) {
                runningScore += Number(row.points) || 0;
                if (runningScore >= u.score) { scoreAchievedAt = row.answered_at; break; }
            }
            if (!scoreAchievedAt && correctRows.length > 0) {
                scoreAchievedAt = correctRows[correctRows.length - 1].answered_at;
            }
        }

        const { created_at, ...safeUser } = u;
        return { ...safeUser, answeredQuestions: answeredMap, scoreAchievedAt };
    }));

    res.json(usersWithProgress);
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (_req, res) => {
    const db = await getDb();
    try {
        const users = await db.all(`
            SELECT u.id, u.name, u.email, u.role, u.score, u.created_at,
                   COUNT(p.question_id) AS answered_count,
                   COALESCE(SUM(CASE WHEN p.is_correct THEN 1 ELSE 0 END), 0) AS correct_count
            FROM users u
            LEFT JOIN user_progress p ON p.user_id = u.id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json(users);
    } catch {
        res.status(500).json({ error: 'Failed to load users' });
    }
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const db = await getDb();
    try {
        const existing = await db.get('SELECT id FROM users WHERE id = ?', [id]);
        if (!existing) return res.sendStatus(404);
        await db.run('UPDATE users SET name = ? WHERE id = ?', [name, id]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.put('/api/admin/users/:id/reset-password', authenticateToken, requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const password = (req.body?.password || '').trim();
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const db = await getDb();
    try {
        const existing = await db.get('SELECT id FROM users WHERE id = ?', [id]);
        if (!existing) return res.sendStatus(404);
        const hashedPassword = await bcrypt.hash(password, 12);
        await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, id]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    if (req.user?.id === id) return res.status(400).json({ error: 'Cannot delete your own account' });
    const db = await getDb();
    try {
        const target = await db.get('SELECT id, role FROM users WHERE id = ?', [id]);
        if (!target) return res.sendStatus(404);
        if (target.role === 'admin') {
            const admins = await db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
            if (admins?.count <= 1) return res.status(400).json({ error: 'Cannot delete the last admin account' });
        }
        await db.run('DELETE FROM user_progress WHERE user_id = ?', [id]);
        await db.run('DELETE FROM wazari_user_progress WHERE user_id = ?', [id]);
        await db.run('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Serve built frontend in production
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // Catch-all: serve index.html for all non-API routes (React SPA)
    app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
