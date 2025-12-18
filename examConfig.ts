
import { ExamType } from './types';

export interface ExamStructure {
  totalQuestions: number;
  sections: string[];
  durationMinutes: number;
}

export const EXAM_CONFIGS: Record<ExamType, ExamStructure> = {
  'UPSC': { totalQuestions: 100, sections: ['History', 'Polity', 'Geography', 'Economy', 'Science & Tech', 'Current Affairs'], durationMinutes: 120 },
  'SSC CGL': { totalQuestions: 100, sections: ['Reasoning', 'General Awareness', 'Quantitative Aptitude', 'English'], durationMinutes: 60 },
  'SSC CHSL': { totalQuestions: 100, sections: ['Reasoning', 'GA', 'Quant', 'English'], durationMinutes: 60 },
  'SSC GD': { totalQuestions: 80, sections: ['Reasoning', 'GK', 'Math', 'Hindi/English'], durationMinutes: 60 },
  'SSC MTS': { totalQuestions: 90, sections: ['Math', 'Reasoning', 'GA', 'English'], durationMinutes: 90 },
  'SSC Steno': { totalQuestions: 200, sections: ['GA', 'Reasoning', 'English'], durationMinutes: 120 },
  
  'IBPS PO': { totalQuestions: 100, sections: ['English', 'Quant', 'Reasoning'], durationMinutes: 60 },
  'IBPS Clerk': { totalQuestions: 100, sections: ['English', 'Quant', 'Reasoning'], durationMinutes: 60 },
  'SBI PO': { totalQuestions: 100, sections: ['English', 'Quant', 'Reasoning'], durationMinutes: 60 },
  'SBI Clerk': { totalQuestions: 100, sections: ['English', 'Quant', 'Reasoning'], durationMinutes: 60 },
  'RBI Grade B': { totalQuestions: 200, sections: ['GA', 'English', 'Quant', 'Reasoning'], durationMinutes: 120 },
  'RBI Assistant': { totalQuestions: 100, sections: ['English', 'Quant', 'Reasoning'], durationMinutes: 60 },
  
  'NDA': { totalQuestions: 120, sections: ['Mathematics', 'GAT'], durationMinutes: 150 },
  'CDS': { totalQuestions: 120, sections: ['English', 'GK', 'Math'], durationMinutes: 120 },
  'Agniveer': { totalQuestions: 50, sections: ['GK', 'Science', 'Math', 'Reasoning'], durationMinutes: 60 },
  'CAPF': { totalQuestions: 125, sections: ['GA', 'Intelligence', 'Quant'], durationMinutes: 120 },
  
  'CTET': { totalQuestions: 150, sections: ['CDP', 'Language I', 'Language II', 'Math', 'EVS'], durationMinutes: 150 },
  'UPTET': { totalQuestions: 150, sections: ['CDP', 'Hindi', 'English/Math', 'EVS'], durationMinutes: 150 },
  'STET': { totalQuestions: 150, sections: ['Teaching Skills', 'GA', 'Subject Knowledge'], durationMinutes: 150 },
  
  'RRB NTPC': { totalQuestions: 100, sections: ['GA', 'Math', 'Reasoning'], durationMinutes: 90 },
  'RRB Group D': { totalQuestions: 100, sections: ['Science', 'Math', 'Reasoning', 'GA'], durationMinutes: 90 },
  
  'UP Constable': { totalQuestions: 150, sections: ['GK', 'Hindi', 'Quant', 'Reasoning'], durationMinutes: 120 },
  'UP SI': { totalQuestions: 160, sections: ['Hindi', 'Law/GK', 'Quant', 'Reasoning'], durationMinutes: 120 },
  'Delhi Police': { totalQuestions: 100, sections: ['GK', 'Reasoning', 'Math', 'Computer'], durationMinutes: 90 },
  'JEE Main': { totalQuestions: 90, sections: ['Physics', 'Chemistry', 'Mathematics'], durationMinutes: 180 }
};
