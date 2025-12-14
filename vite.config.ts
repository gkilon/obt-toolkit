import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Using process.cwd() is safer.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      
      // Robust Environment Variable Injection
      // We explicitly try to grab from process.env (Server/CI) first, then the loaded .env file
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || ''),
      'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY || env.FIREBASE_API_KEY || ''),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || ''),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || ''),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || ''),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || ''),
      'process.env.FIREBASE_APP_ID': JSON.stringify(process.env.FIREBASE_APP_ID || env.FIREBASE_APP_ID || ''),
      'process.env.FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.FIREBASE_MEASUREMENT_ID || env.FIREBASE_MEASUREMENT_ID || ''),
    },
    build: {
      target: 'esnext',
    }
  };
});