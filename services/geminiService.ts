
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
    Analyze 360 feedback for development.
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
        systemInstruction: { text: "You are a professional executive coach. Your analysis must be simple and consists of two parts: 1) Contradicting behaviors (Direct, factual bullet points of what recurring behaviors CONTRADICT the goal - what they do or don't do, without using 'improvement' language + concise summary) and 2) Additional goals derived from feedback. Be sharp, dry, and direct. Output raw JSON ONLY. No markdown formatting." },
        responseSchema: {
          type: "object",
          properties: {
          executiveSummary_he: { type: "string", description: "SUMMARY of focus points regarding contradicting behaviors" },
          executiveSummary_en: { type: "string" },
          theOneBigThing_he: { type: "string", description: "The core contradicting behavior pattern" },
          theOneBigThing_en: { type: "string" },
          question1Analysis: {
              type: "object",
              description: "CONTRADICTING BEHAVIORS - Bullet points",
              properties: {
                  opportunities_he: { type: "array", items: { type: "string" }, description: "Bullet points of recurring contradicting behaviors" },
                  opportunities_en: { type: "array", items: { type: "string" } }
              },
              required: ["opportunities_he", "opportunities_en"]
          },
          question2Analysis: {
              type: "object",
              description: "ADDITIONAL GOALS",
              properties: {
                  blockers_he: { type: "array", items: { type: "string" }, description: "Suggested additional goals" },
                  blockers_en: { type: "array", items: { type: "string" } },
                  psychologicalPatterns_he: { type: "string", description: "Brief synthesis of additional growth areas" },
                  psychologicalPatterns_en: { type: "string" }
              },
              required: ["blockers_he", "blockers_en", "psychologicalPatterns_he", "psychologicalPatterns_en"]
          }
        },
        required: ["executiveSummary_he", "executiveSummary_en", "theOneBigThing_he", "theOneBigThing_en", "question1Analysis", "question2Analysis"],
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


