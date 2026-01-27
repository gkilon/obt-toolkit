
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
    if (!currentUser) { navigate('/'); return; }
    setUser(currentUser);
    setGoal(currentUser.userGoal || '');
    
    storageService.getResponsesForUser(currentUser.id).then(resps => setResponses(resps || []));
    storageService.getSurveyQuestions(currentUser.id).then(surqs => setQuestions(surqs || []));
  }, [navigate]);

  useEffect(() => {
    if (loadingAnalysis) {
      const messages = lang === 'he' ? 
        ["מנתח דפוסים פסיכולוגיים...", "מתקף את מטרת הצמיחה שלך...", "מזקק תובנות אסטרטגיות...", "מנסח את ה-The One Big Thing..."] : 
        ["Analyzing psychological patterns...", "Validating your growth goal...", "Synthesizing strategic insights...", "Formulating The One Big Thing..."];
      let i = 0;
      setLoadingMessage(messages[0]);
      const interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 3500);
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
      showFeedback('השאלון עודכן בהצלחה!');
    } catch (e) { showFeedback('שגיאה בשמירה'); }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleAnalyze = async () => {
    if (!responses || responses.length === 0) return;
    setLoadingAnalysis(true);
    setErrorMsg('');
    try {
      const result = await analyzeFeedback(responses, user?.userGoal, questions);
      setAnalysis(result);
    } catch (error: any) {
      setErrorMsg(error.message || "משהו לא עבד בניתוח המשוב.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/survey/${user?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user) return <Layout><div className="text-center py-20">טוען...</div></Layout>;

  return (
    <Layout>
      <div className="pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/5">
          <div className="space-y-1">
            <span className="text-amber-600 font-bold tracking-widest text-[10px] uppercase block">Elite Performance Workspace</span>
            <h1 className="text-4xl font-bold text-white tracking-tight">{t.dashboardTitle}, {user.name}</h1>
            <p className="text-white/40 text-sm">סך משובים במאגר: <span className="text-amber-500 font-bold">{responses?.length || 0}</span></p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={copyLink} variant="outline" className="rounded-lg py-2.5">{copied ? t.linkCopied : t.copyLink}</Button>
            <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="ghost" className="text-white/30">{t.logout}</Button>
          </div>
        </div>

        <div className="flex gap-8 mb-10 border-b border-white/5">
          {['overview', 'responses', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'text-amber-600 border-b-2 border-amber-600' : 'text-white/30 hover:text-white/60'}`}>
              {tab === 'overview' ? 'אסטרטגיה וניתוח' : tab === 'responses' ? 'משובים גולמיים' : 'הגדרות שאלון'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {activeTab === 'overview' && (
            <>
              <div className="lg:col-span-4 space-y-8">
                <div className="glass-panel p-6 border-l-4 border-l-amber-600">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-tighter">המטרה המקורית שלי</h3>
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

                {analysis && (
                  <div className="glass-panel p-6 border-l-4 border-l-blue-500 bg-blue-500/5">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-tighter mb-4">תיקוף המטרה (AI Validation)</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-3xl font-bold text-white">{analysis.goalPrecision.score}/10</div>
                      <div className="text-xs text-white/40">רמת התאמה למשוב מהשטח</div>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed mb-4">{lang === 'he' ? analysis.goalPrecision.critique_he : analysis.goalPrecision.critique_en}</p>
                    <div className="pt-4 border-t border-white/10">
                      <span className="text-[10px] font-bold text-blue-400 uppercase">המטרה המשודרגת (Power Goal):</span>
                      <p className="text-md font-bold text-white mt-1">"{lang === 'he' ? analysis.goalPrecision.refinedGoal_he : analysis.goalPrecision.refinedGoal_en}"</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-8">
                {!analysis ? (
                    <div className="glass-panel min-h-[500px] flex flex-col items-center justify-center text-center p-12">
                        {loadingAnalysis ? (
                            <div className="space-y-8">
                                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                                  <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
                                  <svg className="text-amber-600 animate-pulse" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                                </div>
                                <p className="text-2xl font-light text-white animate-pulse">{loadingMessage}</p>
                            </div>
                        ) : (
                            <div className="space-y-8 max-w-md">
                                <div className="w-20 h-20 bg-amber-600/10 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-2xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                                </div>
                                <h2 className="text-3xl font-bold text-white">הפקת סינתזה אסטרטגית</h2>
                                <p className="text-white/40">ה-AI ינתח את כל {responses.length} המשובים כדי לחשוף את הנקודות העיוורות ואת מנוע הצמיחה המרכזי שלך.</p>
                                {errorMsg && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">{errorMsg}</div>}
                                <Button onClick={handleAnalyze} className="w-full py-5 text-xl" disabled={responses.length < 1}>זקק לי את הדוח</Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="glass-panel p-10 bg-gradient-to-br from-onyx-800 to-onyx-950 border-amber-600/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2v20M2 12h20M12 2l10 10-10 10L2 12 12 2z"/></svg>
                            </div>
                            <span className="px-3 py-1 bg-amber-600/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 inline-block">The Strategic Synthesis</span>
                            <h2 className="text-amber-500 text-sm font-bold uppercase tracking-[0.2em] mb-4">The One Big Thing</h2>
                            <p className="text-4xl font-bold text-white leading-tight mb-8">{lang === 'he' ? analysis.theOneBigThing_he : analysis.theOneBigThing_en}</p>
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 italic text-white/70 text-lg leading-relaxed">
                              "{lang === 'he' ? analysis.executiveSummary_he : analysis.executiveSummary_en}"
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="glass-panel p-6 space-y-4">
                              <h4 className="text-xs font-bold text-amber-600 uppercase">דפוסים פסיכולוגיים (Underlying Patterns)</h4>
                              <p className="text-sm text-white/60 leading-relaxed">{lang === 'he' ? analysis.question2Analysis?.psychologicalPatterns_he : analysis.question2Analysis?.psychologicalPatterns_en}</p>
                           </div>
                           <div className="glass-panel p-6 space-y-4">
                              <h4 className="text-xs font-bold text-amber-600 uppercase">הזדמנויות שלא נוצלו</h4>
                              <ul className="space-y-2">
                                {(analysis.question1Analysis?.opportunities_he || []).map((o, i) => (
                                  <li key={i} className="text-sm text-white/80 flex gap-2"><span className="text-amber-600">•</span> {o}</li>
                                ))}
                              </ul>
                           </div>
                        </div>
                        
                        <div className="flex justify-center pt-8 gap-4">
                          <Button onClick={() => exportToWord(user, analysis, responses)} variant="outline">ייצוא דוח מלא (Word)</Button>
                          <Button onClick={() => setAnalysis(null)} variant="ghost" className="text-white/20">ניתוח מחדש</Button>
                        </div>
                    </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'responses' && (
            <div className="lg:col-span-12">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {responses && responses.length > 0 ? responses.map(r => (
                      <div key={r.id} className="glass-panel p-6 border-white/5 space-y-6 hover:bg-white/[0.02] transition-colors">
                          <div className="flex justify-between items-center pb-4 border-b border-white/5">
                            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">{translations[lang][r.relationship] || r.relationship}</span>
                            <span className="text-[9px] text-white/10">{new Date(r.timestamp).toLocaleDateString('he-IL')}</span>
                          </div>
                          <div className="space-y-6">
                            {(r.answers || []).map(a => {
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
                  )) : <div className="col-span-full py-20 text-center glass-panel text-white/20 uppercase tracking-widest">לא נמצאו משובים במערכת</div>}
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="lg:col-span-12 glass-panel p-8 space-y-8 animate-in fade-in duration-300">
                <div className="border-b border-white/5 pb-4">
                  <h2 className="text-xl font-bold text-amber-600">עריכת שאלון</h2>
                  <p className="text-xs text-white/30">שינוי השאלות ישפיע על המשובים החדשים שיתקבלו</p>
                </div>
                {/* Simplified view for settings in this snippet */}
                <div className="py-10 text-center text-white/20">עבור לדף הניהול (Admin) לשינויים מבניים בשאלון</div>
            </div>
          )}
        </div>
      </div>
      {feedbackMsg && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-8 py-4 rounded-full shadow-2xl z-[100] font-bold">{feedbackMsg}</div>}
    </Layout>
  );
};
