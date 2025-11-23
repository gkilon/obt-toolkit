import { User, FeedbackResponse, FirebaseConfig } from '../types';
import { firebaseService } from './firebaseService';

// =================================================================
// הגדרות FIREBASE
// כדי שהאפליקציה תעבוד בין מכשירים שונים (למשל, לשלוח לחבר),
// חובה למלא את הפרטים האלו מתוך קונסולת Firebase.
// =================================================================

const HARDCODED_FIREBASE_CONFIG: FirebaseConfig | null = {
  apiKey: "AIzaSyBrrKJzMEHqnq5mwS8QuKjjPgMv46WRW-I",
  authDomain: "obt-ai-360.firebaseapp.com",
  projectId: "obt-ai-360",
  storageBucket: "obt-ai-360.firebasestorage.app",
  messagingSenderId: "333766329584",
  appId: "1:333766329584:web:25fe1dede13c710abe6e35",
  measurementId: "G-LBGDP262ZN"
}; 

// =================================================================

const USER_KEY = '360_user';
const USERS_DB_KEY = '360_users_db'; // Local simulation of a users database
const RESPONSES_KEY = '360_responses';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export const storageService = {
  // Configuration
  getFirebaseConfig: (): FirebaseConfig | null => {
    if (HARDCODED_FIREBASE_CONFIG && 
        HARDCODED_FIREBASE_CONFIG.apiKey && 
        HARDCODED_FIREBASE_CONFIG.apiKey.length > 10) {
        return HARDCODED_FIREBASE_CONFIG;
    }
    return null;
  },

  init: () => {
    const config = storageService.getFirebaseConfig();
    if (config) {
      const success = firebaseService.init(config);
      if (success) {
          console.log("Storage Service: Cloud connected successfully.");
      }
    } else {
        console.warn("Storage Service: Running in LOCAL MODE (No Firebase keys). Data will not sync between devices.");
    }
  },

  isCloudEnabled: () => firebaseService.isInitialized(),

  // User Management
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  setCurrentUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Local helper to simulate a DB finding a user
  findLocalUser: (name: string): User | null => {
      const users: User[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
      return users.find(u => u.name === name) || null;
  },

  findLocalUserById: (id: string): User | null => {
      const users: User[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
      return users.find(u => u.id === id) || null;
  },

  saveLocalUserToDb: (user: User) => {
      const users: User[] = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
      // Update if exists, else push
      const index = users.findIndex(u => u.id === user.id);
      if (index >= 0) {
          users[index] = user;
      } else {
          users.push(user);
      }
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  },

  login: async (name: string, password?: string): Promise<User | null> => {
    // 1. Try Cloud
    if (storageService.isCloudEnabled()) {
      try {
        const user = await firebaseService.findUserByName(name);
        if (user && user.password === password) {
          storageService.setCurrentUser(user);
          return user;
        }
      } catch (e) {
        console.error("Cloud login failed", e);
      }
    }
    
    // 2. Fallback to Local Simulation
    const localUser = storageService.findLocalUser(name);
    if (localUser && localUser.password === password) {
        // MIGRATION FIX: If we found them locally but they weren't in cloud (or cloud failed),
        // and cloud IS enabled now, let's backfill them to cloud so their survey links work for others.
        if (storageService.isCloudEnabled()) {
            console.log("Syncing local user to cloud...");
            try {
                await firebaseService.createUser(localUser);
            } catch (e) {
                console.warn("Failed to sync local user to cloud", e);
            }
        }

        storageService.setCurrentUser(localUser);
        return localUser;
    }

    return null; 
  },

  registerUser: async (name: string, password?: string): Promise<User> => {
    const newUser: User = {
      id: generateId(),
      name,
      password,
      createdAt: Date.now(),
    };

    // Always save to current session
    storageService.setCurrentUser(newUser);
    // Always save to local "DB" simulation
    storageService.saveLocalUserToDb(newUser);

    // Try Cloud
    if (storageService.isCloudEnabled()) {
      try {
        await firebaseService.createUser(newUser);
      } catch (e) {
        console.error("Failed to sync new user to cloud", e);
        // We do NOT throw here, so the user can still use the app locally
      }
    }

    return newUser;
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
  },

  // Response Management
  addResponse: async (surveyId: string, q1: string, q2: string) => {
    const newResponse: FeedbackResponse = {
      id: generateId(),
      surveyId,
      q1_change: q1,
      q2_actions: q2,
      timestamp: Date.now(),
    };

    // 1. Try Cloud
    if (storageService.isCloudEnabled()) {
      try {
        await firebaseService.addResponse(newResponse);
        return; // Success
      } catch (e) {
        console.error("Cloud save failed, falling back to local", e);
        // If cloud fails, we try local, but warn that it might not reach the user
      }
    }

    // 2. Fallback Local
    const responses: FeedbackResponse[] = JSON.parse(localStorage.getItem(RESPONSES_KEY) || '[]');
    responses.push(newResponse);
    localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
  },

  getResponsesForUser: async (userId: string): Promise<FeedbackResponse[]> => {
    let cloudResponses: FeedbackResponse[] = [];
    
    if (storageService.isCloudEnabled()) {
      try {
        cloudResponses = await firebaseService.getResponsesForUser(userId);
      } catch (e) {
        console.error("Cloud fetch failed", e);
      }
    }

    // Get local responses
    const allLocal: FeedbackResponse[] = JSON.parse(localStorage.getItem(RESPONSES_KEY) || '[]');
    const localForUser = allLocal.filter(r => r.surveyId === userId);

    // Merge unique by ID (prefer cloud version if duplicate)
    const merged = [...cloudResponses];
    for (const local of localForUser) {
        if (!merged.find(r => r.id === local.id)) {
            merged.push(local);
        }
    }

    return merged.sort((a, b) => b.timestamp - a.timestamp);
  },

  getUserNameById: async (userId: string): Promise<string> => {
    // 1. Try Cloud
    if (storageService.isCloudEnabled()) {
        const user = await firebaseService.getUser(userId);
        if (user) return user.name;
    }

    // 2. Try Local
    const localUser = storageService.findLocalUserById(userId);
    if (localUser) return localUser.name;

    return ""; 
  }
};

// Initialize on load
storageService.init();