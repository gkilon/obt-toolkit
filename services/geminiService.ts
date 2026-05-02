
import { AnalysisResult, FeedbackResponse, SurveyQuestion } from "../types";

export const analyzeFeedback = async (
  responses: FeedbackResponse[], 
  userGoal?: string,
  questions: SurveyQuestion[] = []
): Promise<AnalysisResult> => {
  if (!responses || responses.length === 0) throw new Error("No responses for analysis.");
  
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
    
    Return ONLY JSON.
  `;

  const responseSchema = {
    type: "object",
    properties: {
      goalPrecision: {
          type: "object",
          properties: {
              score: { type: "number" },
              critique_he: { type: "string" },
              critique_en: { type: "string" },
              refinedGoal_he: { type: "string" },
              refinedGoal_en: { type: "string" }
          },
          required: ["score", "critique_he", "critique_en", "refinedGoal_he", "refinedGoal_en"]
      },
      executiveSummary_he: { type: "string" },
      executiveSummary_en: { type: "string" },
      theOneBigThing_he: { type: "string" },
      theOneBigThing_en: { type: "string" },
      alternativeOBT_he: { type: "string" },
      alternativeOBT_en: { type: "string" },
      question1Analysis: {
          type: "object",
          properties: {
              opportunities_he: { type: "array", items: { type: "string" } },
              opportunities_en: { type: "array", items: { type: "string" } }
          },
          required: ["opportunities_he", "opportunities_en"]
      },
      question2Analysis: {
          type: "object",
          properties: {
              blockers_he: { type: "array", items: { type: "string" } },
              blockers_en: { type: "array", items: { type: "string" } },
              psychologicalPatterns_he: { type: "string" },
              psychologicalPatterns_en: { type: "string" }
          },
          required: ["blockers_he", "blockers_en", "psychologicalPatterns_he", "psychologicalPatterns_en"]
      },
      actionPlan: {
          type: "array",
          items: {
              type: "object",
              properties: {
                  title_he: { type: "string" },
                  title_en: { type: "string" },
                  content_he: { type: "string" },
                  content_en: { type: "string" }
              },
              required: ["title_he", "title_en", "content_he", "content_en"]
          }
      }
    },
    required: ["goalPrecision", "executiveSummary_he", "executiveSummary_en", "theOneBigThing_he", "theOneBigThing_en", "question1Analysis", "question2Analysis", "actionPlan"],
  };

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: [{ text: prompt }],
        systemInstruction: { text: "You are a professional executive coach. Be sharp, direct, and fast. Output raw JSON ONLY. No markdown formatting." },
        responseSchema
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze feedback');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Could not initialize stream reader");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
    }

    return JSON.parse(fullText.trim()) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error("הניתוח נכשל או לקח זמן רב מדי. אנא נסה שנית.");
  }
};

