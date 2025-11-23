import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore, collection, addDoc, getDocs, query, where, doc, getDoc, setDoc } from "firebase/firestore";
import { FirebaseConfig, User, FeedbackResponse } from "../types";

let app: any = null; // Use any to bypass FirebaseApp type import issue
let db: Firestore | null = null;

export const firebaseService = {
  init: (config: FirebaseConfig) => {
    try {
      // Check if apps are already initialized
      if (getApps && getApps().length > 0) {
        app = getApp();
      } else {
        app = initializeApp(config);
      }
      
      db = getFirestore(app);
      console.log("Firebase initialized successfully");
      return true;
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      return false;
    }
  },

  isInitialized: () => !!db,

  // User Operations
  createUser: async (user: User): Promise<void> => {
    if (!db) throw new Error("DB not initialized");
    await setDoc(doc(db, "users", user.id), user);
  },

  getUser: async (userId: string): Promise<User | null> => {
    if (!db) throw new Error("DB not initialized");
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as User;
    } else {
      return null;
    }
  },

  findUserByEmail: async (email: string): Promise<User | null> => {
    if (!db) throw new Error("DB not initialized");
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    return querySnapshot.docs[0].data() as User;
  },

  // Fallback for older users without email (optional support)
  findUserByName: async (name: string): Promise<User | null> => {
    if (!db) throw new Error("DB not initialized");
    const q = query(collection(db, "users"), where("name", "==", name));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    return querySnapshot.docs[0].data() as User;
  },

  // Response Operations
  addResponse: async (response: FeedbackResponse): Promise<void> => {
    if (!db) throw new Error("DB not initialized");
    // We use setDoc with the ID to ensure idempotency if needed, or just addDoc
    await setDoc(doc(db, "responses", response.id), response);
  },

  getResponsesForUser: async (userId: string): Promise<FeedbackResponse[]> => {
    if (!db) throw new Error("DB not initialized");
    const q = query(collection(db, "responses"), where("surveyId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const responses: FeedbackResponse[] = [];
    querySnapshot.forEach((doc) => {
      responses.push(doc.data() as FeedbackResponse);
    });
    
    return responses.sort((a, b) => b.timestamp - a.timestamp);
  }
};