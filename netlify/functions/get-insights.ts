import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

enum ColumnId {
  Goal = 1,
  Behaviors = 2,
  HiddenCommitments = 3,
  BigAssumptions = 4,
  Summary = 5,
}

type Column3Data = {
  worries: string;
  commitments: string;
};

type MapData = {
  [key: string]: string | string[] | Column3Data;
};

const getPromptAndConfigForColumn = (columnId: ColumnId, mapData: MapData): { contents: string; config: { systemInstruction: string } } | null => {
  const goal = (mapData[String(ColumnId.Goal)] as string) || "לא צוין";
  const behaviorsList = (mapData[String(ColumnId.Behaviors)] as string[]) || [];
  const behaviors = behaviorsList.length > 0 ? behaviorsList.map(b => `- ${b}`).join('\n') : "לא צוין";
  const hiddenCommitmentsData = (mapData[String(ColumnId.HiddenCommitments)] as Column3Data) || { worries: 'לא צוין', commitments: 'לא צוין' };
  const worries = hiddenCommitmentsData.worries || 'לא צוין';
  const commitments = hiddenCommitmentsData.commitments || 'לא צוין';
  const bigAssumptions = (mapData[String(ColumnId.BigAssumptions)] as string) || "לא צוין";
  
  let systemInstruction = "אתה יועץ מומחה למודל OBT (One Big Thing), המבוסס על עקרונות 'חסינות לשינוי' של קיגן ולהי. תן תגובה קצרה וממוקדת בפורמט Markdown.";
  let contents = "";

  switch (columnId) {
    case ColumnId.Goal:
      systemInstruction += "\n\n**משימה:** נסח 2-3 שאלות מאתגרות לחידוד המטרה שתינתן לך.";
      contents = `**מטרה:**\n> "${goal}"`;
      break;
    case ColumnId.Behaviors:
      systemInstruction += "\n\n**משימה:** נסח 2-3 שאלות שיעזרו למקד ולהפוך את ההתנהגויות הנתונות לספציפיות וברורות יותר. אל תקשר למטרה, התמקד רק בהתנהגויות עצמן.";
      contents = `**התנהגויות:**\n${behaviors}`;
      break;
    case ColumnId.HiddenCommitments:
      systemInstruction += "\n\n**משימה:** בהתבסס על הדאגות, נסח 2-3 שאלות שיעזרו לחדד את ניסוח ההתחייבות הנסתרת. ודא שההתחייבות מנוסחת באופן חיובי (למה אני כן מחויב/ת) ולא כשלילה. התמקד רק בחיבור בין הדאגות להתחייבות.";
      contents = `**דאגות:**\n> "${worries}"\n\n**התחייבות נסתרת:**\n> "${commitments}"`;
      break;
    case ColumnId.BigAssumptions:
      systemInstruction += "\n\n**משימה:** נסח 2-3 שאלות מאתגרות על הנחת היסוד הבאה, כדי לבחון את תוקפה ואת האופן שבו היא נתפסת כאמת מוחלטת. אל תקשר לעמודות קודמות, התמקד רק בהנחה עצמה.";
      contents = `**הנחת יסוד:**\n> "${bigAssumptions}"`;
      break;
    case ColumnId.Summary:
      systemInstruction = `אתה יועץ מומחה למודל OBT (One Big Thing), המבוסס על עקרונות 'חסינות לשינוי'. המשימה שלך היא לספק סיכום מאחד וחזק של נתוני המשתמש.
**הנחיות:**
1. פתח בפסקה קצרה שמסכמת את הקונפליקט המרכזי בין המטרה המוצהרת (טור 1) לבין ההתחייבות הנסתרת (טור 3).
2. הסבר כיצד ההתנהגויות (טור 2) הן למעשה "מערכת חיסון" מושלמת שמגינה על ההתחייבות הנסתרת ומופעלת על ידי הנחת היסוד הגדולה (טור 4).
3. סיים בשאלת מפתח אחת, נוקבת ומעוררת מחשבה, שמאתגרת את הנחת היסוד הגדולה ומציעה דרך להתחיל לערער אותה.

התגובה חייבת להיות בפורמט Markdown, קצרה, וממוקדת.`;
      contents = `**נתונים:**
- **מטרה (1):** "${goal}"
- **התנהגויות (2):**\n${behaviors}
- **התחייבות נסתרת (3):** "${commitments}"
- **הנחת יסוד (4):** "${bigAssumptions}"`;
      break;
    default:
      return null;
  }

  return { contents, config: { systemInstruction } };
};


const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
            headers: { 'Content-Type': 'application/json' },
        };
    }
    
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Request body is missing." }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    try {
        const { columnId, mapData } = JSON.parse(event.body);
        
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            console.error("API_KEY not found in server environment.");
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Server configuration error: API_KEY is missing." }),
                headers: { 'Content-Type': 'application/json' },
            };
        }
        
        const ai = new GoogleGenAI({ apiKey });
        
        const numericColumnId = Number(columnId);
        const promptAndConfig = getPromptAndConfigForColumn(numericColumnId, mapData);

        if (!promptAndConfig) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid column ID provided." }),
                headers: { 'Content-Type': 'application/json' },
            };
        }
        
        const { contents, config } = promptAndConfig;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config,
        });

        const text = response.text;
        
        return {
            statusCode: 200,
            body: text,
            headers: { 
                "Content-Type": "text/plain; charset=utf-8",
            },
        };

    } catch (error) {
        console.error("Error in get-insights function:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to get insights from AI.", details: errorMessage }),
            headers: { 'Content-Type': 'application/json' },
        };
    }
};

export { handler };