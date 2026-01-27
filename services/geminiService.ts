
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
    ROLE: You are a World-Class Executive Coach and Leadership Strategist (Think McKinsey/HBS style).
    CONTEXT: You are analyzing 360-degree feedback for a leader.
    USER'S SELF-DEFINED GOAL: "${userGoal || 'Not specified'}"
    
    RAW DATA:
    ${JSON.stringify(dataForAI, null, 2)}
    
    YOUR MISSION:
    1. VALIDATE THE GOAL: Is the user's goal actually what they need based on the feedback?
    2. THE ONE BIG THING: Identify the single most transformative shift that will unlock their next level.
    3. BLIND SPOTS: Reveal what others see that the leader is missing.
    4. ALTERNATIVE GOALS: Propose a "Power Goal" if the current one is misaligned.
    5. PSYCHOLOGICAL PATTERNS: Identify underlying narratives.
    
    OUTPUT: Hebrew (Professional Elite style).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You provide elite executive analysis. You must return ONLY valid JSON matching the schema.",
        thinkingConfig: { thinkingBudget: 4000 },
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
                required: ["score", "critique_he", "refinedGoal_he"]
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
                }
            },
            question2Analysis: {
                type: Type.OBJECT,
                properties: {
                    blockers_he: { type: Type.ARRAY, items: { type: Type.STRING } },
                    blockers_en: { type: Type.ARRAY, items: { type: Type.STRING } },
                    psychologicalPatterns_he: { type: Type.STRING },
                    psychologicalPatterns_en: { type: Type.STRING }
                }
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
                    }
                }
            }
          },
          required: ["goalPrecision", "executiveSummary_he", "theOneBigThing_he", "question1Analysis", "question2Analysis", "actionPlan"],
        },
      },
    });

    return JSON.parse(response.text.trim()) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error("Analysis failed. Ensure you have high-quality feedback.");
  }
};
