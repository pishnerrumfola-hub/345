export interface Question {
  content: string;
  options?: string[];
  answer: string;
  analysis: string;
}

export interface WrongQuestionRecord {
  id: string;
  originalQuestion: Question;
  knowledgePoint: string;
  variants: Question[];
  createdAt: number;
}

export interface OCRResult {
  question: string;
  options: string[];
  userAnswer: string;
  standardAnswer: string;
  knowledgePoint: string;
}
