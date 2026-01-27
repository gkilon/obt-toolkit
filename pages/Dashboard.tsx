
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { analyzeFeedback } from '../services/geminiService';
import { exportToWord } from '../services/exportService';
import { User, FeedbackResponse, AnalysisResult, SurveyQuestion } from '../types';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { translations } from '../translations';

export const Dashboard: React.FC = () => {
  const [lang, setLang] = useState<'he' | 'en'>(() => (localStorage.getItem('obt_lang') as 'he' | 'en') || 'he');
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [goal, setGoal] = useState('');
  
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isEditingQuestions, setIsEditingQuestions] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'settings'>('overview');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const t = translations[lang];

  useEffect(() => {
    const handleLangChange = (e: any) => setLang(e.detail);
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    if (!currentUser) { 
      navigate('/'); 
      return; 
    }
    setUser(currentUser);
    setGoal(currentUser.userGoal || '');
    
    // שליפת נתונים
    Promise.all([
      storageService.getResponsesForUser(currentUser.id),
      storageService.getSurveyQuestions(currentUser.id)
    ]).then(([resps, surqs]) => {
      setResponses(resps);
      setQuestions(surqs);
    }).catch(err => {
      console.error("Failed to load dashboard data", err);
    });
  }, [navigate]);

  useEffect(() => {
    if (loadingAnalysis) {
      const messages = lang === 'he' ? ["מקשיב למשובים...", "מזהה דפוסים...", "מזקק תובנות...", "מכין את הדוח..."] : ["Listening to feedback...", "Identifying patterns...", "Synthesizing insights...", "Finalizing report..."];
      let i = 0;
      setLoadingMessage(messages[0]);
      const interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loadingAnalysis, lang]);

  const handleSaveGoal = async () => {
      if (!user || !goal.trim()) return;
      await storageService.updateUserGoal(user.id, goal);
      setUser({ ...user, userGoal: goal });
      setIsEditingGoal(false);
      showFeedback('המטרה עודכנה!');
  };

  const handleSaveQuestions = async () => {
    if (!user) return;
    try {
      await storageService.updateUserQuestions(user.id, questions);
      setIsEditingQuestions(false);
      showFeedback('השאלון עודכן בהצלחה!');
    } catch (e) {
      showFeedback('שגיאה בשמירת השאלון');
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const addQuestion = () => {
    const newQ: SurveyQuestion = {
      id: 'q_' + Date.now(),
      text_he: '',
      text_en: '',
      type: 'general',
      required: true
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    if (window.confirm('למחוק את השאלה?')) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: keyof SurveyQuestion, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleAnalyze = async () => {
    if (responses.length === 0) return;
    setLoadingAnalysis(true);
    setErrorMsg('');
    try {
      const result = await analyzeFeedback(responses, user?.userGoal, questions);
      setAnalysis(result);
    } catch (error: any) {
      console.error("Analysis Error:", error);
      setErrorMsg(error.message || "משהו לא עבד בניתוח המשוב. נסה שוב.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const copyLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}#/survey/${user?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user) return <Layout><div className="text-center py-20">טוען...</div></Layout>;

  return (
    <Layout>
      <div className="pb-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/5">
          <div className="space-y-1">
            <span className="text-amber-600 font-bold tracking-widest text-[10px] uppercase block">לוח בקרה אישי</span>
            <h1 className="text-4xl font-bold text-white tracking-tight">{t.dashboardTitle}, {user.name}</h1>
            <p className="text-white/40 text-sm">משובים שהתקבלו: <span className="text-amber-500 font-bold">{responses.length}</span></p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={copyLink} variant="outline" className="rounded-lg py-2.5">
              {copied ? t.linkCopied : t.copyLink}
            </Button>
            <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="ghost" className="text-white/30">
              {t.logout}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-8 mb-10 border-b border-white/5">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-white/30 hover:text-white/60'}`}
          >
            סקירה וניתוח
          </button>
          <button 
            onClick={() => setActiveTab('responses')} 
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'responses' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-white/30 hover:text-white/60'}`}
          >
            משובים ({responses.length})
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-white/30 hover:text-white/60'}`}
          >
            עריכת שאלון
          </button>
        </div>

        {/* Dynamic Content based on Active Tab */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {activeTab === 'overview' && (
            <>
              <div className="lg:col-span-4 space-y-8">
                <div className="glass-panel p-6 border-l-4 border-l-amber-600">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-tighter">המטרה שלי</h3>
                        <button onClick={() => setIsEditingGoal(true)} className="text-amber-600 text-[10px] uppercase hover:underline">ערוך</button>
                    </div>
                    {isEditingGoal ? (
                        <div className="space-y-4">
                            <textarea value={goal} onChange={(e) => setGoal(e.target.value)} className="dark-input w-full text-sm" rows={4} autoFocus />
                            <div className="flex gap-2">
                                <Button onClick={handleSaveGoal} className="px-4 py-2 text-xs">שמור</Button>
                                <button onClick={() => setIsEditingGoal(false)} className="text-white/40 text-xs">ביטול</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-lg font-light leading-relaxed text-white/90">"{goal || "טרם הגדרת מטרה..."}"</p>
                    )}
                </div>
              </div>

              <div className="lg:col-span-8">
                {!analysis ? (
                    <div className="glass-panel min-h-[500px] flex flex-col items-center justify-center text-center p-12">
                        {loadingAnalysis ? (
                            <div className="space-y-8">
                                <div className="relative w-24 h-24 mx-auto">
                                  <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
                                </div>
                                <p className="text-2xl font-light text-white animate-pulse">{loadingMessage}</p>
                            </div>
                        ) : (
                            <div className="space-y-8 max-w-md">
                                <div className="w-20 h-20 bg-amber-600/10 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-2xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="M2 12h4"/><path d="m4.93 19.07 2.83-2.647"/><path d="M12 22v-4"/><path d="m19.07 19.07-2.83-2.83"/><path d="M22 12h-4"/><path d="m19.07 4.93-2.83 2.83"/></svg>
                                </div>
                                <h2 className="text-3xl font-bold text-white">מוכן לנתח את המשוב?</h2>
                                <p className="text-white/40">ה-AI יזקק עבורך את "הדבר האחד" שיעשה את ההבדל.</p>
                                
                                {errorMsg && (
                                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                                    {errorMsg}
                                  </div>
                                )}

                                <Button onClick={handleAnalyze} className="w-full py-5 text-xl" disabled={responses.length < 1}>
                                    זקק לי את המשוב
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="glass-panel p-10 bg-gradient-to-br from-onyx-800 to-onyx-950 border-amber-600/30">
                            <span className="px-3 py-1 bg-amber-600/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 inline-block">הצעה לכיוון מרכזי</span>
                            <h2 className="text-amber-500 text-sm font-bold uppercase tracking-[0.2em] mb-4">The One Big Thing</h2>
                            <p className="text-4xl font-bold text-white leading-tight mb-8">{lang === 'he' ? analysis.theOneBigThing_he : analysis.theOneBigThing_en}</p>
                            <div className="p-6 bg-white/5 rounded-2xl italic text-white/50 text-lg">"{lang === 'he' ? analysis.executiveSummary_he : analysis.executiveSummary_en}"</div>
                        </div>
                        
                        <div className="flex justify-center pt-8">
                          <Button onClick={() => exportToWord(user, analysis, responses)} variant="outline">ייצוא דוח מלא (Word)</Button>
                          <Button onClick={() => setAnalysis(null)} variant="ghost" className="text-white/20 ml-4">ניתוח מחדש</Button>
                        </div>
                    </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'responses' && (
            <div className="lg:col-span-12">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {responses.length > 0 ? responses.map(r => (
                      <div key={r.id} className="glass-panel p-6 border-white/5 space-y-6 hover:bg-white/[0.02] transition-colors">
                          <div className="flex justify-between items-center pb-4 border-b border-white/5">
                            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">{translations[lang][r.relationship] || r.relationship}</span>
                            <span className="text-[9px] text-white/10">{new Date(r.timestamp).toLocaleDateString('he-IL')}</span>
                          </div>
                          <div className="space-y-6">
                            {r.answers.map(a => {
                              const q = questions.find(qu => qu.id === a.questionId);
                              return (
                                <div key={a.questionId} className="space-y-2">
                                  <p className="text-[10px] text-white/20 uppercase font-bold">{q?.text_he || 'שאלה'}</p>
                                  <p className="text-white/80 text-sm font-light leading-relaxed">"{a.text}"</p>
                                </div>
                              );
                            })}
                          </div>
                      </div>
                  )) : (
                    <div className="col-span-full py-20 text-center glass-panel text-white/20 uppercase tracking-widest">טרם התקבלו משובים</div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="lg:col-span-12 space-y-8 animate-in fade-in duration-300">
               <div className="glass-panel p-8 space-y-8">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-amber-600">עריכת שאלות השאלון</h2>
                      <p className="text-xs text-white/30">כאן תוכל להגדיר מה תרצה לשאול את האנשים שיתנו לך משוב</p>
                    </div>
                    <span className="text-xs text-white/20 uppercase tracking-widest">שאלות: {questions.length}</span>
                  </div>

                  <div className="space-y-6">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="p-6 bg-white/5 rounded-xl border border-white/10 space-y-4 hover:border-white/20 transition-all">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                            <span className="text-xs font-bold uppercase text-white/40">הגדרות שאלה</span>
                          </div>
                          <button 
                            onClick={() => removeQuestion(q.id)} 
                            className="text-white/20 hover:text-red-400 transition-colors"
                          >
                            מחק
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] text-white/30 uppercase">טקסט בעברית</label>
                            <input value={q.text_he} onChange={e => updateQuestion(q.id, 'text_he', e.target.value)} className="dark-input" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-white/30 uppercase">טקסט באנגלית</label>
                            <input value={q.text_en} onChange={e => updateQuestion(q.id, 'text_en', e.target.value)} className="dark-input" dir="ltr" />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-6 pt-2">
                          <div className="space-y-1">
                            <label className="text-[10px] text-white/30 uppercase block">סוג מידע</label>
                            <select value={q.type} onChange={e => updateQuestion(q.id, 'type', e.target.value as any)} className="dark-input py-2 w-48 text-sm">
                              <option value="general">כללי</option>
                              <option value="goal">מטרה (Goal)</option>
                              <option value="blocker">מעכב (Blocker)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={addQuestion} 
                      className="w-full py-4 border-2 border-dashed border-white/5 rounded-xl text-white/20 hover:text-amber-600 hover:border-amber-600/30 hover:bg-amber-600/5 transition-all flex items-center justify-center gap-2"
                    >
                      + הוסף שאלה
                    </button>
                  </div>
                  
                  <Button onClick={handleSaveQuestions} className="w-full py-5 text-xl">שמור שינויים בשאלון</Button>
               </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-8 py-4 rounded-full shadow-2xl animate-bounce z-[100] font-bold">
           {feedbackMsg}
        </div>
      )}
    </Layout>
  );
};
