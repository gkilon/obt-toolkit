import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load .env.local manually (tsx doesn't load it automatically) ---
function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      const value = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
    console.log('✅ Loaded environment from', filePath);
  } catch (e) {
    // File doesn't exist - that's fine in production
  }
}

loadEnvFile(path.join(__dirname, '.env.local'));
loadEnvFile(path.join(__dirname, '.env'));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check route
  app.get('/api/health', (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      port: PORT,
      apiKeyPresent: !!apiKey,
    });
  });

  // API Route for Gemini
  app.post('/api/gemini', async (req, res) => {
    console.log('POST /api/gemini received');
    const { prompt, systemInstruction, responseSchema } = req.body;
    
    // Check multiple potential environment variable names for flexibility
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      console.error('SERVER ERROR: Gemini API Key is missing or is still a placeholder.');
      return res.status(500).json({ 
        error: 'מפתח Gemini API חסר בשרת. אנא הגדר GEMINI_API_KEY בקובץ .env.local' 
      });
    }

    try {
      const genAI = new GoogleGenAI({ apiKey });
      
      const modelName = 'gemini-2.0-flash';

      // Handle different systemInstruction formats
      let instruction = "You are a professional assistant.";
      if (typeof systemInstruction === 'string') {
        instruction = systemInstruction;
      } else if (systemInstruction && typeof systemInstruction.text === 'string') {
        instruction = systemInstruction.text;
      }

      console.log(`Starting generation with model: ${modelName}`);

      const stream = await genAI.models.generateContentStream({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: instruction,
          responseMimeType: responseSchema ? "application/json" : "text/plain",
          responseSchema: responseSchema,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        },
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          res.write(chunkText);
        }
      }

      res.end();
    } catch (error: any) {
      console.error('Backend Gemini Error:', error);
      if (res.headersSent) {
        res.end();
        return;
      }
      const status = error.status || 500;
      res.status(status).json({ 
        error: error.message || 'AI synthesis failed',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    if (apiKey && apiKey !== 'PLACEHOLDER_API_KEY') {
      console.log('✅ Gemini API Key loaded successfully.');
    } else {
      console.warn('⚠️  WARNING: Gemini API Key is missing. Add it to .env.local');
    }
  });
}

startServer();
