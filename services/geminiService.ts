import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackResponse } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFeedback = async (responses: FeedbackResponse[], userGoal?: string): Promise<AnalysisResult> => {
  if (responses.length === 0) {
    throw new Error("No responses to analyze");
  }

  const ai = getClient();
  
  // Format data for AI
  const formattedData = responses.map(r => ({
      relationship: r.relationship,
      feedbackOnGoal: r.q1_change,
      contradictions: r.q2_actions
  }));

  const goalContext = userGoal 
    ? `The user defined their growth goal as: "${userGoal}".`
    : `The user did NOT define a specific goal, so the feedback is general.`;

  const prompt = `
    תפקידך הוא להיות פסיכולוג ארגוני ומאמן קריירה בכיר.
    
    הקשר:
    ${goalContext}
    
    המשימה:
    יש לנתח את המשובים שהתקבלו. השאלה הראשונה שנשאלה הייתה "האם המטרה הזו תקפיץ את האדם מדרגה? דייק או נסח מחדש".
    
    1. בדוק האם הסביבה מסכימה עם המטרה שהאדם הציב לעצמו? האם הם מציעים לדייק אותה? אם כן, איך?
    2. זהה את "הדבר האחד" האמיתי (בין אם הוא תואם את מה שהמשתמש חשב ובין אם לא).
    3. נתח נושאים חוזרים בהתנהגויות המעכבות.
    4. נתח הבדלים בין הקבוצות השונות (מנהל, כפיף, וכו').
    5. תן עצה מעשית לביצוע.

    הנתונים:
    ${JSON.stringify(formattedData)}
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert organizational psychologist speaking Hebrew. Focus on alignment between self-perception and external feedback.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A summary of whether the feedback validates the user's goal or suggests a different focus.",
            },
            keyThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3-5 recurring themes (refinements to the goal or blocking behaviors).",
            },
            actionableAdvice: {
              type: Type.STRING,
              description: "A specific, encouraging piece of advice based on the gap (or alignment) between the user's goal and the feedback.",
            },
            groupAnalysis: {
                type: Type.OBJECT,
                description: "A dictionary where key is the group name (e.g. 'Manager', 'Peer') and value is a short insight about that group's perspective.",
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