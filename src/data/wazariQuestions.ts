export interface WazariQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
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
