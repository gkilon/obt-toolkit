
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  userGoal?: string; 
  createdAt: number;
}

export type RelationshipType = 'manager' | 'peer' | 'subordinate' | 'friend' | 'other';

export interface FeedbackResponse {
  id: string;
  surveyId: string;
  relationship: RelationshipType;
  q1_change: string;
  q2_actions: string;
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
    alignmentLevel?: string;
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
