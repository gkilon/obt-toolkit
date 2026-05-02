import { GoogleGenAI } from "@google/genai";

export default async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }

  try {
    const { prompt, systemInstruction, responseSchema } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      console.error("Gemini API Key is missing in environment variables.");
      return new Response(
        JSON.stringify({ error: "מפתח Gemini API חסר בשרת. אנא הגדר GEMINI_API_KEY ב-Netlify Environment Variables." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = "gemini-2.5-flash";

    // Handle systemInstruction in different formats
    let instruction = "You are a professional executive coach.";
    if (typeof systemInstruction === "string") {
      instruction = systemInstruction;
    } else if (systemInstruction?.text) {
      instruction = systemInstruction.text;
    }

    console.log(`Starting Gemini generation with model: ${modelName}`);

    const stream = await ai.models.generateContentStream({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: instruction,
        responseMimeType: responseSchema ? "application/json" : "text/plain",
        responseSchema: responseSchema,
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      },
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (e: any) {
          console.error("Stream processing error:", e);
          controller.error(e);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error: any) {
    console.error("Netlify Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "AI analysis failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = {
  path: "/api/gemini",
};
