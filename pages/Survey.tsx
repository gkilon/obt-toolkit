
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { firebaseService } from '../services/firebaseService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { RelationshipType, SurveyQuestion } from '../types';
import { translations } from '../translations';

export const Survey: React.FC = () => {
  const [lang, setLang] = useState<'he' | 'en'>(() => (localStorage.getItem('obt_lang') as 'he' | 'en') || 'he');
  const { userId } = useParams<{ userId: string }>();

  const [userName, setUserName] = useState<string>('');
  const [userGoal, setUserGoal] = useState<string>('');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [relationship, setRelationship] = useState<RelationshipType>('peer');
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLangChange = (e: any) => setLang(e.detail);
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  const t = translations[lang];

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setError(null);

      try {
        // Wait for firebase to be fully initialized before any calls
        let checkCount = 0;
        while (!firebaseService.isInitialized() && checkCount < 15) {
          await new Promise(r => setTimeout(r, 200));
          checkCount++;
        }
        
        if (!firebaseService.isInitialized()) {
          console.warn("Firebase not fully ready after wait, attempting anyway...");
        }

        const userData = await storageService.getUserDataById(userId);
        if (userData && userData.name) {
          setUserName(userData.name);
          setUserGoal(userData.userGoal || '');
        } else if (!userData) {
          throw new Error("USER_NOT_FOUND");
        }
        
        const surveyQuestions = await storageService.getSurveyQuestions(userId);
        setQuestions(surveyQuestions);
        
        // Initialize multi-answer state
        const initialAnswers: Record<string, string[]> = {};
        surveyQuestions.forEach(q => {
          initialAnswers[q.id] = [''];
        });
        setAnswers(initialAnswers);
      } catch (err: any) {
        console.error("Failed to load survey", err);
        setError(err.message === "USER_NOT_FOUND" ? "משתמש לא נמצא" : "שגיאה בטעינת השאלון - אנא וודא שחוקי האבטחה ב-Firebase מאפשרים קריאה (allow get: if true)");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const missing = questions.filter(q => q.required && (!answers[q.id] || answers[q.id].every(t => !t.trim())));
    if (missing.length > 0) {
      alert(t.fillRequired);
      return;
    }
    setIsSending(true);
    
    const formattedAnswers = Object.entries(answers).flatMap(([qid, texts]) => 
      (texts as string[]).filter(t => t.trim() !== '').map(text => ({ 
        questionId: qid, 
        text: text as string 
      }))
    );

    try {
      await storageService.addResponse(userId, relationship, formattedAnswers);
      setSubmitted(true);
    } catch (err) {
      alert(t.submissionError);
    } finally {
      setIsSending(false);
    }
  };

  const updateAnswer = (qid: string, index: number, text: string) => {
    const newAnswers = { ...answers };
    newAnswers[qid] = [...(newAnswers[qid] || [''])];
    newAnswers[qid][index] = text;
    setAnswers(newAnswers);
  };

  const addAnswerItem = (qid: string) => {
    setAnswers({
      ...answers,
      [qid]: [...(answers[qid] || []), '']
    });
  };

  const removeAnswerItem = (qid: string, index: number) => {
    if (answers[qid].length <= 1) return;
    const newAnswers = { ...answers };
    newAnswers[qid] = answers[qid].filter((_, i) => i !== index);
    setAnswers(newAnswers);
  };

  if (isLoading) return <Layout><div className="text-center py-20 animate-pulse text-white/60">{t.loadingSurvey}</div></Layout>;

  if (error) {
    return (
      <Layout>
        <div className="text-center py-20 space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-2xl font-bold">{error}</h2>
          <p className="text-white/40">{t.backHomeExplanation || "אנא וודא שהקישור תקין או נסה שוב מאוחר יותר."}</p>
          <Link to="/"><Button variant="outline">{t.backHome}</Button></Link>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="text-center py-20 space-y-8">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2 className="text-3xl font-bold">{t.thankYou}</h2>
          <p className="text-white/40 max-w-sm mx-auto">{t.surveySuccess}</p>
          <Link to="/"><Button variant="outline">{t.backHome}</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto w-full space-y-10">
        <div className="text-center space-y-6 px-4">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight break-words">{userName}</h1>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel p-10 space-y-10">
            <div className="space-y-4">
                <label className="block text-sm font-bold text-white/40 uppercase tracking-widest">{t.relationship}</label>
                <select value={relationship} onChange={(e) => setRelationship(e.target.value as RelationshipType)} className="dark-input">
                    <option value="peer">{t.peer}</option>
                    <option value="manager">{t.manager}</option>
                    <option value="subordinate">{t.subordinate}</option>
                    <option value="friend">{t.friend}</option>
                    <option value="other">{t.other}</option>
                </select>
            </div>
            <div className="space-y-12">
              {questions.map((q, idx) => (
                <div key={q.id} className="space-y-4">
                    <div className="space-y-4">
                      {idx === 0 && userGoal && (
                        <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/10 border border-amber-500/40 rounded-xl p-5 md:p-6 relative overflow-hidden shadow-2xl mb-6">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/20 rounded-bl-full filter blur-xl"></div>
                          <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            {t.surveyGoalSubtitle.replace('{name}', userName)}
                          </p>
                          <div className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                            "{userGoal}"
                          </div>
                        </div>
                      )}
                      <label className="block text-xl font-medium leading-relaxed">
                        {lang === 'he' ? q.text_he : q.text_en}
                        {q.required && <span className="text-amber-600 mx-2">*</span>}
                      </label>
                      <p className="text-xs text-white/30">{t.multiAnswerHint}</p>
                    </div>
                    
                    <div className="space-y-3">
                      {(answers[q.id] || ['']).map((text, idx) => (
                        <div key={`${q.id}-${idx}`} className="relative group">
                          <textarea 
                            required={q.required && idx === 0} 
                            value={text} 
                            onChange={(e) => updateAnswer(q.id, idx, e.target.value)} 
                            className={`dark-input min-h-[100px] resize-none ${lang === 'he' ? 'pl-10' : 'pr-10'}`}
                            placeholder={lang === 'he' ? 'הקלד תשובה...' : 'Type answer...'}
                          />
                          {(answers[q.id]?.length > 1) && (
                            <button 
                              type="button"
                              onClick={() => removeAnswerItem(q.id, idx)}
                              className={`absolute top-3 ${lang === 'he' ? 'left-3' : 'right-3'} p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100`}
                              title={t.removeItem}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <button 
                        type="button" 
                        onClick={() => addAnswerItem(q.id)}
                        className="flex items-center gap-2 text-sm font-medium text-amber-500/70 hover:text-amber-400 transition-colors py-1 group"
                      >
                        <div className="w-6 h-6 rounded-full border border-amber-500/30 flex items-center justify-center group-hover:border-amber-400/50">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </div>
                        {t.addItem}
                      </button>
                    </div>
                </div>
              ))}
            </div>
            <Button type="submit" className="w-full py-5 text-xl" isLoading={isSending}>
              {t.submitSurvey}
            </Button>
        </form>
      </div>
    </Layout>
  );
};
