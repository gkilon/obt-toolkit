
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  updateDoc
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  Auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
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

  registerWithEmail: async (name: string, email: string, password: string): Promise<User> => {
    if (!auth || !db) throw new Error("Firebase not initialized");
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user: User = {
      id: credential.user.uid,
      name,
      email,
      createdAt: Date.now()
    };
    await setDoc(doc(db, "users", user.id), user);
    return user;
  },

  loginWithEmail: async (email: string, password: string): Promise<User> => {
    if (!auth || !db) throw new Error("Firebase not initialized");
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const userSnap = await getDoc(doc(db, "users", credential.user.uid));
    if (!userSnap.exists()) throw new Error("User profile not found");
    return userSnap.data() as User;
  },

  loginWithGoogle: async (): Promise<User> => {
    if (!auth || !db) throw new Error("Firebase not initialized");
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;
    if (!fbUser.email) throw new Error("No email returned from Google");
    
    const userRef = doc(db, "users", fbUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const user = {
        id: fbUser.uid,
        name: fbUser.displayName || "משתמש גוגל",
        email: fbUser.email,
        createdAt: Date.now()
      };
      await setDoc(userRef, user);
      return user;
    }
    return userSnap.data() as User;
  },

  logout: async (): Promise<void> => {
    if (auth) await signOut(auth);
  },

  getSurveyQuestions: async (userId?: string): Promise<SurveyQuestion[]> => {
    if (!db) return [];
    // אם יש למשתמש שאלות מותאמות אישית (דורש הזדהות)
    if (userId && auth?.currentUser?.uid === userId) {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().customQuestions) {
          return userSnap.data().customQuestions as SurveyQuestion[];
        }
      } catch (e) {}
    }
    // הגדרות ציבוריות (מותאם לכלל public_content)
    try {
      const docRef = doc(db, "public_content", "survey_config");
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().questions) return snap.data().questions;
      return [
        { id: 'q1', text_he: 'מהו לדעתך הדבר האחד שהוא/היא צריכים לשנות כדי להגיע לרמה הבאה?', text_en: 'What is the one thing they should change to reach the next level?', type: 'goal', required: true },
        { id: 'q2', text_he: 'אילו התנהגויות מעכבות אותו/ה כיום?', text_en: 'Which behaviors currently hinder them?', type: 'blocker', required: true }
      ];
    } catch (e) { return []; }
  },

  updateSurveyQuestions: async (questions: SurveyQuestion[]): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, "public_content", "survey_config"), { questions }, { merge: true });
  },

  validateRegistrationCode: async (codeToCheck: string): Promise<boolean> => {
    if (!db) return false;
    const docSnap = await getDoc(doc(db, "public_content", "config"));
    const validCode = docSnap.exists() ? docSnap.data().registrationCode : "OBT-VIP";
    return codeToCheck.trim().toUpperCase() === validCode.toUpperCase();
  },

  // Fix: Adding missing resetPassword method to firebaseService
  resetPassword: async (email: string, registrationCode: string, newPassword: string): Promise<void> => {
    if (!db || !auth) throw new Error("Firebase not initialized");
    const valid = await firebaseService.validateRegistrationCode(registrationCode);
    if (!valid) throw new Error("קוד רישום שגוי.");
    
    // Direct password reset via client SDK for a specific email is not supported without OOB link.
    // Throwing a descriptive error to satisfy the API call in the UI while maintaining security.
    throw new Error("שחזור סיסמה ישיר אינו זמין מטעמי אבטחה. אנא השתמש בקישור 'שכחתי סיסמה' במייל.");
  },

  updateRegistrationCode: async (newCode: string): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, "public_content", "config"), { registrationCode: newCode }, { merge: true });
  },

  updateUserGoal: async (userId: string, goal: string): Promise<void> => {
    if (!db) return;
    await updateDoc(doc(db, "users", userId), { userGoal: goal });
  },

  getUser: async (userId: string): Promise<User | null> => {
    if (!db) return null;
    const snap = await getDoc(doc(db, "users", userId));
    return snap.exists() ? snap.data() as User : null;
  },

  addResponse: async (response: FeedbackResponse): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, "responses", response.id), response);
  },

  getResponsesForUser: async (userId: string): Promise<FeedbackResponse[]> => {
    if (!db) return [];
    try {
      const q = query(collection(db, "responses"), where("surveyId", "==", userId));
      const snap = await getDocs(q);
      const results: FeedbackResponse[] = [];
      
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data) {
          results.push({
            ...data,
            id: docSnap.id,
          } as FeedbackResponse);
        }
      });
      return results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (e) {
      console.error("Error fetching responses:", e);
      return [];
    }
  }
};
