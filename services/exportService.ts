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
            // Fixed: Using language-specific field executiveSummary_he
            new Paragraph({
                text: analysis.executiveSummary_he,
                bidirectional: true,
                spacing: { after: 300 }
            }),
            // Note: groupPerspectives does not exist on AnalysisResult, 
            // but question1Analysis and question2Analysis do. 
            // We'll skip groupPerspectives since it's not in the type definition.
            
            new Paragraph({
                children: [
                    new TextRun({ text: "תכנית פעולה:", bold: true, size: 28, rightToLeft: true }),
                ],
                bidirectional: true,
                spacing: { before: 300 }
            }),
            // Fixed: Using language-specific field theOneBigThing_he
            new Paragraph({
                text: analysis.theOneBigThing_he,
                bidirectional: true,
            }),
            // Fixed: Using language-specific fields from DeepInsight
            ...analysis.actionPlan.map(step => new Paragraph({
                children: [
                    new TextRun({ text: `${step.title_he}: `, bold: true }),
                    new TextRun({ text: step.content_he })
                ],
                bidirectional: true,
                bullet: { level: 0 }
            })),
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