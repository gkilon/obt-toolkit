


import type { Handler, HandlerEvent } from "@netlify/functions";
// Fix: Import `Type` to be used for defining a response schema.
import { GoogleGenAI, Type } from "@google/genai";
import { ColumnId, MapData, ChatMessage, Column3Data } from "../../types";

const getSystemInstruction = (mapData: MapData): string => {
    const goal = (mapData[ColumnId.Goal] as string) || "טרם הוגדרה";
    const behaviorsList = (mapData[ColumnId.Behaviors] as string[]) || [];
    const behaviors = behaviorsList.length > 0 ? behaviorsList.map(b => `- ${b}`).join('\n') : "טרם הוגדרו";
    const hiddenCommitmentsData = (mapData[ColumnId.HiddenCommitments] as Column3Data) || { worries: 'טרם הוגדרו', commitments: 'טרם הוגדרו' };
    const commitments = hiddenCommitmentsData.commitments || 'טרם הוגדרו';
    const bigAssumptions = (mapData[ColumnId.BigAssumptions] as string) || "טרם הוגדרה";

    return `אתה "OBT Expert", מאמן AI מומחה למודל OBT (One Big Thing).

**ידע על המודל:**
המודל מבוסס על עקרונות "חסינות לשינוי" (Immunity to Change). הרעיון המרכזי הוא שמאחורי כל אתגר בשינוי התנהגותי, קיימת מערכת פסיכולוגית נסתרת (מערכת החיסון הנפשית) שפועלת כדי להגן עלינו. המטרה היא לחשוף את המערכת הזו דרך 4 עמודות:
1.  **מטרה:** ההתחייבות הגלויה לשינוי.
2.  **התנהגויות:** הפעולות שסותרות את המטרה.
3.  **התחייבויות נסתרות:** המניעים הרגשיים והמטרות המתחרות שמפעילות את ההתנהגויות.
4.  **הנחות יסוד:** האמונות העמוקות שמקיימות את כל המערכת.

**המשימה שלך:**
המטרה הבלעדית שלך היא לסייע למשתמש למלא את 4 עמודי המפה, ולא שום דבר אחר.

**הנחיות קפדניות:**
1.  אל תיתן עצות, אל תציע פתרונות, ואל תרחיב על נושאים שאינם קשורים ישירות למילוי העמודה הנוכחית.
2.  היה אמפתי ותומך, אך הישאר ממוקד במשימה.
3.  שמור על תגובות קצרות וממוקדות (2-3 משפטים).
4.  שאל שאלות פתוחות כדי לעורר חשיבה. אל תיתן תשובות במקום המשתמש.
5.  התייחס תמיד למשתמש בגוף שני (את/ה, שלך וכו').
6.  השתמש ב-Markdown לעיצוב קריא והדגשה.

**תהליך ההנחיה (לפי עמודות):**
-   **שלב 1 (מטרה):** אם עמודה 1 ריקה, התחל כאן. עזור למשתמש לנסח מטרה משמעותית.
-   **שלב 2 (התנהגויות):** לאחר הגדרת המטרה, עזור לו לזהות התנהגויות סותרות.
-   **שלב 3 (התחייבויות):** לאחר זיהוי ההתנהגויות, עזור לו לחשוף פחדים ומשם לנסח התחייבות נסתרת.
-   **שלב 4 (הנחות יסוד):** לאחר ניסוח ההתחייבות, עזור לו לזהות את הנחת היסוד הגדולה.

**תגובתך חייבת להיות בפורמט JSON בלבד, עם שני שדות:**
1.  `"text"`: תגובתך למשתמש בפורמט Markdown.
2.  `"focusedColumn"`: מספר העמודה (1, 2, 3, או 4) שבה השיחה מתמקדת כעת.

**מצב המפה הנוכחי של המשתמש:**
- **מטרה (1):** ${goal}
- **התנהגויות (2):**
${behaviors}
- **התחייבות נסתרת (3):** ${commitments}
- **הנחת יסוד (4):** ${bigAssumptions}
`;
};

const determineFocusedColumn = (responseText: string): ColumnId => {
    if (responseText.includes('עמודה 1') || responseText.includes('מטרה')) return ColumnId.Goal;
    if (responseText.includes('עמודה 2') || responseText.includes('התנהגויות')) return ColumnId.Behaviors;
    if (responseText.includes('עמודה 3') || responseText.includes('התחייבות')) return ColumnId.HiddenCommitments;
    if (responseText.includes('עמודה 4') || responseText.includes('הנחת יסוד')) return ColumnId.BigAssumptions;
    // Default fallback
    return ColumnId.Goal;
};


const handler: Handler = async (event: HandlerEvent) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 400, body: JSON.stringify({ error: "Bad Request" }) };
    }

    try {
        const { history, mapData } = JSON.parse(event.body);
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error" }) };
        }

        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = getSystemInstruction(mapData);
        
        // Convert chat history for the API
        const contents = history.map((msg: ChatMessage) => ({
            role: msg.sender === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }],
        }));

        // Fix: Adding a responseSchema to ensure the model returns valid JSON,
        // which helps prevent parsing and type errors downstream.
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                // FIX: `Type.STRING` is an enum value (a string), not a function. It should not be called with `()`.
                text: { type: Type.STRING },
                // FIX: `Type.NUMBER` is an enum value (a string), not a function. It should not be called with `()`.
                focusedColumn: { type: Type.NUMBER }
            },
            required: ['text', 'focusedColumn']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });

        const responseText = response.text;
        let responseJson;
        try {
           responseJson = JSON.parse(responseText);
        } catch {
            // Fallback if the model doesn't return perfect JSON
            console.warn("AI response was not valid JSON. Falling back.");
            const focusedColumn = determineFocusedColumn(responseText);
            responseJson = { text: responseText, focusedColumn: focusedColumn };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(responseJson),
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        };

    } catch (error) {
        console.error("Error in chatbot function:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to get response from AI.", details: errorMessage }),
            headers: { 'Content-Type': 'application/json' },
        };
    }
};

export { handler };
