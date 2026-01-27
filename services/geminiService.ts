
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackResponse, SurveyQuestion } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeFeedback = async (
  responses: FeedbackResponse[], 
  userGoal?: string,
  questions: SurveyQuestion[] = []
): Promise<AnalysisResult> => {
  if (responses.length === 0) throw new Error("No responses to analyze");
  
  const ai = getClient();
  
  // Format data for AI: mapping IDs to labels
  const dataForAI = responses.map(r => ({
      role: r.relationship,
      answers: r.answers.map(a => {
        const q = questions.find(question => question.id === a.questionId);
        return {
          question_text: q?.text_he || 'שאלה',
          question_type: q?.type || 'general',
          answer: a.text
        };
      })
  }));

  const prompt = `
    משימה: ניתוח משוב 360 דינמי.
    מטרה שהציב המנהל: "${userGoal || 'לא הוגדרה'}"
    שאלות ותשובות שנאספו: ${JSON.stringify(dataForAI)}
    
    הנחיות לניתוח:
    1. זהה את התשובות לשאלות מסוג "goal" כדי להבין אם המטרה שהציב המנהל אכן נתפסת כחשובה.
    2. זהה את התשובות לשאלות מסוג "blocker" כדי לזקק את הדברים שמעכבים אותו.
    3. התייחס לשאלות מסוג "general" כמידע משלים לחיזוק התובנות.
    4. כתוב פשוט, חברי, ומקדם צמיחה. הצג הכל כהצעה.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        systemInstruction: `אתה חבר חכם ומלווה צמיחה. ענה ב-JSON בלבד הכולל את כל השדות המוגדרים בסכימה.`,
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

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(response.text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("משהו לא עבד בניתוח.");
  }
};
