import { User, FeedbackResponse, FirebaseConfig, RelationshipType } from '../types';
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

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const storageService = {
  
  init: () => {
    if (firebaseService.isInitialized()) return;
    const success = firebaseService.init(HARDCODED_FIREBASE_CONFIG);
    if (!success) console.error("CRITICAL: Failed to connect to Firebase Cloud.");
  },

  isCloudEnabled: () => firebaseService.isInitialized(),
  testConnection: async () => firebaseService.testConnection(),

  getCurrentUser: (): User | null => {
    try {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
  },

  // ADMIN
  updateRegistrationCode: async (newCode: string): Promise<void> => {
      if (!storageService.isCloudEnabled()) throw new Error("שגיאת חיבור לשרת.");
      await firebaseService.updateRegistrationCode(newCode);
  },

  // LOGIN
  login: async (email: string, password?: string): Promise<User> => {
    if (!storageService.isCloudEnabled()) throw new Error("שגיאת חיבור לשרת.");

    const user = await firebaseService.findUserByEmail(email);
    if (!user) throw new Error("משתמש לא קיים.");

    // Simple password check
    if (user.password !== password) throw new Error("סיסמה שגויה.");

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  // REGISTER (With Access Code)
  registerUser: async (name: string, email: string, password?: string, registrationCode?: string): Promise<User> => {
    if (!storageService.isCloudEnabled()) throw new Error("שגיאת חיבור לשרת.");

    // 1. Validate Access Code
    if (!registrationCode) throw new Error("נדרש קוד רישום (Registration Code).");
    const isValidCode = await firebaseService.validateRegistrationCode(registrationCode);
    if (!isValidCode) {
        throw new Error("קוד רישום שגוי. אנא פנה למנהל המערכת.");
    }

    // 2. Check existing
    const existing = await firebaseService.findUserByEmail(email);
    if (existing) throw new Error("כתובת האימייל כבר רשומה.");

    const newUser: User = {
      id: generateId(),
      name,
      email,
      password,
      createdAt: Date.now(),
    };

    // 3. Create
    await firebaseService.createUser(newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  // RESET PASSWORD
  resetPassword: async (email: string, registrationCode: string, newPassword: string): Promise<void> => {
    if (!storageService.isCloudEnabled()) throw new Error("שגיאת חיבור לשרת.");

    // 1. Verify Code (Admin Auth)
    const isValidCode = await firebaseService.validateRegistrationCode(registrationCode);
    if (!isValidCode) throw new Error("קוד אימות שגוי. לא ניתן לאפס סיסמה ללא הרשאה.");

    // 2. Find User
    const user = await firebaseService.findUserByEmail(email);
    if (!user) throw new Error("לא נמצא משתמש עם האימייל הזה.");

    // 3. Update
    await firebaseService.updatePassword(user.id, newPassword);
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
  },

  addResponse: async (surveyId: string, relationship: RelationshipType, q1: string, q2: string) => {
    const newResponse: FeedbackResponse = {
      id: generateId(),
      surveyId,
      relationship,
      q1_change: q1,
      q2_actions: q2,
      timestamp: Date.now(),
    };

    if (storageService.isCloudEnabled()) {
      await firebaseService.addResponse(newResponse);
    } else {
        throw new Error("אין חיבור לשרת.");
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

storageService.init();