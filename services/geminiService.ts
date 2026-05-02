
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
   1. PART 1 - CONTRADICTING BEHAVIORS: Identify recurring behaviors that CONTRADICT the Target Goal based on the feedback ("What does the person do or not do that contradicts their goal?"). 
       Style: Sharp and factual. DO NOT use improvement language like "needs to", "should", or "develop". For example: instead of "He should be more assertive", write "He does not express his opinion in meetings".
       Present as bullet points of what stood out and a concise summary of the main patterns.
    2. PART 2 - ADDITIONAL GOALS: Based on the feedback, suggest other potential goals the user could set for themselves if relevant.
    
    Style: Sharp, direct, and factual. No coaching jargon.
    Return ONLY JSON.
  `;

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { text: "You are a professional executive coach. Focus on identifying behaviors that contradict the user's goal. Focus on 'what characterizes' these behaviors rather than 'why' they happen. Provide synthesis and integration without explanation. Be sharp, direct, and fast. Output raw JSON ONLY. No markdown formatting." },
        responseSchema: {
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
        }
      })
    });

    if (!response.ok) {
      let errorMessage = 'Analysis failed';
      try {
        const bodyText = await response.text();
        try {
          const errorData = JSON.parse(bodyText);
          errorMessage = errorData.error || bodyText;
        } catch (e) {
          errorMessage = bodyText || errorMessage;
        }
      } catch (e) {
        // Fallback
      }
      console.error("Backend error detected:", errorMessage);
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Could not initialize stream reader");

    const decoder = new TextDecoder();
    let fullText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }
    } catch (streamError) {
      console.error("Streaming error:", streamError);
      throw new Error("שגיאה בהזרמת נתונים מהשרת. אנא נסה שנית.");
    }

    if (!fullText.trim()) {
      throw new Error("השרת החזיר תשובה ריקה.");
    }

    try {
      return JSON.parse(fullText.trim()) as AnalysisResult;
    } catch (parseError) {
      console.error("JSON Parse Error. Full text received:", fullText);
      throw new Error("הניתוח נכשל בגלל מבנה נתונים לא תקין.");
    }
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    // Be transparent with the user about the error
    throw error;
  }
};


