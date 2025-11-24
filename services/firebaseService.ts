import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  Firestore
} from "firebase/firestore";
import * as firebaseApp from "firebase/app";
import { FirebaseConfig, User, FeedbackResponse } from "../types";

// Global instances
let app: any = null;
let db: Firestore | null = null;

export const firebaseService = {
  init: (config: FirebaseConfig) => {
    try {
      // 1. Initialize App safely
      // Access functions from namespace to avoid named export resolution issues
      const apps = firebaseApp.getApps();
      
      if (apps.length > 0) {
        app = firebaseApp.getApp();
      } else {
        app = firebaseApp.initializeApp(config);
      }
      
      // 2. Initialize Firestore with specific app instance
      db = getFirestore(app);
      
      console.log("Firebase initialized (client-side)");
      return true;
    } catch (e) {
      console.error("Firebase init critical error:", e);
      db = null;
      app = null;
      return false;
    }
  },

  isInitialized: () => !!db,

  // New method to verify actual network connectivity
  testConnection: async (): Promise<boolean> => {
    if (!db) return false;
    try {
      // Try to fetch a dummy document to verify permissions and connection
      // We don't care if it exists, just that we can reach the server
      const testRef = doc(db, "system_checks", "connectivity_test");
      await getDoc(testRef); 
      return true;
    } catch (e) {
      console.error("Connectivity test failed:", e);
      return false;
    }
  },

  // User Operations
  createUser: async (user: User): Promise<void> => {
    if (!db) throw new Error("System Error: Database not connected.");
    try {
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, user);
    } catch (e) {
      console.error("Error creating user in Firestore:", e);
      throw new Error("Failed to save user to cloud.");
    }
  },

  getUser: async (userId: string): Promise<User | null> => {
    if (!db) return null;
    try {
      const userRef = doc(db, "users", userId);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as User;
      }
      return null;
    } catch (e) {
      console.error("Error fetching user:", e);
      return null;
    }
  },

  findUserByEmail: async (email: string): Promise<User | null> => {
    if (!db) return null;
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;
      return querySnapshot.docs[0].data() as User;
    } catch (e) {
      console.error("Error finding user by email:", e);
      throw e;
    }
  },

  // Response Operations
  addResponse: async (response: FeedbackResponse): Promise<void> => {
    if (!db) throw new Error("Database not connected");
    try {
      const responseRef = doc(db, "responses", response.id);
      await setDoc(responseRef, response);
    } catch (e) {
      console.error("Error adding response:", e);
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
      console.error("Error fetching responses:", e);
      return [];
    }
  }
};