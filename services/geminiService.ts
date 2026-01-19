
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
    משימה: זיקוק תובנות ממשוב 360 עבור מנהל/ת.
    מטרה נוכחית: "${userGoal || 'לא הוגדרה'}"
    משובים: ${JSON.stringify(rawData)}
    
    הנחיות חשובות לטון ולשפה:
    1. השתמש בשפה פשוטה, ברורה ובגובה העיניים. בלי "מילים גבוהות" מדי של יועצים.
    2. הצג את ה-One Big Thing כ**הצעה למחשבה** (Suggested direction) ולא כתשובה סופית. השתמש בניסוחים כמו "נראה ש...", "נקודה למחשבה שעולה היא...", "אולי כדאי לשקול...".
    3. כתוב בעברית נקייה ללא ערבוב אנגלית.
    4. בצע ניתוח של פערים בין המטרה שהמנהל הציב לבין מה שהסביבה רואה.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        systemInstruction: `אתה מלווה מנהלים שמאמין שהתשובה נמצאת אצלם. תפקידך להציע זווית ראייה חדשה מתוך המשובים. דבר בפשטות ובידידותיות. השב ב-JSON בלבד.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goalPrecision: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    critique_he: { type: Type.STRING },
                    critique_en: { type: Type.STRING },
                    refinedGoal_he: { type: Type.STRING },
                    refinedGoal_en: { type: Type.STRING }
                },
                required: ["score", "critique_he", "critique_en", "refinedGoal_he", "refinedGoal_en"]
            },
            executiveSummary_he: { type: Type.STRING },
            executiveSummary_en: { type: Type.STRING },
            theOneBigThing_he: { type: Type.STRING },
            theOneBigThing_en: { type: Type.STRING },
            question1Analysis: {
                type: Type.OBJECT,
                properties: {
                    opportunities_he: { type: Type.ARRAY, items: { type: Type.STRING } },
                    opportunities_en: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["opportunities_he", "opportunities_en"]
            },
            question2Analysis: {
                type: Type.OBJECT,
                properties: {
                    blockers_he: { type: Type.ARRAY, items: { type: Type.STRING } },
                    blockers_en: { type: Type.ARRAY, items: { type: Type.STRING } },
                    psychologicalPatterns_he: { type: Type.STRING },
                    psychologicalPatterns_en: { type: Type.STRING }
                },
                required: ["blockers_he", "blockers_en", "psychologicalPatterns_he", "psychologicalPatterns_en"]
            },
            actionPlan: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title_he: { type: Type.STRING },
                        title_en: { type: Type.STRING },
                        content_he: { type: Type.STRING },
                        content_en: { type: Type.STRING }
                    },
                    required: ["title_he", "title_en", "content_he", "content_en"]
                }
            }
          },
          required: ["goalPrecision", "executiveSummary_he", "executiveSummary_en", "theOneBigThing_he", "theOneBigThing_en", "question1Analysis", "question2Analysis", "actionPlan"],
        },
      },
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(response.text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("משהו השתבש בניתוח. כדאי לנסות שוב.");
  }
};
