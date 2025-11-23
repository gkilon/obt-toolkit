import { User, FeedbackResponse, FirebaseConfig } from '../types';
import { firebaseService } from './firebaseService';

// =================================================================
// 🔴 חובה למלא: הגדרות FIREBASE
// כדי שהאפליקציה תעבוד בין משתמשים שונים, חובה למלא את הפרטים מטה.
// ללא הפרטים האלו, הנתונים לא יישמרו בענן ולא יגיעו למשתמש.
// =================================================================

const HARDCODED_FIREBASE_CONFIG: FirebaseConfig | null = {
  apiKey: "הדבק כאן את ה-API Key",
  authDomain: "הדבק כאן (למשל your-app.firebaseapp.com)",
  projectId: "הדבק כאן (למשל your-app)",
  storageBucket: "הדבק כאן (למשל your-app.appspot.com)",
  messagingSenderId: "הדבק כאן את מספר השולח",
  appId: "הדבק כאן את ה-App ID"
}; 

// =================================================================

const USER_KEY = '360_user';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export const storageService = {
  // Configuration
  getFirebaseConfig: (): FirebaseConfig | null => {
    // בדיקה שהמשתנה קיים ושדה ה-apiKey לא מכיל את טקסט ברירת המחדל
    // אם לא מילאת את הפרטים, המערכת לא תתחבר לענן
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
    // אם אין ענן, אי אפשר להתחבר באפליקציה ציבורית
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
    }

    return newUser;
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
  },

  // Response Management
  addResponse: async (surveyId: string, q1: string, q2: string) => {
    if (!storageService.isCloudEnabled()) {
        throw new Error("שגיאת מערכת: אין חיבור למסד נתונים (Firebase Keys Missing). התשובה לא נשמרה.");
    }

    const newResponse: FeedbackResponse = {
      id: generateId(),
      surveyId,
      q1_change: q1,
      q2_actions: q2,
      timestamp: Date.now(),
    };

    try {
      await firebaseService.addResponse(newResponse);
    } catch (e) {
      console.error("Cloud save failed", e);
      throw new Error("שגיאה בשמירת הנתונים בענן.");
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
    return [];
  },

  getUserNameById: async (userId: string): Promise<string> => {
    if (storageService.isCloudEnabled()) {
        const user = await firebaseService.getUser(userId);
        if (user) return user.name;
    }
    // אם הגענו לכאן, כנראה שאין חיבור לענן
    return "החבר/ה שלך";
  }
};

// Initialize on load
storageService.init();