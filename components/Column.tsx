import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Column3Data, ColumnId } from '../types';

interface ColumnProps {
  id: ColumnId;
  title: string;
  description: string;
  value: string | string[] | Column3Data;
  onValueChange: (value: any) => void;
  isFocused: boolean;
}

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
            className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 resize-none text-slate-900 text-base min-h-[120px] bg-white ${className}`}
            placeholder={placeholder}
        />
    );
}

const Column: React.FC<ColumnProps> = ({ id, title, description, value, onValueChange, isFocused }) => {
  
  const renderContent = () => {
    if (id === ColumnId.HiddenCommitments) {
      const col3Value = value as Column3Data;
      
      return (
        <>
            <div className="mb-6">
                <h4 className="font-semibold text-slate-800 mb-2">חלק א': תיבת הדאגות</h4>
                <p className="text-slate-600 mb-3 text-sm">דמיין/י שאת/ה עושה את ההיפך מההתנהגויות שבטור 2. רשום/י את כל הדאגות, הפחדים והתחושות הלא נעימות שעולות.</p>
                <ResizableTextarea
                    value={col3Value.worries}
                    onChange={(e) => onValueChange({ ...col3Value, worries: e.target.value })}
                    placeholder="לדוגמה: 'אני חושש/ת שיכעסו עליי', 'אני מפחד/ת להיראות לא מקצועי/ת'..."
                />
            </div>
            <div>
                 <h4 className="font-semibold text-slate-800 mb-2">חלק ב': התחייבויות נסתרות</h4>
                <p className="text-slate-600 mb-3 text-sm">הדאגות שלך מצביעות על מחויבויות עמוקות. למה את/ה מחויב/ת כדי למנע מהדאגות להתממש? נסח זאת כ"אני מחויב/ת ל...".</p>
                <ResizableTextarea
                    value={col3Value.commitments}
                    onChange={(e) => onValueChange({ ...col3Value, commitments: e.target.value })}
                    placeholder="לדוגמה: 'אני מחויב/ת לא לאכזב אנשים', 'אני מחויב/ת להיות תמיד בשליטה'..."
                />
            </div>
        </>
      );
    }

    if (id === ColumnId.Behaviors) {
        const behaviors = value as string[];
        const handleBehaviorChange = (index: number, text: string) => {
            const newBehaviors = [...behaviors];
            newBehaviors[index] = text;
            onValueChange(newBehaviors);
        };
        
        const handleAddBehavior = () => {
            onValueChange([...behaviors, '']);
        };
        
        const handleRemoveBehavior = (index: number) => {
            onValueChange(behaviors.filter((_, i) => i !== index));
        };
        
        // At the end of the onValueChange, filter out empty behaviors
        const handleBlur = () => {
            onValueChange(behaviors.filter(b => b.trim() !== ''));
        }

        return (
            <div>
                {behaviors.map((behavior, index) => (
                    <div key={index} className="flex items-start gap-2 mb-2">
                        <ResizableTextarea
                            value={behavior}
                            onChange={e => handleBehaviorChange(index, e.target.value)}
                            onBlur={handleBlur}
                            placeholder={`התנהגות #${index + 1}`}
                            className="bg-white min-h-[50px] !p-2"
                            autoFocus={index === behaviors.length - 1 && behavior === ''}
                        />
                        <button 
                            onClick={() => handleRemoveBehavior(index)} 
                            className="text-slate-400 hover:text-red-500 p-1 mt-1.5 rounded-full hover:bg-red-100 transition-colors flex-shrink-0"
                            aria-label={`הסר התנהגות ${index + 1}`}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                        </button>
                    </div>
                ))}
                <button onClick={handleAddBehavior} className="text-sm font-semibold text-blue-600 hover:bg-blue-100 rounded-md p-2 w-full text-center mt-2 transition-colors">
                    + הוסף התנהגות
                </button>
            </div>
        );
    }
    
    // Render logic for regular columns (Goal, BigAssumptions)
    return (
      <ResizableTextarea
        value={value as string}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="התחל/י לכתוב כאן..."
      />
    );
  };

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-lg flex flex-col h-full border-2 transition-all duration-300 ${isFocused ? 'border-blue-500 shadow-blue-200' : 'border-slate-200/80'}`}>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-4 text-sm">{description}</p>
      
      <div className="flex-grow">
        {renderContent()}
      </div>
    </div>
  );
};

export default Column;