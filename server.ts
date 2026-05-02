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
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API_KEY is not configured on the server.' });
    }

    try {
      const genAI = new GoogleGenAI({ apiKey });
      
      // Using gemini-2.0-flash as a modern stable alias for the requested 2.5 series context
      const model = genAI.models.get({
        model: 'gemini-2.0-flash',
      });

      const result = await model.generateContentStream({
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "You are a professional assistant.",
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          safetySettings: [
            { category: HarmCategory.HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        }
      });

      // Streaming implementation
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      // Robust iterator as requested
      const iterator = result.stream || (typeof (result as any)[Symbol.asyncIterator] === 'function' ? result : null);

      if (!iterator) {
        throw new Error('Could not initialize streaming iterator');
      }

      for await (const chunk of iterator) {
        const chunkText = chunk.text();
        res.write(chunkText);
      }

      res.end();
    } catch (error: any) {
      console.error('Backend Gemini Error:', error);
      res.status(500).json({ error: error.message || 'AI synthesis failed' });
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
