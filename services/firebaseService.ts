
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  limit,
  updateDoc
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { FirebaseConfig, User, FeedbackResponse, SurveyQuestion } from "../types";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export const firebaseService = {
  init: (config: FirebaseConfig) => {
    if (!config.apiKey || config.apiKey.length === 0) return false;
    try {
      const apps = getApps();
      app = apps.length > 0 ? getApp() : initializeApp(config);
      db = getFirestore(app);
      auth = getAuth(app);
      return true;
    } catch (e) {
      return false;
    }
  },

  isInitialized: () => !!db && !!auth,

  // --- Auth & User Operations ---
  loginWithGoogle: async (): Promise<User> => {
    if (!auth || !db) throw new Error("Firebase not initialized");
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    if (!fbUser.email) throw new Error("No email returned from Google");

    // בדוק אם המשתמש כבר קיים ב-Firestore
    let user = await firebaseService.findUserByEmail(fbUser.email);
    
    if (!user) {
      // אם משתמש חדש, צור רשומה (כאן אנחנו מאפשרים גוגל ללא קוד רישום כקיצור דרך)
      user = {
        id: fbUser.uid,
        name: fbUser.displayName || "משתמש גוגל",
        email: fbUser.email,
        createdAt: Date.now()
      };
      await firebaseService.createUser(user);
    }
    
    return user;
  },

  logout: async (): Promise<void> => {
    if (auth) {
      await auth.signOut();
    }
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
    if (!db) throw new Error("Database not connected");
    const valid = await firebaseService.validateRegistrationCode(code);
    if (!valid) throw new Error("קוד רישום שגוי.");
    
    const user = await firebaseService.findUserByEmail(email);
    if (!user) throw new Error("משתמש לא נמצא.");
    
    await updateDoc(doc(db, "users", user.id), { password: newPassword });
  },

  // --- Survey Config ---
  getSurveyQuestions: async (userId?: string): Promise<SurveyQuestion[]> => {
    if (!db) return [];
    
    if (userId) {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().customQuestions) {
          return userSnap.data().customQuestions as SurveyQuestion[];
        }
      } catch (e) {
        console.error("Error fetching user questions", e);
      }
    }

    try {
      const docRef = doc(db, "settings", "survey_config");
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().questions) {
        return snap.data().questions as SurveyQuestion[];
      }
      return [
        { 
          id: 'q1', 
          text_he: 'מהו לדעתך הדבר האחד שהוא/היא צריכים לשנות כדי להגיע לרמה הבאה?', 
          text_en: 'What is the one thing they should change to reach the next level?', 
          type: 'goal', 
          required: true 
        },
        { 
          id: 'q2', 
          text_he: 'אילו התנהגויות מעכבות אותו/ה כיום?', 
          text_en: 'Which behaviors currently hinder them?', 
          type: 'blocker', 
          required: true 
        }
      ];
    } catch (e) {
      return [];
    }
  },

  updateSurveyQuestions: async (questions: SurveyQuestion[]): Promise<void> => {
    if (!db) return;
    const docRef = doc(db, "settings", "survey_config");
    await setDoc(docRef, { questions }, { merge: true });
  },

  updateUserQuestions: async (userId: string, questions: SurveyQuestion[]): Promise<void> => {
    if (!db) throw new Error("Database disconnected");
    await updateDoc(doc(db, "users", userId), { customQuestions: questions });
  },

  // --- Registration Code ---
  validateRegistrationCode: async (codeToCheck: string): Promise<boolean> => {
    if (!db) return false;
    const configRef = doc(db, "settings", "config");
    const docSnap = await getDoc(configRef);
    const validCode = docSnap.exists() ? docSnap.data().registrationCode : "OBT-VIP";
    return codeToCheck.trim().toUpperCase() === validCode.toUpperCase();
  },

  updateRegistrationCode: async (newCode: string): Promise<void> => {
    if (!db) throw new Error("Database not connected");
    const configRef = doc(db, "settings", "config");
    await setDoc(configRef, { registrationCode: newCode }, { merge: true });
  },

  // --- User Operations ---
  createUser: async (user: User): Promise<void> => {
    if (!db) throw new Error("Database not connected");
    await setDoc(doc(db, "users", user.id), user);
  },

  updateUserGoal: async (userId: string, goal: string): Promise<void> => {
    if (!db) throw new Error("Database disconnected");
    await updateDoc(doc(db, "users", userId), { userGoal: goal });
  },

  getUser: async (userId: string): Promise<User | null> => {
    if (!db) return null;
    const snap = await getDoc(doc(db, "users", userId));
    return snap.exists() ? snap.data() as User : null;
  },

  findUserByEmail: async (email: string): Promise<User | null> => {
    if (!db) return null;
    const q = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0].data() as User;
  },

  // --- Response Operations ---
  addResponse: async (response: FeedbackResponse): Promise<void> => {
    if (!db) throw new Error("Database not connected");
    await setDoc(doc(db, "responses", response.id), response);
  },

  getResponsesForUser: async (userId: string): Promise<FeedbackResponse[]> => {
    if (!db) return [];
    const q = query(collection(db, "responses"), where("surveyId", "==", userId));
    const snap = await getDocs(q);
    const results: FeedbackResponse[] = [];
    snap.forEach(doc => results.push(doc.data() as FeedbackResponse));
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }
};
