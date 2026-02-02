
import { User, FeedbackResponse, FirebaseConfig, RelationshipType, SurveyQuestion } from '../types';
import { firebaseService } from './firebaseService';

const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || ""
}; 

const USER_KEY = '360_user_session';
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const storageService = {
  init: () => {
    if (firebaseService.isInitialized()) return;
    firebaseService.init(FIREBASE_CONFIG);
  },

  isCloudEnabled: () => firebaseService.isInitialized(),

  getSurveyQuestions: async (userId?: string) => firebaseService.getSurveyQuestions(userId),
  updateSurveyQuestions: async (questions: SurveyQuestion[]) => firebaseService.updateSurveyQuestions(questions),
  
  // Fix: Adding missing resetPassword method to storageService
  resetPassword: async (email: string, registrationCode: string, newPassword: string) => 
    firebaseService.resetPassword(email, registrationCode, newPassword),

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  updateRegistrationCode: async (newCode: string) => firebaseService.updateRegistrationCode(newCode),

  login: async (email: string, password?: string): Promise<User> => {
    if (!password) throw new Error("Password required");
    const user = await firebaseService.loginWithEmail(email, password);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  loginWithGoogle: async (): Promise<User> => {
    const user = await firebaseService.loginWithGoogle();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  registerUser: async (name: string, email: string, password?: string, registrationCode?: string): Promise<User> => {
    if (!registrationCode) throw new Error("נדרש קוד רישום.");
    const valid = await firebaseService.validateRegistrationCode(registrationCode);
    if (!valid) throw new Error("קוד רישום שגוי.");
    if (!password) throw new Error("נדרשת סיסמה.");
    
    const newUser = await firebaseService.registerWithEmail(name, email, password);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  updateUserGoal: async (userId: string, goal: string) => {
    await firebaseService.updateUserGoal(userId, goal);
    const current = storageService.getCurrentUser();
    if (current && current.id === userId) {
      localStorage.setItem(USER_KEY, JSON.stringify({ ...current, userGoal: goal }));
    }
  },

  logout: async () => {
    await firebaseService.logout();
    localStorage.removeItem(USER_KEY);
  },

  addResponse: async (surveyId: string, relationship: RelationshipType, answers: {questionId: string, text: string}[]) => {
    const newResponse: FeedbackResponse = {
      id: generateId(),
      surveyId,
      relationship,
      answers,
      timestamp: Date.now(),
    };
    await firebaseService.addResponse(newResponse);
  },

  getResponsesForUser: async (userId: string) => firebaseService.getResponsesForUser(userId),

  getUserDataById: async (userId: string) => {
    const user = await firebaseService.getUser(userId);
    return user ? { 
      name: user.name, 
      userGoal: user.userGoal,
      customQuestions: user.customQuestions 
    } : { name: "משתמש" };
  }
};

storageService.init();
