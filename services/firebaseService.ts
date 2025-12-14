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
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth, User as FirebaseUser } from "firebase/auth";
import { FirebaseConfig, User, FeedbackResponse } from "../types";

// Global instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export const firebaseService = {
  init: (config: FirebaseConfig) => {
    console.log("------------------------------------------------");
    console.log("FIREBASE INIT START");
    console.log("API Key present:", config.apiKey ? "YES (Length: " + config.apiKey.length + ")" : "NO");
    console.log("Project ID:", config.projectId);
    console.log("Auth Domain:", config.authDomain);
    console.log("------------------------------------------------");

    if (!config.apiKey || config.apiKey.length === 0) {
        console.error("Firebase Init Failed: Missing API Key.");
        return false;
    }

    try {
      const apps = getApps();
      if (apps.length > 0) {
        console.log("Firebase App already exists, reusing.");
        app = getApp();
      } else {
        console.log("Initializing new Firebase App...");
        app = initializeApp(config);
      }
      
      db = getFirestore(app);
      auth = getAuth(app);
      
      console.log("Firebase services initialized successfully.");
      return true;
    } catch (e) {
      console.error("CRITICAL ERROR during Firebase Initialization:", e);
      db = null;
      app = null;
      auth = null;
      return false;
    }
  },

  isInitialized: () => {
      const initialized = !!db && !!auth;
      if (!initialized) console.warn("Firebase isInitialized check returned FALSE");
      return initialized;
  },

  testConnection: async (): Promise<boolean> => {
    if (!db) {
        console.error("testConnection failed: DB is null");
        return false;
    }
    try {
      console.log("Testing connection to Firestore...");
      const dummyRef = collection(db, "users");
      const q = query(dummyRef, limit(1));
      await getDocs(q);
      console.log("Connection test PASSED");
      return true;
    } catch (e: any) {
      if (e.code === 'permission-denied') {
          console.log("Connection verified (permission denied is expected without login)");
          return true;
      }
      console.error("Connection test FAILED:", e.code, e.message);
      return false;
    }
  },

  // --- Auth & Google Sign In ---

  loginWithGoogle: async (): Promise<FirebaseUser> => {
    if (!auth) {
        console.error("Login attempted but Auth is null");
        throw new Error("Auth not initialized - check console logs");
    }
    console.log("Starting Google Sign In...");
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("Google Sign In Success:", result.user.email);
        return result.user;
    } catch (error: any) {
        console.error("Google Sign In Error Details:", error);
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
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
    const cleanCode = codeToCheck.trim().toUpperCase();
    
    try {
        const configRef = doc(db, "settings", "config");
        const docSnap = await getDoc(configRef);
        
        let validCode = "OBT-VIP"; 
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.registrationCode) {
                validCode = data.registrationCode;
            }
        } 
        return cleanCode === validCode.toUpperCase();

    } catch (e) {
        console.warn("Error validating code (using fallback mode):", e);
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
      console.log("Creating user in Firestore:", user.id);
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, user);
      console.log("User created successfully");
    } catch (e: any) {
      console.error("Create User Error:", e);
      if (e.code === 'permission-denied') {
        throw new Error("שגיאת הרשאה. ייתכן וקוד הרישום לא נקלט כראוי, או שיש חסימת אבטחה.");
      }
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

  updateUserGoal: async (userId: string, goal: string): Promise<void> => {
    if (!db) throw new Error("Database disconnected");
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { userGoal: goal });
    } catch (e) {
        console.error("User goal update failed", e);
        throw new Error("עדכון מטרה נכשל.");
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
      console.log("Searching for user by email:", email);
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
          console.log("User not found via email query");
          return null;
      }
      console.log("User found via email");
      return querySnapshot.docs[0].data() as User;
    } catch (e: any) {
      console.error("findUserByEmail Error:", e);
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
      console.error("Add Response Error:", e);
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
      console.error("Get Responses Error:", e);
      return [];
    }
  }
};