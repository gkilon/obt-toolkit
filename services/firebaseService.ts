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
import * as firebaseApp from "firebase/app";
import { FirebaseConfig, User, FeedbackResponse } from "../types";

// Global instances
let app: firebaseApp.FirebaseApp | null = null;
let db: Firestore | null = null;

export const firebaseService = {
  init: (config: FirebaseConfig) => {
    try {
      const apps = firebaseApp.getApps();
      if (apps.length > 0) {
        app = firebaseApp.getApp();
      } else {
        app = firebaseApp.initializeApp(config);
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
      // If permission denied, it means we successfully contacted the server, 
      // but security rules blocked the read. This counts as "Connected".
      if (e.code === 'permission-denied') {
          return true;
      }
      
      console.error("Connectivity test failed:", e.code);
      // 'unavailable' usually means offline
      if (e.code === 'unavailable') return false;
      
      // For other errors, assume connected but erroring
      return true;
    }
  },

  // --- System Config (Registration Code) ---
  
  validateRegistrationCode: async (codeToCheck: string): Promise<boolean> => {
    if (!db) return false;
    const cleanCode = codeToCheck.trim();
    
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
            // If document doesn't exist, try to create it with default
            // This might fail if user is unauth, which is fine, we use fallback
            try {
                await setDoc(configRef, { registrationCode: "OBT-VIP" });
            } catch (err) {
                // Ignore write error
            }
        }

        return cleanCode === validCode;
    } catch (e) {
        console.error("Error validating code (using fallback)", e);
        // Fallback: If we can't read DB (e.g. permission denied), 
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
        throw new Error("שגיאת הרשאה. וודא שחוקי ה-Firestore מאפשרים כתיבה.");
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