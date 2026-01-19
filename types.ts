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
  title: string;
  content: string;
}

export interface AnalysisResult {
  goalPrecision: {
    score: number; // 1-100
    critique: string;
    refinedGoal: string;
  };
  executiveSummary: string;
  question1Analysis: {
    opportunities: string[];
    alignmentLevel: string;
  };
  question2Analysis: {
    blockers: string[];
    psychologicalPatterns: string;
  };
  theOneBigThing: string;
  actionPlan: DeepInsight[];
  groupPerspectives: Record<string, string>;
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

export enum AppRoute {
  HOME = '/',
  DASHBOARD = '/dashboard',
  SURVEY = '/survey/:userId',
  ADMIN = '/admin'
}