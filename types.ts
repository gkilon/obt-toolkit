export interface User {
  id: string;
  name: string;
  email: string; // Added for professional auth
  password?: string;
  createdAt: number;
}

export interface FeedbackResponse {
  id: string;
  surveyId: string; // Linked to User.id
  q1_change: string; // "What is the one thing..."
  q2_actions: string; // "What actions contradict..."
  timestamp: number;
}

export interface AnalysisResult {
  summary: string;
  keyThemes: string[];
  actionableAdvice: string;
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
  SURVEY = '/survey/:userId'
}