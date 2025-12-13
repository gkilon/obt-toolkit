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
// Separate type import to avoid runtime errors in some environments
import type { Firestore } from "firebase/firestore";
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth, User as FirebaseUser } from "firebase/auth";
import { FirebaseConfig, User, FeedbackResponse } from "../types";

// Global instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export const firebaseService = {
  init: (config: FirebaseConfig) => {
    try {
      // Check for existing apps using named exports logic
      const apps = getApps();
      if (apps.length > 0) {
        app = getApp();
      } else {
        app = initializeApp(config);
      }
      db = getFirestore(app);
      auth = getAuth(app);
      console.log("Firebase initialized");
      return true;
    } catch (e) {
      console.error("Firebase init critical error:", e);
      db = null;
      app = null;
      auth = null;
      return false;
    }
  },

  isInitialized: () => !!db,

  testConnection: async (): Promise<boolean> => {
    if (!db) return false;
    try {
      // Try to read something public or just check if we can reach the server
      const dummyRef = collection(db, "users");
      const q = query(dummyRef, limit(1));
      await getDocs(q);
      return true;
    } catch (e: any) {
      // If permission denied, it means we successfully contacted the server, 
      // but security rules blocked the read. This counts as "Connected".
      if (e.code === 'permission-denied') {
          console.log("Connection verified (permission denied is OK)");
          return true;
      }
      
      console.error("Connectivity test failed:", e.code);
      // 'unavailable' usually means offline
      if (e.code === 'unavailable') return false;
      
      // For other errors, assume connected but erroring
      return true;
    }
  },

  // --- Auth & Google Sign In ---

  loginWithGoogle: async (): Promise<FirebaseUser> => {
    if (!auth) throw new Error("Auth not initialized");
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Google Sign In Error", error);
        throw error;
    }
  },

  logout: async (): Promise<void> => {
      if (auth) {
          await auth.signOut();
      }
  },

  // --- System Config (Registration Code) ---
  
  validateRegistrationCode: async (codeToCheck: string): Promise<boolean> => {
    if (!db) return false;
    // Normalize code: remove spaces, uppercase
    const cleanCode = codeToCheck.trim().toUpperCase();
    
    try {
        const configRef = doc(db, "settings", "config");
        const docSnap = await getDoc(configRef);
        
        let validCode = "OBT-VIP"; // Default fallback code if not set in DB
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.registrationCode) {
                validCode = data.registrationCode;
            }
        } 
        
        // Check match (case insensitive)
        return cleanCode === validCode.toUpperCase();

    } catch (e) {
        console.warn("Error validating code (using fallback mode):", e);
        // Fallback: If we can't read DB (e.g. permission denied or offline), 
        // we ONLY allow the default code to prevent total lockout.
        return cleanCode === "OBT-VIP";
    }
  },

  updateRegistrationCode: async (newCode: string): Promise<void> => {
    if (!db) throw new Error("Database not connected");
    try {
        const configRef = doc(db, "settings", "config");
        await setDoc(configRef, { registrationCode: newCode }, { merge: true });
    } catch (e) {
        throw new Error("Failed to update registration code");
    }
  },

  // --- User Operations ---

  createUser: async (user: User): Promise<void> => {
    if (!db) throw new Error("System Error: Database not connected.");
    try {
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, user);
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        throw new Error("שגיאת הרשאה. ייתכן וקוד הרישום לא נקלט כראוי, או שיש חסימת אבטחה.");
      }
      console.error("Create User Error:", e);
      throw new Error("נכשל הרישום לענן. אנא נסה שוב.");
    }
  },

  updatePassword: async (userId: string, newPassword: string): Promise<void> => {
    if (!db) throw new Error("Database disconnected");
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { password: newPassword });
    } catch (e) {
        console.error("Password update failed", e);
        throw new Error("עדכון סיסמה נכשל.");
    }
  },

  getUser: async (userId: string): Promise<User | null> => {
    if (!db) return null;
    try {
      const userRef = doc(db, "users", userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) return docSnap.data() as User;
      return null;
    } catch (e) { return null; }
  },

  findUserByEmail: async (email: string): Promise<User | null> => {
    if (!db) return null;
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;
      return querySnapshot.docs[0].data() as User;
    } catch (e: any) {
      if (e.code === 'permission-denied') throw new Error("permission-denied");
      throw e;
    }
  },

  // --- Response Operations ---

  addResponse: async (response: FeedbackResponse): Promise<void> => {
    if (!db) throw new Error("Database not connected");
    try {
      const responseRef = doc(db, "responses", response.id);
      await setDoc(responseRef, response);
    } catch (e) {
      throw new Error("Failed to save response to cloud.");
    }
  },

  getResponsesForUser: async (userId: string): Promise<FeedbackResponse[]> => {
    if (!db) return [];
    try {
      const responsesRef = collection(db, "responses");
      const q = query(responsesRef, where("surveyId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      const responses: FeedbackResponse[] = [];
      querySnapshot.forEach((doc: any) => {
        responses.push(doc.data() as FeedbackResponse);
      });
      
      return responses.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      return [];
    }
  }
};