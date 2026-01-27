
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

  loginWithGoogle: async (): Promise<User> => {
    if (!auth || !db) throw new Error("Firebase not initialized");
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;
    if (!fbUser.email) throw new Error("No email returned from Google");
    let user = await firebaseService.findUserByEmail(fbUser.email);
    if (!user) {
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
    if (auth) await auth.signOut();
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
    if (!db) throw new Error("Database not connected");
    const valid = await firebaseService.validateRegistrationCode(code);
    if (!valid) throw new Error("קוד רישום שגוי.");
    const user = await firebaseService.findUserByEmail(email);
    if (!user) throw new Error("משתמש לא נמצא.");
    await updateDoc(doc(db, "users", user.id), { password: newPassword });
  },

  getSurveyQuestions: async (userId?: string): Promise<SurveyQuestion[]> => {
    if (!db) return [];
    if (userId) {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().customQuestions) {
          return userSnap.data().customQuestions as SurveyQuestion[];
        }
      } catch (e) {}
    }
    try {
      const docRef = doc(db, "settings", "survey_config");
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
    await setDoc(doc(db, "settings", "survey_config"), { questions }, { merge: true });
  },

  updateUserQuestions: async (userId: string, questions: SurveyQuestion[]): Promise<void> => {
    if (!db) return;
    await updateDoc(doc(db, "users", userId), { customQuestions: questions });
  },

  validateRegistrationCode: async (codeToCheck: string): Promise<boolean> => {
    if (!db) return false;
    const docSnap = await getDoc(doc(db, "settings", "config"));
    const validCode = docSnap.exists() ? docSnap.data().registrationCode : "OBT-VIP";
    return codeToCheck.trim().toUpperCase() === validCode.toUpperCase();
  },

  updateRegistrationCode: async (newCode: string): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, "settings", "config"), { registrationCode: newCode }, { merge: true });
  },

  createUser: async (user: User): Promise<void> => {
    if (!db) return;
    await setDoc(doc(db, "users", user.id), user);
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

  findUserByEmail: async (email: string): Promise<User | null> => {
    if (!db) return null;
    const q = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0].data() as User;
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
          // מיפוי נתונים ישנים אם קיימים (Backward Compatibility)
          let finalAnswers = data.answers || [];
          if (finalAnswers.length === 0) {
            if (data.q1_change) finalAnswers.push({ questionId: 'q1', text: data.q1_change });
            if (data.q2_actions) finalAnswers.push({ questionId: 'q2', text: data.q2_actions });
          }
          
          results.push({
            ...data,
            id: docSnap.id,
            answers: finalAnswers
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
