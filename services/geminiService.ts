
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackResponse, SurveyQuestion } from "../types";

export const analyzeFeedback = async (
  responses: FeedbackResponse[], 
  userGoal?: string,
  questions: SurveyQuestion[] = []
): Promise<AnalysisResult> => {
  if (!responses || responses.length === 0) throw new Error("No responses for analysis.");
  
  // שימוש ב-GoogleGenAI עם מפתח ה-API מהסביבה
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // הכנת הנתונים למודל בצורה תמציתית כדי לחסוך בטוקנים וזמן עיבוד
  const dataForAI = responses.map(r => ({
      r: r.relationship,
      a: (r.answers || []).map(a => {
        const q = questions.find(question => question.id === a.questionId);
        return {
          q: q?.text_he || 'General',
          v: a.text || ''
        };
      })
  }));

  const prompt = `
    Analyze 360 feedback for growth identification.
    Target Goal: "${userGoal || 'Professional growth'}"
    Feedback Data: ${JSON.stringify(dataForAI)}
    
    Instructions:
    1. Identify the 'One Big Thing' (OBT) - the most critical shift.
    2. Provide a 'Power Goal' that refines their current goal.
    3. Analyze psychological patterns and missed opportunities.
    
    Return ONLY JSON matching the schema.
  `;

  try {
    // מעבר למודל Flash לצורך מהירות תגובה מקסימלית כפי שביקש המשתמש
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a professional executive coach. Be sharp, direct, and fast. Output raw JSON ONLY. No markdown formatting.",
        responseMimeType: "application/json",
        // הגדרת תקציב חשיבה נמוך/אפס לטובת מהירות (Latency)
        thinkingConfig: { thinkingBudget: 0 },
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
            alternativeOBT_he: { type: Type.STRING },
            alternativeOBT_en: { type: Type.STRING },
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

    return JSON.parse(response.text.trim()) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error("הניתוח נכשל או לקח זמן רב מדי. אנא נסה שנית.");
  }
};
