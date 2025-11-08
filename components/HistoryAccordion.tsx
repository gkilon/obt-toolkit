import React, { useState } from 'react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onClick }) => {
  return (
    <div className="border-b border-slate-200">
      <h2>
        <button
          type="button"
          className="flex justify-between items-center w-full py-5 font-semibold text-right text-slate-800 hover:bg-slate-50/50"
          onClick={onClick}
          aria-expanded={isOpen}
        >
          <span className="text-lg">{title}</span>
          <svg
            className={`w-6 h-6 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </h2>
      <div
        className={`grid transition-all duration-500 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-5 pr-2 text-slate-600 prose prose-sm max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryAccordion: React.FC = () => {
  const [openItem, setOpenItem] = useState<number | null>(1);

  const accordionItems = [
    {
      title: 'מהו מודל OBT (One Big Thing)?',
      content: (
        <p>
          כלי זה מבוסס על מודל OBT (One Big Thing), גישה ממוקדת לחשיפת המחסומים העמוקים שמונעים מאיתנו להשיג את השינוי המשמעותי ביותר שאנו שואפים אליו (ה-"דבר הגדול האחד" שלנו). המודל שואב את השראתו ועקרונותיו מתוך מודל "חסינות לשינוי" (Immunity to Change) שפותח על ידי הפרופסורים רוברט קיגן וליסה לייהי מאוניברסיטת הרווארד. הרעיון המרכזי הוא שמאחורי כל אתגר בשינוי התנהגותי, קיימת מערכת פסיכולוגית נסתרת שפועלת כדי להגן עלינו. מטרת הכלי היא לחשוף את המערכת הזו, להבין אותה, ובסופו של דבר - להתגבר עליה.
        </p>
      ),
    },
    {
      title: 'תפקיד ארבע העמודות',
      content: (
        <ul>
          <li><strong>עמודה 1 (מטרה):</strong> מגדירה את הכיוון הרצוי והחשוב לך. זוהי ההתחייבות הגלויה שלך.</li>
          <li><strong>עמודה 2 (התנהגויות):</strong> מזהה את הפעולות (או המחדלים) הספציфиים שסותרים את המטרה שלך.</li>
          <li><strong>עמודה 3 (התחייבויות נסתרות):</strong> חושפת את המניעים הרגשיים העמוקים שמפעילים את ההתנהגויות הסותרות. אלו הן מטרות מתחרות, שנועדו להגן עליך.</li>
          <li><strong>עמודה 4 (הנחות יסוד):</strong> מזהה את האמונות העמוקות והבלתי-מודעות שאת/ה מחזיק/ה כאמת מוחלטת, אשר מקיימות את כל המערכת במקומה.</li>
        </ul>
      ),
    },
    {
      title: 'כיצד בינה מלאכותית (AI) מסייעת בתהליך?',
      content: (
        <p>
          ה-AI בכלי זה משמש כ"יועץ-על" אובייקטיבי. הוא מנתח את התשובות שלך בכל שלב, מזהה דפוסים, קשרים וסתירות שאולי קשה לך לראות בעצמך. הוא מציע שאלות מאתגרות, מנסח מחדש תובנות ומסייע לך לחדד את המחשבה. הוא לא מחליף את התהליך האישי שלך, אלא משמש כמראה חכמה שמאיצה ומעמיקה את הגילוי העצמי.
        </p>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto mt-20 pt-10 border-t border-slate-200">
        <div className="text-center mb-8">
            <h3 className="text-3xl font-extrabold text-slate-900">הבסיס התיאורטי</h3>
        </div>
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80">
        {accordionItems.map((item, index) => (
          <AccordionItem
            key={index}
            title={item.title}
            isOpen={openItem === index + 1}
            onClick={() => setOpenItem(openItem === index + 1 ? null : index + 1)}
          >
            {item.content}
          </AccordionItem>
        ))}
      </div>
    </div>
  );
};

export default HistoryAccordion;