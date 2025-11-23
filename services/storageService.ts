import { User, FeedbackResponse, FirebaseConfig } from '../types';
import { firebaseService } from './firebaseService';

// =================================================================
// הגדרות FIREBASE
// =================================================================

const HARDCODED_FIREBASE_CONFIG: FirebaseConfig | null = {
  apiKey: "AIzaSyBrrKJzMEHqnq5mwS8QuKjjPgMv46WRW-I",
  authDomain: "obt-ai-360.firebaseapp.com",
  projectId: "obt-ai-360",
  storageBucket: "obt-ai-360.firebasestorage.app",
  messagingSenderId: "333766329584",
  appId: "1:333766329584:web:25fe1dede13c710abe6e35",
  measurementId: "G-LBGDP262ZN"
}; 

// =================================================================

const USER_KEY = '360_user';
const RESPONSES_KEY = '360_responses';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export const storageService = {
  // Configuration
  getFirebaseConfig: (): FirebaseConfig | null => {
    if (HARDCODED_FIREBASE_CONFIG && 
        HARDCODED_FIREBASE_CONFIG.apiKey && 
        HARDCODED_FIREBASE_CONFIG.apiKey.length > 10) {
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
        console.warn("Storage Service: Running in LOCAL MODE (No Firebase keys).");
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

  login: async (email: string, password?: string): Promise<User | null> => {
    if (!storageService.isCloudEnabled()) {
        throw new Error("אין חיבור לענן. לא ניתן להתחבר.");
    }

    try {
        // Try finding by email (New Standard)
        const user = await firebaseService.findUserByEmail(email);
        
        if (user) {
           if (user.password === password) {
             storageService.setCurrentUser(user);
             return user;
           } else {
             throw new Error("סיסמה שגויה.");
           }
        } else {
            // User not found
            return null;
        }
    } catch (e: any) {
        console.error("Login error", e);
        throw e;
    }
  },

  registerUser: async (name: string, email: string, password?: string): Promise<User> => {
    if (!storageService.isCloudEnabled()) {
        throw new Error("שגיאת מערכת: אין חיבור לענן. לא ניתן ליצור חשבון ציבורי כרגע.");
    }

    // Check duplicates by Email
    const existing = await firebaseService.findUserByEmail(email);
    if (existing) {
        throw new Error("כתובת האימייל הזו כבר רשומה במערכת.");
    }

    const newUser: User = {
      id: generateId(),
      name,
      email,
      password,
      createdAt: Date.now(),
    };

    // Save to Cloud (Must succeed)
    try {
        await firebaseService.createUser(newUser);
    } catch (e) {
        console.error("Cloud create failed", e);
        throw new Error("נכשל הרישום לענן. אנא בדוק את החיבור לאינטרנט.");
    }

    // Save Locally
    storageService.setCurrentUser(newUser);
    return newUser;
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
  },

  // Response Management
  addResponse: async (surveyId: string, q1: string, q2: string) => {
    const newResponse: FeedbackResponse = {
      id: generateId(),
      surveyId,
      q1_change: q1,
      q2_actions: q2,
      timestamp: Date.now(),
    };

    // 1. Try Cloud
    if (storageService.isCloudEnabled()) {
      try {
        await firebaseService.addResponse(newResponse);
        return; // Success
      } catch (e) {
        console.error("Cloud save failed", e);
        throw new Error("שגיאה בשמירת הנתונים בענן.");
      }
    } else {
        throw new Error("אין חיבור לענן. לא ניתן לשלוח משוב.");
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
    // Always try Cloud first for survey links
    if (storageService.isCloudEnabled()) {
        const user = await firebaseService.getUser(userId);
        if (user) return user.name;
    }
    return ""; 
  }
};

// Initialize on load
storageService.init();