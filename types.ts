
export type ExamType = 
  | 'UPSC' 
  | 'SSC CGL' | 'SSC CHSL' | 'SSC GD' | 'SSC MTS' | 'SSC Steno'
  | 'IBPS PO' | 'IBPS Clerk' | 'SBI PO' | 'SBI Clerk' | 'RBI Grade B' | 'RBI Assistant'
  | 'NDA' | 'CDS' | 'Agniveer' | 'CAPF'
  | 'CTET' | 'UPTET' | 'STET'
  | 'RRB NTPC' | 'RRB Group D'
  | 'UP Constable' | 'UP SI' | 'Delhi Police' 
  | 'JEE Main';

export type Language = 'English' | 'Hindi';
export type Difficulty = 'Low' | 'Medium' | 'High';
export type PlanType = 'Free' | 'Starter' | 'Advanced' | 'Mastery';

export interface UserProfile {
  name: string;
  avatar: string;
  plan: PlanType;
  masteryPoints: number;
  joinedAt: number;
  streak: number;
  lastActive: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  rank: number;
  isUser?: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  successLogic: string; 
  subject: string;
}

export interface UserPerformance {
  id: string;
  examType: ExamType;
  difficulty: Difficulty;
  totalScore: number;
  totalQuestions: number;
  questions: Question[];
  userAnswers: Record<string, number>;
  weakSubjects: string[];
  masteryGained: number;
  lastTestedAt: number;
  timeSpentSeconds: number;
}

export interface Transaction {
  id: string;
  plan: PlanType;
  amount: number;
  date: number;
  status: 'Success' | 'Pending';
}
