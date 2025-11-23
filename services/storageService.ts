import { User, FeedbackResponse, FirebaseConfig } from '../types';
import { firebaseService } from './firebaseService';

// ==========================================
// 🟢 איזור הגדרות ידני - הדבק כאן את הקוד מ-Firebase
// ==========================================
// אם אתה מעדיף לא להשתמש בממשק המשתמש, אתה יכול להדביק את הערכים כאן.
// שנה את ה-null למטה לאובייקט שקיבלת, למשל:
/*
const HARDCODED_FIREBASE_CONFIG: FirebaseConfig | null = {
  apiKey: "AIzaSyBrrKJzMEHqnq5mwS8QuKjjPgMv46WRW-I",
  authDomain: "obt-ai-360.firebaseapp.com",
  projectId: "obt-ai-360",
  storageBucket: "obt-ai-360.firebasestorage.app",
  messagingSenderId: "333766329584",
  appId: "1:333766329584:web:25fe1dede13c710abe6e35",
  measurementId: "G-LBGDP262ZN"
};
*/
const HARDCODED_FIREBASE_CONFIG: FirebaseConfig | null = null; 
// ==========================================


const USER_KEY = '360_user';
const RESPONSES_KEY = '360_responses';
const FB_CONFIG_KEY = '360_firebase_config';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export const storageService = {
  // Configuration
  saveFirebaseConfig: (config: FirebaseConfig) => {
    localStorage.setItem(FB_CONFIG_KEY, JSON.stringify(config));
    firebaseService.init(config);
  },

  getFirebaseConfig: (): FirebaseConfig | null => {
    // 1. Priority: Hardcoded config
    if (HARDCODED_FIREBASE_CONFIG) {
        return HARDCODED_FIREBASE_CONFIG;
    }
    // 2. Fallback: Local Storage
    const stored = localStorage.getItem(FB_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  init: () => {
    const config = storageService.getFirebaseConfig();
    if (config) {
      firebaseService.init(config);
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

  login: async (name: string, password?: string): Promise<User | null> => {
    // 1. Try Cloud
    if (storageService.isCloudEnabled()) {
      try {
        const user = await firebaseService.findUserByName(name);
        if (user && user.password === password) {
          storageService.setCurrentUser(user);
          return user;
        }
        return null;
      } catch (e) {
        console.error("Cloud login failed", e);
      }
    }

    // 2. Local Fallback
    const localUser = storageService.getCurrentUser();
    if (localUser && localUser.name === name) {
        // Simple check for local dev
        if (!localUser.password || localUser.password === password) {
            return localUser;
        }
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

    // Save locally as session
    storageService.setCurrentUser(newUser);

    // Save to Cloud if enabled
    if (storageService.isCloudEnabled()) {
      await firebaseService.createUser(newUser);
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
        return; 
      } catch (e) {
        console.error("Cloud save failed, falling back to local", e);
      }
    }

    // 2. Local Fallback (Note: This stays on respondent's device, so it won't sync)
    const responses = storageService.getAllLocalResponses();
    responses.push(newResponse);
    localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
  },

  getResponsesForUser: async (userId: string): Promise<FeedbackResponse[]> => {
    // 1. Try Cloud
    if (storageService.isCloudEnabled()) {
      try {
        return await firebaseService.getResponsesForUser(userId);
      } catch (e) {
        console.error("Cloud fetch failed", e);
      }
    }

    // 2. Local Fallback
    const all = storageService.getAllLocalResponses();
    return all.filter(r => r.surveyId === userId).sort((a, b) => b.timestamp - a.timestamp);
  },

  getAllLocalResponses: (): FeedbackResponse[] => {
    const stored = localStorage.getItem(RESPONSES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getUserNameById: async (userId: string): Promise<string> => {
    // Try Cloud
    if (storageService.isCloudEnabled()) {
        const user = await firebaseService.getUser(userId);
        if (user) return user.name;
    }

    // Try Local Session
    const currentUser = storageService.getCurrentUser();
    if (currentUser && currentUser.id === userId) return currentUser.name;
    
    return "החבר/ה שלך";
  }
};

// Initialize on load
storageService.init();