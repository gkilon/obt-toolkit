import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackResponse } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFeedback = async (responses: FeedbackResponse[]): Promise<AnalysisResult> => {
  if (responses.length === 0) {
    throw new Error("No responses to analyze");
  }

  const ai = getClient();
  
  // Format data for AI
  const formattedData = responses.map(r => ({
      relationship: r.relationship,
      feedback: r.q1_change,
      contradictions: r.q2_actions
  }));

  const prompt = `
    תפקידך הוא להיות פסיכולוג ארגוני ומאמן קריירה בכיר.
    יש לנתח את המשובים הבאים שניתנו למנהל/עובד.
    המשובים מחולקים לפי סוג הקשר (מנהל, כפיף, קולגה, חבר).
    
    המשימה:
    1. זהה את "הדבר האחד" (The One Thing) המרכזי שאם ישונה - יקפיץ את האדם קדימה.
    2. מצא נושאים חוזרים.
    3. נתח הבדלים בין הקבוצות השונות (למשל: מה המנהלים רואים לעומת הכפיפים).
    4. תן עצה מעשית.

    הנתונים:
    ${JSON.stringify(formattedData)}
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert organizational psychologist speaking Hebrew. Focus on growth and forward momentum.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A concise summary of the main feedback point (The One Thing).",
            },
            keyThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3-5 recurring themes or keywords found in the feedback.",
            },
            actionableAdvice: {
              type: Type.STRING,
              description: "A specific, encouraging piece of advice based on this feedback.",
            },
            groupAnalysis: {
                type: Type.OBJECT,
                description: "A dictionary where key is the group name (e.g. 'Manager', 'Peer') and value is a short insight about that group's perspective. If a group has no data, do not include it.",
                properties: {
                    "manager": { type: Type.STRING },
                    "peer": { type: Type.STRING },
                    "subordinate": { type: Type.STRING },
                    "friend": { type: Type.STRING },
                    "other": { type: Type.STRING }
                }
            }
          },
          required: ["summary", "keyThemes", "actionableAdvice", "groupAnalysis"],
        },
      },
    });

    const text = result.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze feedback.");
  }
};