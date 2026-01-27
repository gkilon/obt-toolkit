
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackResponse, SurveyQuestion } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing.");
  return new GoogleGenAI({ apiKey });
};

export const analyzeFeedback = async (
  responses: FeedbackResponse[], 
  userGoal?: string,
  questions: SurveyQuestion[] = []
): Promise<AnalysisResult> => {
  if (!responses || responses.length === 0) throw new Error("No responses for analysis.");
  
  const ai = getClient();
  const dataForAI = responses.map(r => ({
      relationship: r.relationship,
      feedback: (r.answers || []).map(a => {
        const q = questions.find(question => question.id === a.questionId);
        return {
          question: q?.text_he || 'General',
          type: q?.type || 'general',
          answer: a.text || ''
        };
      })
  }));

  const prompt = `
    ROLE: Elite Executive Strategy Consultant.
    TASK: Analyze 360 feedback and identify the "One Big Thing" (OBT) for professional growth.
    USER GOAL: "${userGoal || 'Not specified'}"
    DATA: ${JSON.stringify(dataForAI)}
    
    ANALYSIS REQUIREMENTS:
    1. GOAL VALIDATION: Score 1-10 (alignment with feedback). Provide a "Power Goal".
    2. THE ONE BIG THING: The single most important shift needed.
    3. PSYCHOLOGICAL PATTERNS: The inner narrative behind the behavior.
    4. ACTION PLAN: Concrete high-level steps.
    
    OUTPUT: Strict JSON matching the provided schema. Provide both Hebrew and English for all text fields.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a direct, sharp, and elite leadership analyst. Return ONLY the requested JSON. No preamble. No conversational filler.",
        // Flash models respond much faster with thinkingBudget: 0 for this type of task
        thinkingConfig: { thinkingBudget: 0 },
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
          required: ["goalPrecision", "executiveSummary_he", "executiveSummary_en", "theOneBigThing_he", "theOneBigThing_en", "question1Analysis", "question2Analysis", "actionPlan"],
        },
      },
    });

    return JSON.parse(response.text.trim()) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error("Analysis process timed out or failed. Please try again.");
  }
};
