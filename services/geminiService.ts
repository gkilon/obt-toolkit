
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, FeedbackResponse } from "../types";
import { translations } from "../translations";

const getClient = () => {
  // Use named parameter for apiKey and ensure it comes from process.env.API_KEY
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeFeedback = async (responses: FeedbackResponse[], userGoal?: string): Promise<AnalysisResult> => {
  if (responses.length === 0) throw new Error("No responses to analyze");
  
  const lang = (localStorage.getItem('obt_lang') as 'he' | 'en') || 'he';
  const t = translations[lang];
  const ai = getClient();
  
  const formattedData = responses.map(r => ({
      relationship: r.relationship,
      feedbackOnGoal: r.q1_change,
      contradictions: r.q2_actions
  }));

  const goalContext = userGoal 
    ? `The user defined their growth goal as: "${userGoal}".`
    : `The user did NOT define a specific goal.`;

  const prompt = `
    Role: Senior Organizational Psychologist.
    Context: ${goalContext}
    Language: Please provide the entire response in ${lang === 'he' ? 'Hebrew' : 'English'}.
    
    Data: ${JSON.stringify(formattedData)}
    
    Task:
    1. Analyze if the environment agrees with the goal.
    2. Identify the "One Big Thing" for breakthrough.
    3. Spot recurring limiting behaviors.
    4. provide a summary, key themes, and actionable advice.
  `;

  try {
    // Using gemini-3-pro-preview for complex reasoning task
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: t.aiSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableAdvice: { type: Type.STRING },
            groupAnalysis: {
                type: Type.OBJECT,
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

    // Access .text property directly (not a method)
    const text = response.text || '{}';
    return JSON.parse(text.trim()) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to analyze feedback.");
  }
};
