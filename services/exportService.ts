import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { AnalysisResult, FeedbackResponse, User } from "../types";

const relationshipLabels: Record<string, string> = {
  'manager': 'מנהלים',
  'peer': 'קולגות',
  'subordinate': 'כפיפים',
  'friend': 'חברים/משפחה',
  'other': 'אחר'
};

export const exportToWord = async (
  user: User, 
  analysis: AnalysisResult | null, 
  responses: FeedbackResponse[]
) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: `דוח צמיחה אישי 360 - ${user.name}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          bidirectional: true,
        }),
        new Paragraph({
            text: `תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            bidirectional: true,
        }),

        // Analysis Section (if exists)
        ...(analysis ? [
            new Paragraph({
                children: [
                    new TextRun({ text: `המטרה המקורית: "${user.userGoal || ""}"`, italics: true, rightToLeft: true }),
                ],
                bidirectional: true,
                spacing: { before: 400, after: 400 }
            }),

            // Part 1
            new Paragraph({
                text: "חלק 1: התנהגויות סותרות",
                heading: HeadingLevel.HEADING_2,
                bidirectional: true,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "דפוס בולט:", bold: true, size: 28, rightToLeft: true }),
                ],
                bidirectional: true,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: analysis.theOneBigThing_he,
                bidirectional: true,
                spacing: { after: 200 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "תמצית המיקודים:", bold: true, size: 24, rightToLeft: true }),
                ],
                bidirectional: true,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: analysis.executiveSummary_he,
                bidirectional: true,
                spacing: { after: 300 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "מה חזר על עצמו ובלט:", bold: true, size: 24, rightToLeft: true }),
                ],
                bidirectional: true,
                spacing: { after: 100 }
            }),
            ...(analysis.question1Analysis?.opportunities_he || []).map(o => new Paragraph({
                text: o,
                bidirectional: true,
                bullet: { level: 0 }
            })),

            // Part 2
            new Paragraph({
                text: "חלק 2: מטרות נוספות",
                heading: HeadingLevel.HEADING_2,
                bidirectional: true,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "מטרות נוספות שיכולות לסייע:", bold: true, size: 24, rightToLeft: true }),
                ],
                bidirectional: true,
                spacing: { after: 100 }
            }),
            ...(analysis.question2Analysis?.blockers_he || []).map(g => new Paragraph({
                text: g,
                bidirectional: true,
                bullet: { level: 0 }
            })),
            new Paragraph({
                children: [
                    new TextRun({ text: "כיווני התפתחות נוספים:", bold: true, size: 24, rightToLeft: true }),
                ],
                bidirectional: true,
                spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
                text: analysis.question2Analysis?.psychologicalPatterns_he,
                bidirectional: true,
                spacing: { after: 600 }
            })
        ] : []),

        // Raw Responses
        new Paragraph({
            text: "תשובות גולמיות (אנונימי)",
            heading: HeadingLevel.HEADING_2,
            bidirectional: true,
            spacing: { after: 200 }
        }),
        
        ...responses.flatMap((res, index) => [
            new Paragraph({
                children: [
                    new TextRun({ text: `משיב #${index + 1}`, bold: true, color: "888888" }),
                    new TextRun({ text: ` | ${relationshipLabels[res.relationship] || 'אחר'}`, color: "888888" })
                ],
                bidirectional: true,
                spacing: { before: 200, after: 100 }
            }),
            // Fixed: Iterate through the answers array to display feedback, resolving errors with q1_change/q2_actions
            ...res.answers.map((ans, aIdx) => new Paragraph({
                children: [
                    new TextRun({ text: `${aIdx + 1}. תשובה: `, bold: true }),
                    new TextRun({ text: ans.text })
                ],
                bidirectional: true,
            })),
            new Paragraph({
                text: "",
                spacing: { after: 300 },
                border: { bottom: { color: "cccccc", space: 1, style: "single", size: 6 } }
            })
        ])
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Growth_Report_${user.name.replace(/\s+/g, '_')}.docx`;
  a.click();
  window.URL.revokeObjectURL(url);
};