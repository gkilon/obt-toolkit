
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  userGoal?: string; 
  createdAt: number;
}

export type RelationshipType = 'manager' | 'peer' | 'subordinate' | 'friend' | 'other';
export type QuestionType = 'goal' | 'blocker' | 'general';

export interface SurveyQuestion {
  id: string;
  text_he: string;
  text_en: string;
  type: QuestionType;
  required: boolean;
}

export interface FeedbackResponse {
  id: string;
  surveyId: string;
  relationship: RelationshipType;
  answers: { questionId: string; text: string }[];
  timestamp: number;
}

export interface DeepInsight {
  title_he: string;
  title_en: string;
  content_he: string;
  content_en: string;
}

export interface AnalysisResult {
  goalPrecision: {
    score: number;
    critique_he: string;
    critique_en: string;
    refinedGoal_he: string;
    refinedGoal_en: string;
  };
  executiveSummary_he: string;
  executiveSummary_en: string;
  theOneBigThing_he: string;
  theOneBigThing_en: string;
  alternativeOBT_he: string;
  alternativeOBT_en: string;
  question1Analysis: {
    opportunities_he: string[];
    opportunities_en: string[];
  };
  question2Analysis: {
    blockers_he: string[];
    blockers_en: string[];
    psychologicalPatterns_he: string;
    psychologicalPatterns_en: string;
  };
  actionPlan: DeepInsight[];
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}
