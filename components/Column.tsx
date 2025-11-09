import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Column3Data, ColumnId } from '../types';

interface ColumnProps {
  id: ColumnId;
  title: string;
  description: string;
  value: string | string[] | Column3Data;
  onValueChange: (value: any) => void;
  onGetInsights: () => void;
  insights?: string;
  isLoading: boolean;
  isButtonDisabled: boolean;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span className="ml-3 text-slate-600 font-medium">מייצר תובנות...</span>
  </div>
);

export const ResizableTextarea: React.FC<{
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
    onBlur?: () => void;
    placeholder: string;
    className?: string;
    autoFocus?: boolean;
}> = ({ value, onChange, onBlur, placeholder, className = "", autoFocus = false }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
          if (autoFocus) {
            textarea.focus();
            textarea.selectionStart = textarea.value.length;
            textarea.selectionEnd = textarea.value.length;
          }
        }
    }, [value, autoFocus]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 resize-none text-slate-900 text-base min-h-[120px] bg-slate-50 ${className}`}
            placeholder={placeholder}
        />
    );
}

const EditControls: React.FC<{
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
}> = ({ isEditing, onEdit, onSave, onCancel }) => (
    <div className="flex justify-end gap-2 mb-2">
        {isEditing ? (
            <>
                <button onClick={onCancel} className="text-sm font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-md transition-colors">
                    ביטול
                </button>
                 <button onClick={onSave} className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-md transition-colors flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    שמור
                </button>
            </>
        ) : (
            <button onClick={onEdit} className="text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                ערוך
            </button>
        )}
    </div>
  )


const Column: React.FC<ColumnProps> = ({ id, title, description, value, onValueChange, onGetInsights, insights, isLoading, isButtonDisabled }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  // State for Column 3 parts
  const [isEditingWorries, setIsEditingWorries] = useState(false);
  const [isEditingCommitments, setIsEditingCommitments] = useState(false);
  const [tempWorries, setTempWorries] = useState('');
  const [tempCommitments, setTempCommitments] = useState('');
  
   useEffect(() => {
    if (id === ColumnId.HiddenCommitments) {
        const col3Value = value as Column3Data;
        if (!isEditingWorries) setTempWorries(col3Value.worries || '');
        if (!isEditingCommitments) setTempCommitments(col3Value.commitments || '');
    } else {
        if (!isEditing) setTempValue(value);
    }
  }, [value, isEditing, isEditingWorries, isEditingCommitments, id]);

  const renderTextView = (text: string | undefined) => (
    <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap min-h-[120px] py-3 px-3 border border-transparent rounded-lg bg-slate-100/70">
      {text && text.trim() ? (
         <ReactMarkdown>{text}</ReactMarkdown>
      ) : (
        <span className="text-slate-500 italic">אין עדיין תוכן. לחץ על 'ערוך' כדי להתחיל.</span>
      )}
    </div>
  );

  const renderContent = () => {
    if (id === ColumnId.HiddenCommitments) {
      const originalCol3Value = value as Column3Data;
      
      const handleSaveWorries = () => {
        onValueChange({ ...originalCol3Value, worries: tempWorries });
        setIsEditingWorries(false);
      };

      const handleSaveCommitments = () => {
        onValueChange({ ...originalCol3Value, commitments: tempCommitments });
        setIsEditingCommitments(false);
      };
      
      return (
        <>
            <div className="mb-6">
                <h4 className="font-semibold text-slate-800 mb-2">חלק א': תיבת הדאגות</h4>
                <p className="text-slate-600 mb-3 text-sm">דמיין/י שאת/ה עושה את ההיפך מההתנהגויות שבטור 2. רשום/י את כל הדאגות, הפחדים והתחושות הלא נעימות שעולות.</p>
                <EditControls 
                    isEditing={isEditingWorries}
                    onEdit={() => setIsEditingWorries(true)}
                    onSave={handleSaveWorries}
                    onCancel={() => {
                        setIsEditingWorries(false);
                        setTempWorries(originalCol3Value.worries);
                    }}
                />
                {isEditingWorries ? (
                    <ResizableTextarea
                        value={tempWorries}
                        onChange={(e) => setTempWorries(e.target.value)}
                        placeholder="לדוגמה: 'אני חושש/ת שיכעסו עליי', 'אני מפחד/ת להיראות לא מקצועי/ת'..."
                        autoFocus
                    />
                ) : (
                    renderTextView(originalCol3Value.worries)
                )}
            </div>
            <div>
                 <h4 className="font-semibold text-slate-800 mb-2">חלק ב': התחייבויות נסתרות</h4>
                <p className="text-slate-600 mb-3 text-sm">הדאגות שלך מצביעות על מחויבויות עמוקות. למה את/ה מחויב/ת כדי למנוע מהדאגות להתממש? נסח זאת כ"אני מחויב/ת ל...".</p>
                <EditControls
                    isEditing={isEditingCommitments}
                    onEdit={() => setIsEditingCommitments(true)}
                    onSave={handleSaveCommitments}
                    onCancel={() => {
                        setIsEditingCommitments(false);
                        setTempCommitments(originalCol3Value.commitments);
                    }}
                />
                {isEditingCommitments ? (
                    <ResizableTextarea
                        value={tempCommitments}
                        onChange={(e) => setTempCommitments(e.target.value)}
                        placeholder="לדוגמה: 'אני מחויב/ת לא לאכזב אנשים', 'אני מחויב/ת להיות תמיד בשליטה'..."
                        autoFocus
                    />
                ) : (
                    renderTextView(originalCol3Value.commitments)
                )}
            </div>
        </>
      );
    }

    if (id === ColumnId.Behaviors) {
        if(isEditing) {
            const behaviors = tempValue as string[];
            return (
                <div>
                    {behaviors.map((behavior, index) => (
                        <div key={index} className="flex items-start gap-2 mb-2">
                            <ResizableTextarea
                                value={behavior}
                                onChange={e => {
                                    const newBehaviors = [...behaviors];
                                    newBehaviors[index] = e.target.value;
                                    setTempValue(newBehaviors);
                                }}
                                placeholder={`התנהגות #${index + 1}`}
                                className="bg-slate-50 min-h-[50px] !p-2"
                                autoFocus={index === behaviors.length - 1 && behavior === ''}
                            />
                            <button 
                                onClick={() => {
                                    setTempValue(behaviors.filter((_, i) => i !== index));
                                }} 
                                className="text-slate-400 hover:text-red-500 p-1 mt-1.5 rounded-full hover:bg-red-100 transition-colors flex-shrink-0"
                                aria-label={`הסר התנהגות ${index + 1}`}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                            </button>
                        </div>
                    ))}
                    <button onClick={() => { setTempValue([...(tempValue as string[]), '']); }} className="text-sm font-semibold text-blue-600 hover:bg-blue-100 rounded-md p-2 w-full text-center mt-2 transition-colors">
                        + הוסף התנהגות
                    </button>
                </div>
            );
        } else {
            const behaviors = value as string[];
            if (!behaviors || behaviors.length === 0) {
                return renderTextView(undefined);
            }
            const markdownText = behaviors.map(b => `- ${b}`).join('\n');
            return (
                 <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap min-h-[120px] py-3 px-3 border border-transparent rounded-lg bg-slate-100/70">
                    <ReactMarkdown>{markdownText}</ReactMarkdown>
                </div>
            );
        }
    }

    // Render logic for regular columns (Goal, BigAssumptions)
    if (isEditing) {
        return (
          <ResizableTextarea
            value={tempValue as string}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="התחל לכתוב כאן..."
            autoFocus
          />
        );
    }
    
    return renderTextView(value as string);
  };

  const handleSave = () => {
    if (id === ColumnId.Behaviors) {
        onValueChange((tempValue as string[]).filter(b => b.trim() !== ''));
    } else {
        onValueChange(tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col h-full border border-slate-200/80">
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-4 text-sm">{description}</p>
      
      {id !== ColumnId.HiddenCommitments && (
          <EditControls
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
            onCancel={handleCancel}
          />
      )}
      
      <div className="mb-4">
        {renderContent()}
      </div>

      <div className="mt-auto pt-4 space-y-4">
        <button
          onClick={onGetInsights}
          disabled={isLoading || isButtonDisabled}
          className="w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.02] disabled:scale-100"
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6c0 1.887 1.12 3.535 2.756 4.332l-1.01 1.01A1 1 0 006.414 15H7a1 1 0 001-1v-1.086a1 1 0 00-.293-.707l-1.054-1.054A4 4 0 016 8a4 4 0 014-4V2z" />
                <path d="M14 6a1 1 0 011 1v1.086a1 1 0 01.293.707l1.054 1.054A4 4 0 0014 8a4 4 0 00-4 4v2a6 6 0 016-6z" />
            </svg>
          )}
          קבל תובנות AI
        </button>
        <div className="bg-blue-50 rounded-lg p-4 flex-grow min-h-[150px] border border-blue-200/80">
           <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <div className="bg-white p-1.5 rounded-full shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.237a5.503 5.503 0 014.5 4.513c0 2.251-1.333 4.14-3.25 5.035V16.25a.75.75 0 01-1.5 0v-2.715C8.583 12.64 7.25 10.751 7.25 8.5A5.503 5.503 0 0111.75 4.027V2.75A.75.75 0 0110 2zM8.75 17.5a.75.75 0 00-1.5 0v.135A2.75 2.75 0 0010 20a2.75 2.75 0 002.75-2.365V17.5a.75.75 0 00-1.5 0v.135a1.25 1.25 0 01-2.5 0V17.5z" clipRule="evenodd" />
                        </svg>
                    </div>
                    תובנות AI
                </h4>
           </div>
          {isLoading ? (
            <LoadingSpinner />
          ) : insights ? (
            <div className="prose prose-sm max-w-none text-slate-700">
              <ReactMarkdown>{insights}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-blue-800/60 text-sm italic pt-2">לחץ על הכפתור כדי לקבל ניתוח ותובנות מבוססות AI.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Column;