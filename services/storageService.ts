import { User, FeedbackResponse, FirebaseConfig, RelationshipType } from '../types';
import { firebaseService } from './firebaseService';

// =================================================================
// הגדרות FIREBASE (ממשתני סביבה בלבד)
// =================================================================

const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || ""
}; 

// =================================================================

const USER_KEY = '360_user_session';

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const storageService = {
  
  init: () => {
    if (firebaseService.isInitialized()) return;
    
    // Check if config exists
    if (!FIREBASE_CONFIG.apiKey) {
        console.warn("Notice: Firebase Configuration missing in Environment Variables. App running in offline mode.");
        return;
    }

    const success = firebaseService.init(FIREBASE_CONFIG);
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

  // LOGIN (EMAIL)
  login: async (email: string, password?: string): Promise<User> => {
    if (!storageService.isCloudEnabled()) throw new Error("שגיאת חיבור לשרת (חסרה קונפיגורציה).");

    const user = await firebaseService.findUserByEmail(email);
    if (!user) throw new Error("משתמש לא קיים.");

    // Simple password check
    if (user.password !== password) throw new Error("סיסמה שגויה.");

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  // LOGIN (GOOGLE)
  loginWithGoogle: async (): Promise<User> => {
      if (!storageService.isCloudEnabled()) throw new Error("שגיאת חיבור לשרת (חסרה קונפיגורציה).");
      
      const firebaseUser = await firebaseService.loginWithGoogle();
      if (!firebaseUser.email) throw new Error("לא התקבל אימייל מגוגל.");

      // Check if user already exists in OUR database
      let user = await firebaseService.findUserByEmail(firebaseUser.email);

      if (!user) {
          // New user from Google - Create account automatically
          user = {
              id: generateId(),
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
              createdAt: Date.now()
          };
          await firebaseService.createUser(user);
      }

      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
  },

  // REGISTER (With Access Code)
  registerUser: async (name: string, email: string, password?: string, registrationCode?: string): Promise<User> => {
    if (!storageService.isCloudEnabled()) throw new Error("שגיאת חיבור לשרת (חסרה קונפיגורציה).");

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
    if (!storageService.isCloudEnabled()) throw new Error("שגיאת חיבור לשרת (חסרה קונפיגורציה).");

    // 1. Verify Code (Admin Auth)
    const isValidCode = await firebaseService.validateRegistrationCode(registrationCode);
    if (!isValidCode) throw new Error("קוד אימות שגוי. לא ניתן לאפס סיסמה ללא הרשאה.");

    // 2. Find User
    const user = await firebaseService.findUserByEmail(email);
    if (!user) throw new Error("לא נמצא משתמש עם האימייל הזה.");

    // 3. Update
    await firebaseService.updatePassword(user.id, newPassword);
  },

  logout: async () => {
    await firebaseService.logout();
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
        // Fallback for demo mode - log but don't save to cloud
        console.warn("Cloud not enabled. Response not saved to DB.", newResponse);
        throw new Error("אין חיבור לשרת (שמירה בענן נכשלה).");
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