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
                text: "סיכום תובנות (AI Analysis)",
                heading: HeadingLevel.HEADING_2,
                bidirectional: true,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "הדבר האחד לפריצת דרך:", bold: true, size: 28, rightToLeft: true }),
                ],
                bidirectional: true,
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: analysis.summary,
                bidirectional: true,
                spacing: { after: 300 }
            }),
            // Group Analysis
            ...(analysis.groupAnalysis ? [
                 new Paragraph({
                    children: [new TextRun({ text: "תובנות לפי קבוצות:", bold: true, size: 24, rightToLeft: true })],
                    bidirectional: true,
                    spacing: { before: 200, after: 100 }
                }),
                ...Object.entries(analysis.groupAnalysis).map(([key, val]) => new Paragraph({
                    children: [
                        new TextRun({ text: `${relationshipLabels[key] || key}: `, bold: true }),
                        new TextRun({ text: val })
                    ],
                    bidirectional: true,
                    bullet: { level: 0 }
                }))
            ] : []),
            new Paragraph({
                children: [
                    new TextRun({ text: "המלצה לפעולה:", bold: true, size: 28, rightToLeft: true }),
                ],
                bidirectional: true,
                spacing: { before: 300 }
            }),
            new Paragraph({
                text: analysis.actionableAdvice,
                bidirectional: true,
            }),
            new Paragraph({ text: "", spacing: { after: 600 } }) // Spacer
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
            new Paragraph({
                children: [
                    new TextRun({ text: "1. הדבר לשינוי: ", bold: true }),
                    new TextRun({ text: res.q1_change })
                ],
                bidirectional: true,
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "2. פעולות סותרות: ", bold: true }),
                    new TextRun({ text: res.q2_actions })
                ],
                bidirectional: true,
                spacing: { after: 300 },
                border: { bottom: { color: "cccccc", space: 1, value: "single", size: 6 } }
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