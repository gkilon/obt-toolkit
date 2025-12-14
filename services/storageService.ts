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
    
    // Debug Log - helps diagnose connection issues
    if (FIREBASE_CONFIG.apiKey) {
        console.log("Initializing Storage Service with Key: " + FIREBASE_CONFIG.apiKey.substring(0, 4) + "...");
        const success = firebaseService.init(FIREBASE_CONFIG);
        if (!success) console.error("Failed to connect to Firebase Cloud.");
    } else {
        console.warn("Storage Init: No API Key found. App will run in Offline/Demo mode.");
    }
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
      if (storageService.isCloudEnabled()) {
          await firebaseService.updateRegistrationCode(newCode);
      } else {
          throw new Error("אין חיבור לענן. לא ניתן לעדכן קוד.");
      }
  },

  // LOGIN (EMAIL)
  login: async (email: string, password?: string): Promise<User> => {
    // Must be cloud based
    if (!storageService.isCloudEnabled()) throw new Error("מצב אופליין: לא ניתן להתחבר עם חשבון קיים.");

    const user = await firebaseService.findUserByEmail(email);
    if (user && user.password === password) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            return user;
    }

    throw new Error("משתמש לא נמצא או סיסמה שגויה.");
  },

  // CLOUD GUEST LOGIN (Anonymous Session that SAVES to DB)
  loginAsGuest: async (): Promise<User> => {
     // 1. Generate a UNIQUE real ID
     const guestId = generateId();
     
     // 2. Create User Object
     const guestUser: User = {
          id: guestId,
          name: 'אורח מערכת', 
          email: `guest_${guestId}@obt.system`, // Fake email identifier
          createdAt: Date.now()
      };

      // 3. Save to Cloud DB so links work for others
      if (storageService.isCloudEnabled()) {
           try {
            await firebaseService.createUser(guestUser);
           } catch (e) {
             console.error("Cloud creation failed", e);
             throw new Error("שגיאה ביצירת משתמש ענן. אנא בדוק חיבור אינטרנט.");
           }
      } else {
           console.warn("Running in Offline Mode: Guest user created locally only.");
      }
      
      localStorage.setItem(USER_KEY, JSON.stringify(guestUser));
      return guestUser;
  },

  // REGISTER (With Access Code)
  registerUser: async (name: string, email: string, password?: string, registrationCode?: string): Promise<User> => {
    if (!storageService.isCloudEnabled()) throw new Error("מצב אופליין: לא ניתן להירשם.");
    
    if (!registrationCode) throw new Error("נדרש קוד רישום.");
    
    const cloudValid = await firebaseService.validateRegistrationCode(registrationCode);
    if (!cloudValid) throw new Error("קוד רישום שגוי.");
    
    const existing = await firebaseService.findUserByEmail(email);
    if (existing) throw new Error("המייל כבר קיים במערכת.");

    const newUser: User = {
      id: generateId(),
      name,
      email,
      password,
      createdAt: Date.now(),
    };

    await firebaseService.createUser(newUser);
    
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  // UPDATE USER GOAL
  updateUserGoal: async (userId: string, goal: string): Promise<void> => {
      // 1. Update Local Storage
      const currentUser = storageService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
          const updatedUser = { ...currentUser, userGoal: goal };
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }

      // 2. Update Cloud
      if (storageService.isCloudEnabled()) {
          await firebaseService.updateUserGoal(userId, goal);
      }
  },

  // RESET PASSWORD
  resetPassword: async (email: string, registrationCode: string, newPassword: string): Promise<void> => {
    if (!storageService.isCloudEnabled()) throw new Error("אין חיבור לענן.");
    
    const isValid = await firebaseService.validateRegistrationCode(registrationCode);
    if (!isValid) throw new Error("קוד שגוי.");
    const user = await firebaseService.findUserByEmail(email);
    if (!user) throw new Error("משתמש לא נמצא.");
    await firebaseService.updatePassword(user.id, newPassword);
  },

  logout: async () => {
    if (storageService.isCloudEnabled()) {
        await firebaseService.logout();
    }
    localStorage.removeItem(USER_KEY);
  },

  // DATA OPERATIONS

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
        throw new Error("שגיאה: במצב אופליין לא ניתן לשמור תשובות.");
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

  getUserDataById: async (userId: string): Promise<{name: string, userGoal?: string}> => {
    if (storageService.isCloudEnabled()) {
        const user = await firebaseService.getUser(userId);
        if (user) return { name: user.name, userGoal: user.userGoal };
    }
    // Only fallback to session if it matches
    const currentUser = storageService.getCurrentUser();
    if (currentUser && currentUser.id === userId) return { name: currentUser.name, userGoal: currentUser.userGoal };
    
    return { name: "משתמש" }; 
  }
};

storageService.init();