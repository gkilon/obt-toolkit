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
  updateDoc,
  Firestore
} from "firebase/firestore";
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { FirebaseConfig, User, FeedbackResponse } from "../types";

// Global instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const firebaseService = {
  init: (config: FirebaseConfig) => {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        app = getApp();
      } else {
        app = initializeApp(config);
      }
      db = getFirestore(app);
      console.log("Firebase initialized");
      return true;
    } catch (e) {
      console.error("Firebase init critical error:", e);
      db = null;
      app = null;
      return false;
    }
  },

  isInitialized: () => !!db,

  testConnection: async (): Promise<boolean> => {
    if (!db) return false;
    try {
      const dummyRef = collection(db, "users");
      const q = query(dummyRef, limit(1));
      await getDocs(q);
      return true;
    } catch (e: any) {
      console.error("Connectivity test failed:", e.code);
      return false;
    }
  },

  // --- System Config (Registration Code) ---
  
  validateRegistrationCode: async (codeToCheck: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const configRef = doc(db, "settings", "config");
        const docSnap = await getDoc(configRef);
        
        let validCode = "OBT-VIP"; // Default fallback code if not set in DB
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.registrationCode) {
                validCode = data.registrationCode;
            }
        } else {
            // If document doesn't exist, create it with default
            await setDoc(configRef, { registrationCode: "OBT-VIP" });
        }

        return codeToCheck === validCode;
    } catch (e) {
        console.error("Error validating code", e);
        // Fallback to allow default code if DB read fails (to prevent lockout on first run)
        return codeToCheck === "OBT-VIP";
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
        throw new Error("שגיאת הרשאה. בדוק Rules.");
      }
      throw new Error("נכשל הרישום לענן.");
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