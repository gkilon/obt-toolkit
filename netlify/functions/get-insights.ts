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
  [key: string]: string | Column3Data;
};

const getPromptForColumn = (columnId: ColumnId, mapData: MapData): string => {
  const goal = (mapData[String(ColumnId.Goal)] as string) || "לא צוין";
  const behaviors = (mapData[String(ColumnId.Behaviors)] as string) || "לא צוין";
  const hiddenCommitmentsData = (mapData[String(ColumnId.HiddenCommitments)] as Column3Data) || { worries: 'לא צוין', commitments: 'לא צוין' };
  const worries = hiddenCommitmentsData.worries || 'לא צוין';
  const commitments = hiddenCommitmentsData.commitments || 'לא צוין';
  const bigAssumptions = (mapData[String(ColumnId.BigAssumptions)] as string) || "לא צוין";


  // Base instruction to set the context and demand speed, followed by a clear task.
  const baseInstruction = "אתה יועץ מומחה למודל OBT (One Big Thing), המבוסס על עקרונות 'חסינות לשינוי' של קיגן ולהי. תן תגובה קצרה וממוקדת בפורמט Markdown. התחל לספק תשובה מיידית.";

  switch (columnId) {
    case ColumnId.Goal:
      return `${baseInstruction}\n\n**משימה:** נסח 2-3 שאלות מאתגרות לחידוד המטרה הבאה:\n> "${goal}"`;
    case ColumnId.Behaviors:
      return `${baseInstruction}\n\n**משימה:** נסח 2-3 שאלות חוקרות על הפער בין המטרה להתנהגות.\n**מטרה:**\n> "${goal}"\n**התנהגויות מנוגדות:**\n> "${behaviors}"`;
    case ColumnId.HiddenCommitments:
      return `${baseInstruction}\n\n**משימה:** נתח את הקשר בין הדאגות להתחייבות, הצע ניסוח חד להתחייבות, וסיים בשאלה נוקבת אחת על מחיר ההתחייבות.\n**דאגות:**\n> "${worries}"\n**התחייבות נסתרת:**\n> "${commitments}"`;
    case ColumnId.BigAssumptions:
      return `${baseInstruction}\n\n**משימה:** נסח שתי הנחות יסוד אפשריות שנובעות מההתחייבות הנסתרת.\n**התחייבות נסתרת:**\n> "${commitments}"`;
    case ColumnId.Summary:
      return `אתה יועץ מומחה למודל OBT (One Big Thing), המבוסס על עקרונות 'חסינות לשינוי', וסיימת לנתח את ארבעת העמודים של המשתמש. המשימה שלך היא לספק סיכום מאחד וחזק.
**הנחיות:**
1. פתח בפסקה קצרה שמסכמת את הקונפליקט המרכזי בין המטרה המוצהרת (טור 1) לבין ההתחייבות הנסתרת (טור 3).
2. הסבר כיצד ההתנהגויות (טור 2) הן למעשה "מערכת חיסון" מושלמת שמגינה על ההתחייבות הנסתרת ומופעלת על ידי הנחת היסוד הגדולה (טור 4).
3. סיים בשאלת מפתח אחת, נוקבת ומעוררת מחשבה, שמאתגרת את הנחת היסוד הגדולה ומציעה דרך להתחיל לערער אותה.

התגובה חייבת להיות בפורמט Markdown, קצרה, וממוקדת. התחל לספק תשובה מיידית.

**נתונים:**
- **מטרה (1):** "${goal}"
- **התנהגויות (2):** "${behaviors}"
- **התחייבות נסתרת (3):** "${commitments}"
- **הנחת יסוד (4):** "${bigAssumptions}"`;
    default:
      return "";
  }
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
        const prompt = getPromptForColumn(numericColumnId, mapData);

        if (!prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid column ID provided." }),
                headers: { 'Content-Type': 'application/json' },
            };
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
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