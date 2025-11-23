import { User, FeedbackResponse, FirebaseConfig } from '../types';
import { firebaseService } from './firebaseService';

// =================================================================
// 🔴 חובה למלא: הגדרות FIREBASE
// כדי שהאפליקציה תעבוד בין משתמשים שונים, חובה למלא את הפרטים מטה.
// ללא הפרטים האלו, הנתונים לא יישמרו בענן ולא יגיעו למשתמש.
// =================================================================

const HARDCODED_FIREBASE_CONFIG: FirebaseConfig | null = {
  apiKey: "AIzaSyBrrKJzMEHqnq5mwS8QuKjjPgMv46WRW-I",
  authDomain: "obt-ai-360.firebaseapp.com",
  projectId: "obt-ai-360",
  storageBucket: "obt-ai-360.firebasestorage.app",
  messagingSenderId: "333766329584",
  appId: "1:333766329584:web:25fe1dede13c710abe6e35"
}; 

// =================================================================

const USER_KEY = '360_user';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export const storageService = {
  // Configuration
  getFirebaseConfig: (): FirebaseConfig | null => {
    if (HARDCODED_FIREBASE_CONFIG && 
        HARDCODED_FIREBASE_CONFIG.apiKey && 
        !HARDCODED_FIREBASE_CONFIG.apiKey.includes("הדבק כאן")) {
        return HARDCODED_FIREBASE_CONFIG;
    }
    return null;
  },

  init: () => {
    const config = storageService.getFirebaseConfig();
    if (config) {
      const success = firebaseService.init(config);
      if (success) {
          console.log("Storage Service: Cloud connected successfully.");
      }
    } else {
        console.warn("Storage Service: Cloud NOT connected. Missing real Firebase keys in storageService.ts");
    }
  },

  isCloudEnabled: () => firebaseService.isInitialized(),

  // User Management
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  setCurrentUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  login: async (name: string, password?: string): Promise<User | null> => {
    if (storageService.isCloudEnabled()) {
      try {
        const user = await firebaseService.findUserByName(name);
        if (user && user.password === password) {
          storageService.setCurrentUser(user);
          return user;
        }
      } catch (e) {
        console.error("Cloud login failed", e);
      }
    }
    return null; 
  },

  registerUser: async (name: string, password?: string): Promise<User> => {
    const newUser: User = {
      id: generateId(),
      name,
      password,
      createdAt: Date.now(),
    };

    // Save locally just for current session
    storageService.setCurrentUser(newUser);

    // Save to Cloud - MUST SUCCEED for app to work properly
    if (storageService.isCloudEnabled()) {
      await firebaseService.createUser(newUser);
    } else {
        console.error("Critical: User created locally only because Firebase keys are missing.");
        throw new Error("לא ניתן ליצור משתמש: אין חיבור למסד הנתונים (Firebase).");
    }

    return newUser;
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
  },

  // Response Management
  addResponse: async (surveyId: string, q1: string, q2: string) => {
    // 🔴 Critical Change: Do NOT save to local storage if cloud fails.
    // This prevents the illusion of success.
    if (!storageService.isCloudEnabled()) {
        throw new Error("שגיאת מערכת חמורה: האפליקציה לא מחוברת לענן (Firebase). התשובה לא יכולה להישלח.");
    }

    const newResponse: FeedbackResponse = {
      id: generateId(),
      surveyId, // This links the response to the specific User ID
      q1_change: q1,
      q2_actions: q2,
      timestamp: Date.now(),
    };

    try {
      await firebaseService.addResponse(newResponse);
    } catch (e) {
      console.error("Cloud save failed", e);
      throw new Error("שגיאה בשמירת הנתונים בענן. אנא נסה שוב.");
    }
  },

  getResponsesForUser: async (userId: string): Promise<FeedbackResponse[]> => {
    if (storageService.isCloudEnabled()) {
      try {
        return await firebaseService.getResponsesForUser(userId);
      } catch (e) {
        console.error("Cloud fetch failed", e);
        return [];
      }
    }
    // Return empty if no cloud, do not fallback to local storage
    return [];
  },

  getUserNameById: async (userId: string): Promise<string> => {
    if (storageService.isCloudEnabled()) {
        const user = await firebaseService.getUser(userId);
        if (user) return user.name;
    }
    return ""; // Return empty if not found in cloud
  }
};

// Initialize on load
storageService.init();