export interface WazariQuestion {
  id: number;
  question: string;
  options: [string, string, string];
  correctAnswer: 0 | 1 | 2;
  points: number;
  imageUrl?: string | null;
}

export interface WazariLesson {
  id: number;
  title: string;
  unitTitle: string;
  isUnlocked: boolean;
  questions: WazariQuestion[];
}
