import { User, FeedbackResponse, FirebaseConfig } from '../types';
import { firebaseService } from './firebaseService';

// =================================================================
// הגדרות FIREBASE
// =================================================================

const HARDCODED_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyBrrKJzMEHqnq5mwS8QuKjjPgMv46WRW-I",
  authDomain: "obt-ai-360.firebaseapp.com",
  projectId: "obt-ai-360",
  storageBucket: "obt-ai-360.firebasestorage.app",
  messagingSenderId: "333766329584",
  appId: "1:333766329584:web:25fe1dede13c710abe6e35",
  measurementId: "G-LBGDP262ZN"
}; 

// =================================================================

const USER_KEY = '360_user_session';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const storageService = {
  
  init: () => {
    // Only init if not already done
    if (firebaseService.isInitialized()) return;

    const success = firebaseService.init(HARDCODED_FIREBASE_CONFIG);
    if (!success) {
        console.error("CRITICAL: Failed to connect to Firebase Cloud.");
    }
  },

  isCloudEnabled: () => firebaseService.isInitialized(),

  // User Management
  getCurrentUser: (): User | null => {
    try {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
  },

  // LOGIN: Strict Cloud Check
  login: async (email: string, password?: string): Promise<User> => {
    if (!storageService.isCloudEnabled()) {
        throw new Error("שגיאת תקשורת: אין חיבור לשרת.");
    }

    try {
        const user = await firebaseService.findUserByEmail(email);
        
        if (!user) {
            throw new Error("משתמש לא קיים. אנא בדוק את האימייל או הירשם.");
        }

        // Simple password check (In a real production app, utilize Firebase Auth instead of Firestore for users)
        if (user.password !== password) {
             throw new Error("סיסמה שגויה.");
        }

        // Save session locally only AFTER successful cloud verification
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;

    } catch (e: any) {
        console.error("Login logic error", e);
        throw e;
    }
  },

  // REGISTER: Strict Cloud Creation
  registerUser: async (name: string, email: string, password?: string): Promise<User> => {
    if (!storageService.isCloudEnabled()) {
        throw new Error("שגיאת תקשורת: לא ניתן ליצור חשבון כרגע.");
    }

    // 1. Check if email already exists
    const existing = await firebaseService.findUserByEmail(email);
    if (existing) {
        throw new Error("כתובת האימייל הזו כבר רשומה במערכת. אנא נסה להתחבר.");
    }

    const newUser: User = {
      id: generateId(),
      name,
      email,
      password, // Note: storing plain text password is bad practice for production, but fits this demo scope
      createdAt: Date.now(),
    };

    // 2. Create in Cloud
    try {
        await firebaseService.createUser(newUser);
    } catch (e) {
        throw new Error("נכשל הרישום לשרת. אנא נסה שנית.");
    }

    // 3. Login immediately
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
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

    if (storageService.isCloudEnabled()) {
      await firebaseService.addResponse(newResponse);
    } else {
        throw new Error("אין חיבור לשרת. לא ניתן לשלוח משוב.");
    }
  },

  getResponsesForUser: async (userId: string): Promise<FeedbackResponse[]> => {
    if (storageService.isCloudEnabled()) {
       return await firebaseService.getResponsesForUser(userId);
    }
    return [];
  },

  getUserNameById: async (userId: string): Promise<string> => {
    if (storageService.isCloudEnabled()) {
        const user = await firebaseService.getUser(userId);
        if (user) return user.name;
    }
    return ""; 
  }
};

// Initial run
storageService.init();