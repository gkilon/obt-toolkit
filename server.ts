import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini
  app.post('/api/gemini', async (req, res) => {
    const { prompt, systemInstruction, responseSchema } = req.body;
    
    // Always use GEMINI_API_KEY from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('SERVER ERROR: GEMINI_API_KEY is missing');
      return res.status(500).send('API Key configuration error on server');
    }

    try {
      const genAI = new GoogleGenAI({ apiKey });
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction || "You are a professional assistant.",
      });

      // Request streaming for better responsiveness as per user's prompt
      const result = await model.generateContentStream({
        contents: prompt,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
        safetySettings: [
          { category: HarmCategory.HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      // Robust iterator implementation
      const iterator = result.stream || (typeof (result as any)[Symbol.asyncIterator] === 'function' ? result : null);

      if (!iterator) {
        throw new Error('Failed to initialize streaming iterator');
      }

      for await (const chunk of iterator) {
        const chunkText = chunk.text();
        res.write(chunkText);
      }

      res.end();
    } catch (error: any) {
      console.error('Backend Gemini Error:', error);
      res.status(500).send(error.message || 'AI synthesis failed');
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
