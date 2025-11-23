import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFeedback = async (responses: string[]): Promise<AnalysisResult> => {
  if (responses.length === 0) {
    throw new Error("No responses to analyze");
  }

  const ai = getClient();
  
  const prompt = `
    הנה רשימה של תשובות שניתנו על ידי אנשים שונים לשאלה: "מהו הדבר האחד שאם אשנה אותו יקפיץ אותי קדימה?".
    
    המשימה שלך היא לנתח את כל התשובות הללו, למצוא את המכנה המשותף, ולסכם את ה"דבר הגדול" שאני צריך לשנות.
    התייחס לזה כמו מאמן קריירה אמפתי אך חד.
    
    התשובות:
    ${JSON.stringify(responses)}
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert organizational psychologist and career coach speaking Hebrew.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A concise summary of the main feedback point (The One Thing).",
            },
            keyThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3-5 recurring themes or keywords found in the feedback.",
            },
            actionableAdvice: {
              type: Type.STRING,
              description: "A specific, encouraging piece of advice based on this feedback.",
            },
          },
          required: ["summary", "keyThemes", "actionableAdvice"],
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