import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackResponse } from "../types";
import { translations } from "../translations";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeFeedback = async (responses: FeedbackResponse[], userGoal?: string): Promise<AnalysisResult> => {
  if (responses.length === 0) throw new Error("No responses to analyze");
  
  const lang = (localStorage.getItem('obt_lang') as 'he' | 'en') || 'he';
  const ai = getClient();
  
  const rawData = responses.map(r => ({
      role: r.relationship,
      impact: r.q1_change,
      contradictions: r.q2_actions
  }));

  const prompt = `
    Role: Senior Executive Coach & Behavioral Psychologist.
    Task: Synthesize a high-stakes 360 feedback report.
    
    Context:
    The individual's stated growth goal: "${userGoal || 'Not specified'}"
    The collective feedback data: ${JSON.stringify(rawData)}
    
    Instructions:
    1. Analysis Level: Extremely deep. Look for the "Golden Thread" connecting the feedbacks.
    2. Precision Check: Evaluate if the individual's goal is truly the highest leverage point or if the feedback suggests a deeper, more urgent "One Big Thing".
    3. Output Language: ${lang === 'he' ? 'Hebrew' : 'English'}.
    4. Quality: Use high-end professional vocabulary (Executive level).
    
    Expected Structure:
    - goalPrecision: Score (0-100) and a sophisticated critique of how aligned the goal is with external reality.
    - executiveSummary: A narrative synthesis of the situation.
    - question1Analysis: Key opportunities and alignment.
    - question2Analysis: Critical blockers and unconscious psychological patterns discovered.
    - theOneBigThing: The single, most powerful shift this person must make.
    - actionPlan: 3-5 high-resolution strategic steps.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are an elite organizational psychologist. You provide world-class, deep, and actionable 360 feedback synthesis in JSON format.`,
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
            theOneBigThing: { type: Type.STRING },
            actionPlan: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING }
                    }
                }
            },
            groupPerspectives: {
                type: Type.OBJECT,
                properties: {
                    "manager": { type: Type.STRING },
                    "peer": { type: Type.STRING },
                    "subordinate": { type: Type.STRING },
                    "other": { type: Type.STRING }
                }
            }
          },
          required: ["goalPrecision", "executiveSummary", "question1Analysis", "question2Analysis", "theOneBigThing", "actionPlan", "groupPerspectives"],
        },
      },
    });

    return JSON.parse(response.text || '{}') as AnalysisResult;
  } catch (error) {
    console.error("Gemini Synthesis Error:", error);
    throw new Error("Analysis synthesis failed.");
  }
};