
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackResponse, SurveyQuestion } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key (process.env.API_KEY) missing. Please check your environment variables.");
  return new GoogleGenAI({ apiKey });
};

export const analyzeFeedback = async (
  responses: FeedbackResponse[], 
  userGoal?: string,
  questions: SurveyQuestion[] = []
): Promise<AnalysisResult> => {
  if (responses.length === 0) throw new Error("לא נמצאו תשובות לניתוח.");
  
  const ai = getClient();
  
  // הכנת המידע ל-AI: מיפוי תשובות לשאלות והצמדת סוג השאלה
  const dataForAI = responses.map(r => ({
      relationship: r.relationship,
      feedback: r.answers.map(a => {
        const q = questions.find(question => question.id === a.questionId);
        return {
          question: q?.text_he || 'שאלה כללית',
          type: q?.type || 'general',
          answer: a.text
        };
      })
  }));

  const prompt = `
    משימה: אתה יועץ פיתוח מנהיגות בכיר. עליך לנתח משוב 360 עבור מנהל.
    המטרה שהמנהל הציב לעצמו: "${userGoal || 'לא הוגדרה מטרה ספציפית'}"
    
    נתוני המשוב (בפורמט JSON):
    ${JSON.stringify(dataForAI, null, 2)}
    
    הנחיות לניתוח:
    1. קרא את כל התשובות. חפש תבניות שחוזרות על עצמן.
    2. "The One Big Thing": זהה את השינוי האחד והמשמעותי ביותר (המנוע המרכזי) שישנה את כל התמונה עבור המנהל הזה.
    3. נתח את הדיוק של המטרה המקורית מול מה שאנשים אומרים בשטח.
    4. בודד חסמים (Blockers) - התנהגויות ספציפיות שמעכבות אותו.
    5. בנה תוכנית פעולה של 3 צעדים פרקטיים.
    
    חשוב: ענה בעברית רהוטה ומקצועית.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // שימוש ב-Pro לניתוח עמוק יותר
      contents: prompt,
      config: {
        systemInstruction: `אתה מומחה לניתוח משוב 360. עליך להחזיר תשובה בפורמט JSON תקין בלבד, על פי הסכימה המדויקת שסופקה. אל תוסיף טקסט לפני או אחרי ה-JSON.`,
        thinkingConfig: { thinkingBudget: 4000 }, // מאפשר ל-AI "לחשוב" לפני מתן תשובה סופית
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goalPrecision: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER, description: "ציון בין 1-10 למידת הדיוק של המטרה המקורית" },
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
          required: ["goalPrecision", "executiveSummary_he", "executiveSummary_en", "theOneBigThing_he", "theOneBigThing_en", "alternativeOBT_he", "alternativeOBT_en", "question1Analysis", "question2Analysis", "actionPlan"],
        },
      },
    });

    if (!response.text) {
      console.error("Gemini returned empty text response");
      throw new Error("ה-AI לא הצליח לייצר תשובה. נסה שוב בעוד רגע.");
    }

    const cleanJson = response.text.trim();
    return JSON.parse(cleanJson) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Service Detailed Error:", error);
    if (error.message?.includes("API_KEY")) {
      throw new Error("מפתח ה-API חסר או לא תקין.");
    }
    throw new Error(`תקלה בניתוח הנתונים: ${error.message || "שגיאה לא ידועה"}`);
  }
};
