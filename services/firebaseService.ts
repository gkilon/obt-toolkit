import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where
} from "firebase/firestore";
// Fix: Use namespace import and cast to any to handle potential environment type discrepancies
import * as firebaseApp from "firebase/app";
import { FirebaseConfig, User, FeedbackResponse } from "../types";

// Extract functions with type casting to bypass "no exported member" errors
const { initializeApp, getApps, getApp } = firebaseApp as any;

// Using 'any' for app/db variables to handle potential type mismatches with CDN imports
let app: any = null;
let db: any = null;

export const firebaseService = {
  init: (config: FirebaseConfig) => {
    try {
      // Check if apps are already initialized (Modular style)
      if (getApps().length > 0) {
        app = getApp();
      } else {
        app = initializeApp(config);
      }
      
      db = getFirestore(app);
      console.log("Firebase connection established.");
      return true;
    } catch (e) {
      console.error("Firebase init critical error:", e);
      return false;
    }
  },

  isInitialized: () => !!db,

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
      // Return the first match
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