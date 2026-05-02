import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check route
  app.get('/api/health', (req, res) => {
    console.log('Health check requested');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      port: PORT
    });
  });

  // API Route for Gemini
  app.post('/api/gemini', async (req, res) => {
    console.log('POST /api/gemini received');
    const { prompt, systemInstruction, responseSchema } = req.body;
    
    // Check multiple potential environment variable names for flexibility
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
      console.error('SERVER ERROR: Gemini API Key is missing in environment variables.');
      return res.status(500).json({ 
        error: 'מפתח Gemini API חסר בשרת. אנא וודא שהגדרת אותו ב-Settings -> Secrets תחת השם GEMINI_API_KEY.' 
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Use gemini-2.0-flash as it's the current cutting-edge model
      const modelName = 'gemini-2.0-flash'; 
      
      // Handle different systemInstruction formats (object with text property or raw string)
      let instruction = "You are a professional assistant.";
      if (typeof systemInstruction === 'string') {
        instruction = systemInstruction;
      } else if (systemInstruction && typeof systemInstruction.text === 'string') {
        instruction = systemInstruction.text;
      }

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: instruction,
      });

      console.log(`Starting generation with model: ${modelName}`);

      const result = await model.generateContentStream({
        contents: prompt,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          res.write(chunkText);
        }
      }

      res.end();
    } catch (error: any) {
      console.error('Backend Gemini Error:', error);
      const status = error.status || 500;
      res.status(status).json({ 
        error: error.message || 'AI synthesis failed',
        details: error.details || []
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
