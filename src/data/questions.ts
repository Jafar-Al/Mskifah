// ========================================
// QUESTIONS DATA - EASY TO EDIT!
// ========================================
// Each week has 15 questions
// Each question has: id, question, options (3 choices), correctAnswer (index 0-2)
// Points are awarded for correct answers

export interface Question {
  id: number;
  question: string;
  options: [string, string, string];
  correctAnswer: 0 | 1 | 2;
  points: number;
  imageUrl?: string | null;
}

export interface Week {
  id: number;
  title: string;
  isUnlocked: boolean; // Admin controls this
  questions: Question[];
}

export const weeksData: Week[] = [
  {
    id: 1,
    title: "Week 1",
    isUnlocked: true, // Set to true to unlock this week
    questions: [
      { id: 1, question: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome"], correctAnswer: 1, points: 10 },
      { id: 2, question: "Which organelle is responsible for protein synthesis?", options: ["Ribosome", "Lysosome", "Golgi apparatus"], correctAnswer: 0, points: 10 },
      { id: 3, question: "What is the basic unit of life?", options: ["Tissue", "Organ", "Cell"], correctAnswer: 2, points: 10 },
      { id: 4, question: "Which molecule carries genetic information?", options: ["RNA", "DNA", "Protein"], correctAnswer: 1, points: 10 },
      { id: 5, question: "What is the process of cell division called?", options: ["Mitosis", "Osmosis", "Diffusion"], correctAnswer: 0, points: 10 },
      { id: 6, question: "Which structure controls what enters and leaves the cell?", options: ["Cell wall", "Cell membrane", "Cytoplasm"], correctAnswer: 1, points: 10 },
      { id: 7, question: "What is the gel-like substance inside cells?", options: ["Cytoplasm", "Nucleoplasm", "Protoplasm"], correctAnswer: 0, points: 10 },
      { id: 8, question: "Which organelle contains digestive enzymes?", options: ["Peroxisome", "Lysosome", "Centrosome"], correctAnswer: 1, points: 10 },
      { id: 9, question: "What is the function of chloroplasts?", options: ["Respiration", "Photosynthesis", "Digestion"], correctAnswer: 1, points: 10 },
      { id: 10, question: "Which organelle stores water in plant cells?", options: ["Vacuole", "Vesicle", "Plastid"], correctAnswer: 0, points: 10 },
      { id: 11, question: "What is the shape of DNA?", options: ["Single helix", "Double helix", "Triple helix"], correctAnswer: 1, points: 10 },
      { id: 12, question: "Which base pairs with Adenine?", options: ["Guanine", "Cytosine", "Thymine"], correctAnswer: 2, points: 10 },
      { id: 13, question: "What is the process of copying DNA called?", options: ["Translation", "Transcription", "Replication"], correctAnswer: 2, points: 10 },
      { id: 14, question: "Which organelle modifies and packages proteins?", options: ["ER", "Golgi apparatus", "Ribosome"], correctAnswer: 1, points: 10 },
      { id: 15, question: "What type of cell lacks a nucleus?", options: ["Eukaryotic", "Prokaryotic", "Multicellular"], correctAnswer: 1, points: 10 },
    ],
  },
  {
    id: 2,
    title: "Week 2",
    isUnlocked: false, // Set to true to unlock this week
    questions: [
      { id: 1, question: "What is the process by which plants make food?", options: ["Respiration", "Photosynthesis", "Fermentation"], correctAnswer: 1, points: 10 },
      { id: 2, question: "Which pigment gives plants their green color?", options: ["Carotene", "Chlorophyll", "Xanthophyll"], correctAnswer: 1, points: 10 },
      { id: 3, question: "What gas do plants release during photosynthesis?", options: ["Carbon dioxide", "Nitrogen", "Oxygen"], correctAnswer: 2, points: 10 },
      { id: 4, question: "Where does photosynthesis occur?", options: ["Mitochondria", "Chloroplast", "Nucleus"], correctAnswer: 1, points: 10 },
      { id: 5, question: "What is the main product of photosynthesis?", options: ["Protein", "Glucose", "Fat"], correctAnswer: 1, points: 10 },
      { id: 6, question: "Which part of the plant absorbs water?", options: ["Leaves", "Stem", "Roots"], correctAnswer: 2, points: 10 },
      { id: 7, question: "What is transpiration?", options: ["Water absorption", "Water loss", "Water storage"], correctAnswer: 1, points: 10 },
      { id: 8, question: "Which tissue transports water in plants?", options: ["Phloem", "Xylem", "Cambium"], correctAnswer: 1, points: 10 },
      { id: 9, question: "What transports sugar in plants?", options: ["Xylem", "Phloem", "Epidermis"], correctAnswer: 1, points: 10 },
      { id: 10, question: "What are stomata?", options: ["Root cells", "Leaf pores", "Stem tissues"], correctAnswer: 1, points: 10 },
      { id: 11, question: "Which cells control stomata opening?", options: ["Guard cells", "Palisade cells", "Spongy cells"], correctAnswer: 0, points: 10 },
      { id: 12, question: "What is the equation for photosynthesis?", options: ["CO2 + H2O → C6H12O6 + O2", "C6H12O6 + O2 → CO2 + H2O", "N2 + H2 → NH3"], correctAnswer: 0, points: 10 },
      { id: 13, question: "Light reactions occur in which structure?", options: ["Stroma", "Thylakoid", "Matrix"], correctAnswer: 1, points: 10 },
      { id: 14, question: "The Calvin cycle occurs in the?", options: ["Thylakoid", "Stroma", "Cytoplasm"], correctAnswer: 1, points: 10 },
      { id: 15, question: "What is the role of ATP in cells?", options: ["Storage", "Energy currency", "Structure"], correctAnswer: 1, points: 10 },
    ],
  },
  {
    id: 3,
    title: "Week 3",
    isUnlocked: false, // Set to true to unlock this week
    questions: [
      { id: 1, question: "What is cellular respiration?", options: ["Making food", "Breaking down glucose", "Cell division"], correctAnswer: 1, points: 10 },
      { id: 2, question: "Where does glycolysis occur?", options: ["Mitochondria", "Cytoplasm", "Nucleus"], correctAnswer: 1, points: 10 },
      { id: 3, question: "How many ATP are produced in glycolysis?", options: ["2 ATP", "36 ATP", "4 ATP"], correctAnswer: 0, points: 10 },
      { id: 4, question: "The Krebs cycle occurs in?", options: ["Cytoplasm", "Matrix", "Cristae"], correctAnswer: 1, points: 10 },
      { id: 5, question: "What is the final electron acceptor in ETC?", options: ["Carbon dioxide", "Water", "Oxygen"], correctAnswer: 2, points: 10 },
      { id: 6, question: "Anaerobic respiration produces?", options: ["More ATP", "Less ATP", "No ATP"], correctAnswer: 1, points: 10 },
      { id: 7, question: "What is fermentation?", options: ["Aerobic process", "Anaerobic process", "Photosynthesis"], correctAnswer: 1, points: 10 },
      { id: 8, question: "Yeast fermentation produces?", options: ["Lactic acid", "Ethanol", "Acetic acid"], correctAnswer: 1, points: 10 },
      { id: 9, question: "Muscle fermentation produces?", options: ["Ethanol", "Lactic acid", "Pyruvate"], correctAnswer: 1, points: 10 },
      { id: 10, question: "How many ATP from one glucose (aerobic)?", options: ["2 ATP", "18 ATP", "36-38 ATP"], correctAnswer: 2, points: 10 },
      { id: 11, question: "NAD+ is a?", options: ["Enzyme", "Electron carrier", "Protein"], correctAnswer: 1, points: 10 },
      { id: 12, question: "What is FADH2?", options: ["Sugar", "Electron carrier", "Hormone"], correctAnswer: 1, points: 10 },
      { id: 13, question: "Oxidative phosphorylation occurs in?", options: ["Cytoplasm", "Inner membrane", "Outer membrane"], correctAnswer: 1, points: 10 },
      { id: 14, question: "What drives ATP synthesis?", options: ["Proton gradient", "Electron flow", "Heat"], correctAnswer: 0, points: 10 },
      { id: 15, question: "ATP synthase is a/an?", options: ["Carrier", "Enzyme", "Hormone"], correctAnswer: 1, points: 10 },
    ],
  },
  {
    id: 4,
    title: "Week 4",
    isUnlocked: false, // Set to true to unlock this week
    questions: [
      { id: 1, question: "What is genetics?", options: ["Study of cells", "Study of heredity", "Study of ecology"], correctAnswer: 1, points: 10 },
      { id: 2, question: "Who is the father of genetics?", options: ["Darwin", "Mendel", "Watson"], correctAnswer: 1, points: 10 },
      { id: 3, question: "What is a gene?", options: ["Chromosome part", "Unit of heredity", "Cell organelle"], correctAnswer: 1, points: 10 },
      { id: 4, question: "What is an allele?", options: ["Gene variant", "Chromosome", "Protein"], correctAnswer: 0, points: 10 },
      { id: 5, question: "Dominant alleles are represented by?", options: ["Lowercase", "Uppercase", "Numbers"], correctAnswer: 1, points: 10 },
      { id: 6, question: "What is a genotype?", options: ["Physical traits", "Genetic makeup", "Behavior"], correctAnswer: 1, points: 10 },
      { id: 7, question: "What is a phenotype?", options: ["Genetic code", "Observable traits", "DNA sequence"], correctAnswer: 1, points: 10 },
      { id: 8, question: "Homozygous means?", options: ["Same alleles", "Different alleles", "No alleles"], correctAnswer: 0, points: 10 },
      { id: 9, question: "Heterozygous means?", options: ["Same alleles", "Different alleles", "One allele"], correctAnswer: 1, points: 10 },
      { id: 10, question: "What is a Punnett square?", options: ["DNA model", "Genetic prediction tool", "Cell diagram"], correctAnswer: 1, points: 10 },
      { id: 11, question: "What ratio does Mendel's monohybrid cross give?", options: ["1:2:1", "3:1", "9:3:3:1"], correctAnswer: 1, points: 10 },
      { id: 12, question: "What is codominance?", options: ["One allele dominates", "Both alleles expressed", "Neither expressed"], correctAnswer: 1, points: 10 },
      { id: 13, question: "Blood type is an example of?", options: ["Codominance", "Multiple alleles", "Both A and B"], correctAnswer: 2, points: 10 },
      { id: 14, question: "What causes genetic mutations?", options: ["Only radiation", "DNA changes", "Only chemicals"], correctAnswer: 1, points: 10 },
      { id: 15, question: "What is a carrier?", options: ["Has disease", "Carries recessive allele", "Has immunity"], correctAnswer: 1, points: 10 },
    ],
  },
];
