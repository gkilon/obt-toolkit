
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackResponse } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeFeedback = async (responses: FeedbackResponse[], userGoal?: string): Promise<AnalysisResult> => {
  if (responses.length === 0) throw new Error("No responses to analyze");
  
  const ai = getClient();
  
  const rawData = responses.map(r => ({
      role: r.relationship,
      q1: r.q1_change,
      q2: r.q2_actions
  }));

  const prompt = `
    משימה: ניתוח פסיכולוגי-ארגוני של משוב 360.
    
    נתונים:
    - המטרה המוצהרת של המנהל/ת: "${userGoal || 'לא הוגדרה'}"
    - משובים מהסביבה: ${JSON.stringify(rawData)}
    
    הנחיות קריטיות לשפה ועיצוב טקסט:
    1. כתוב בעברית רהוטה ומקצועית בלבד.
    2. אל תערבב מילים באנגלית בתוך משפטים בעברית. אם יש מושג מקצועי קריטי באנגלית, שים אותו בסוגריים בסוף המשפט או בשדה נפרד.
    3. זהה את ה-"One Big Thing" - הפעולה האחת שתייצר את האימפקט הגדול ביותר.
    4. בצע ניתוח מעמיק של "הצל" (Shadow) - התנהגויות שמעכבות את הצמיחה.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        systemInstruction: `אתה פסיכולוג ארגוני בכיר. תפקידך לזקק אמת מתוך משובים. השב תמיד במבנה JSON תקין. וודא שהטקסט בעברית זורם מימין לשמאל ללא קטעי אנגלית באמצע משפט.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goalPrecision: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    critique: { type: Type.STRING },
                    refinedGoal: { type: Type.STRING }
                },
                required: ["score", "critique", "refinedGoal"]
            },
            executiveSummary: { type: Type.STRING },
            theOneBigThing: { type: Type.STRING },
            question1Analysis: {
                type: Type.OBJECT,
                properties: {
                    opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    alignmentLevel: { type: Type.STRING }
                },
                required: ["opportunities", "alignmentLevel"]
            },
            question2Analysis: {
                type: Type.OBJECT,
                properties: {
                    blockers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    psychologicalPatterns: { type: Type.STRING }
                },
                required: ["blockers", "psychologicalPatterns"]
            },
            actionPlan: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING }
                    },
                    required: ["title", "content"]
                }
            }
          },
          required: ["goalPrecision", "executiveSummary", "theOneBigThing", "question1Analysis", "question2Analysis", "actionPlan"],
        },
      },
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(response.text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("הניתוח נכשל. נסה שוב.");
  }
};
