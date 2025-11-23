import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react-dom/client',
          'react-router-dom',
          '@google/genai',
          'firebase/app',
          'firebase/firestore'
        ]
      }
    }
  };
});