import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { MapData, ColumnId, Column3Data } from '../types';
import { ResizableTextarea } from './Column';

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
      <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-slate-600 text-lg font-medium">מנתח את המפה שלך...</p>
      <p className="text-slate-500 text-sm mt-2">זה עשוי לקחת מספר רגעים.</p>
    </div>
  );

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapData: MapData;
  onMapUpdate: (newData: MapData) => void;
  isSummaryLoading: boolean;
  summaryContent: string;
  onGetSummary: () => void;
}

const Section: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">{title}</h3>
        {children}
    </div>
);

const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, mapData, onMapUpdate, isSummaryLoading, summaryContent, onGetSummary }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState<MapData>(mapData);

  useEffect(() => {
    if (isOpen) {
        setIsEditing(false);
        setTempData(mapData);
        // Automatically request summary if it's empty when modal opens
        if (!summaryContent) {
            onGetSummary();
        }
    }
  }, [isOpen, mapData]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }
  
  const handleEdit = () => {
    setTempData(mapData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempData(mapData); // Revert changes
  };
  
  const handleSave = () => {
    const cleanedData = {
        ...tempData,
        [ColumnId.Behaviors]: tempData[ColumnId.Behaviors].filter(b => b.trim() !== '')
    };
    onMapUpdate(cleanedData);
    setIsEditing(false);
  };
  
  const renderTextView = (text: string) => (
    <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap min-h-[40px] py-2 px-1">{text || <span className="text-slate-400 italic">אין תוכן</span>}</div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      aria-labelledby="summary-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col transform transition-transform duration-300 scale-95 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 id="summary-modal-title" className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m-6 3l6-3m0 0l6-3m-6 3V7" />
            </svg>
            לוח סיכום וניתוח
          </h2>
          <div className="flex items-center gap-4">
            {!isEditing && (
                <button onClick={handleEdit} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    ערוך את המפה
                </button>
            )}
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="סגור חלון"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 border-r border-slate-200 overflow-y-auto">
                <Section title="1. מטרת השיפור">
                    {isEditing ? (
                        <ResizableTextarea
                            value={tempData[ColumnId.Goal]}
                            onChange={e => setTempData(p => ({...p, [ColumnId.Goal]: e.target.value}))}
                            placeholder="מהי המטרה החשובה ביותר?"
                            className="bg-slate-50 min-h-[50px] !py-2 !px-3"
                        />
                    ) : renderTextView(mapData[ColumnId.Goal])}
                </Section>

                <Section title="2. מה אני עושה/לא עושה">
                    {isEditing ? (
                        <div className="space-y-2">
                             {tempData[ColumnId.Behaviors].map((behavior, index) => (
                                <div key={index} className="flex items-start gap-2">
                                    <ResizableTextarea
                                        value={behavior}
                                        onChange={e => {
                                            const newBehaviors = [...tempData[ColumnId.Behaviors]];
                                            newBehaviors[index] = e.target.value;
                                            setTempData(p => ({...p, [ColumnId.Behaviors]: newBehaviors}));
                                        }}
                                        placeholder={`התנהגות #${index + 1}`}
                                        className="bg-slate-50 min-h-[50px] !py-2 !px-3"
                                    />
                                    <button onClick={() => {
                                        const newBehaviors = tempData[ColumnId.Behaviors].filter((_, i) => i !== index);
                                        setTempData(p => ({...p, [ColumnId.Behaviors]: newBehaviors}));
                                    }} className="text-slate-400 hover:text-red-500 p-1 mt-1.5 rounded-full hover:bg-red-100 transition-colors flex-shrink-0" aria-label={`הסר התנהגות ${index + 1}`}>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => { setTempData(p => ({...p, [ColumnId.Behaviors]: [...p[ColumnId.Behaviors], '']}))}} className="text-sm font-semibold text-blue-600 hover:text-blue-800 mt-2">
                                + הוסף התנהגות
                            </button>
                        </div>
                    ) : (
                        (mapData[ColumnId.Behaviors] && mapData[ColumnId.Behaviors].length > 0) ? (
                            <ul className="list-disc pl-5 prose prose-sm max-w-none text-slate-800 space-y-1">
                                {mapData[ColumnId.Behaviors].map((behavior, index) => (
                                    <li key={index}>{behavior}</li>
                                ))}
                            </ul>
                        ) : renderTextView('')
                    )}
                </Section>

                <Section title="3. חששות והתחייבויות נסתרות">
                    {isEditing ? (
                        <>
                            <h4 className="font-semibold text-slate-700 mb-2">דאגות</h4>
                            <ResizableTextarea
                                value={(tempData[ColumnId.HiddenCommitments] as Column3Data).worries}
                                onChange={e => setTempData(p => ({...p, [ColumnId.HiddenCommitments]: {...(p[ColumnId.HiddenCommitments] as Column3Data), worries: e.target.value}}))}
                                placeholder="מה מדאיג אותך?"
                                className="bg-slate-50 mb-4 min-h-[50px] !py-2 !px-3"
                            />
                            <h4 className="font-semibold text-slate-700 mb-2">התחייבויות נסתרות</h4>
                            <ResizableTextarea
                                value={(tempData[ColumnId.HiddenCommitments] as Column3Data).commitments}
                                onChange={e => setTempData(p => ({...p, [ColumnId.HiddenCommitments]: {...(p[ColumnId.HiddenCommitments] as Column3Data), commitments: e.target.value}}))}
                                placeholder="למה את/ה באמת מחויב/ת?"
                                className="bg-slate-50 min-h-[50px] !py-2 !px-3"
                            />
                        </>
                    ) : (
                        <>
                            <h4 className="font-semibold text-slate-700 mb-2">דאגות</h4>
                            {renderTextView((mapData[ColumnId.HiddenCommitments] as Column3Data).worries)}
                            <h4 className="font-semibold text-slate-700 mb-2 mt-4">התחייבויות נסתרות</h4>
                             {renderTextView((mapData[ColumnId.HiddenCommitments] as Column3Data).commitments)}
                        </>
                    )}
                </Section>

                <Section title="4. הנחות יסוד גדולות">
                    {isEditing ? (
                         <ResizableTextarea
                            value={tempData[ColumnId.BigAssumptions]}
                            onChange={e => setTempData(p => ({...p, [ColumnId.BigAssumptions]: e.target.value}))}
                            placeholder="איזו הנחה עמוקה את/ה מחזיק/ה כאמת?"
                            className="bg-slate-50 min-h-[50px] !py-2 !px-3"
                        />
                    ) : renderTextView(mapData[ColumnId.BigAssumptions])}
                </section>
            </div>
             <div className="p-8 bg-slate-50 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">ניתוח ותובנות AI</h3>
                    <button
                        onClick={onGetSummary}
                        disabled={isSummaryLoading || isEditing}
                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                        title={isEditing ? "שמור או בטל שינויים כדי לרענן את הניתוח" : "רענן ניתוח AI"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isSummaryLoading ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        {isSummaryLoading ? 'מעבד...' : 'רענן ניתוח'}
                    </button>
                </div>

                <div className="flex-grow bg-white rounded-lg p-5 border border-slate-200 min-h-[200px]">
                    {isSummaryLoading ? (
                        <LoadingSpinner />
                    ) : summaryContent ? (
                        <div className="prose prose-base max-w-none text-slate-700">
                            <ReactMarkdown>{summaryContent}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 pt-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <p className="mt-4 text-sm">כאן יוצג ניתוח מקיף של המפה שלך.</p>
                        </div>
                    )}
                </div>
             </div>
        </main>
        {isEditing && (
            <footer className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end items-center gap-3 flex-shrink-0">
                <button onClick={handleCancel} className="px-6 py-2 rounded-lg text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors font-semibold">ביטול</button>
                <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">שמור שינויים</button>
            </footer>
        )}
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SummaryModal;