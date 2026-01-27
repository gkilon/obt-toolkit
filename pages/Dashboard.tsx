
import React, { useEffect, useState } from 'react';
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
  
  useEffect(() => {
    const handleLangChange = (e: any) => setLang(e.detail);
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  const t = translations[lang];

  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [goal, setGoal] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    if (!currentUser) { navigate('/'); return; }
    setUser(currentUser);
    setGoal(currentUser.userGoal || '');
    if (!currentUser.userGoal) setIsEditingGoal(true);
    
    Promise.all([
      storageService.getResponsesForUser(currentUser.id),
      storageService.getSurveyQuestions()
    ]).then(([resps, surqs]) => {
      setResponses(resps);
      setQuestions(surqs);
    });
  }, [navigate]);

  useEffect(() => {
    if (loadingAnalysis) {
      const messages = lang === 'he' ? ["מקשיב למשובים...", "מזקק כיווני מחשבה...", "מכין את הדוח..."] : ["Processing...", "Synthesizing...", "Finalizing..."];
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
  };

  const handleAnalyze = async () => {
    if (responses.length === 0) return;
    setLoadingAnalysis(true);
    try {
      const result = await analyzeFeedback(responses, user?.userGoal, questions);
      setAnalysis(result);
    } catch (error) {
      alert("הניתוח נכשל.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const copyLink = () => {
    const baseUrl = window.location.href.split('#')[0];
    const url = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/#/survey/${user?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8 border-b border-white/5">
          <div className="space-y-1">
            <span className="text-amber-600 font-bold tracking-widest text-[10px] uppercase block">מרחב הצמיחה האישי</span>
            <h1 className="text-4xl font-bold text-white tracking-tight">{t.dashboardTitle}, {user.name}</h1>
            <p className="text-white/40 text-sm">משובים שנאספו: <span className="text-amber-500 font-bold">{responses.length}</span></p>
          </div>
          <div className="flex gap-3">
            <Button onClick={copyLink} variant="outline" className="rounded-lg py-2.5">
              {copied ? t.linkCopied : t.copyLink}
            </Button>
            <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="ghost" className="text-white/30">
              {t.logout}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel p-6 border-l-4 border-l-amber-600">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-tighter">המטרה שלי</h3>
                    <button onClick={() => setIsEditingGoal(true)} className="text-amber-600 text-[10px] uppercase hover:underline">ערוך</button>
                </div>
                {isEditingGoal ? (
                    <div className="space-y-4">
                        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} className="dark-input w-full text-sm" rows={4} />
                        <div className="flex gap-2">
                            <Button onClick={handleSaveGoal} className="px-4 py-2 text-xs">שמור</Button>
                            <button onClick={() => setIsEditingGoal(false)} className="text-white/40 text-xs">ביטול</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-lg font-light leading-relaxed text-white/90">"{goal || "הוסף מטרה..."}"</p>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-2">משובים גולמיים</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {responses.map(r => (
                      <div key={r.id} className="glass-panel p-4 border-white/5 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-amber-600 font-bold uppercase">{translations[lang][r.relationship] || r.relationship}</span>
                            <span className="text-[9px] text-white/10">#{r.id.slice(-4)}</span>
                          </div>
                          {r.answers.map(a => {
                            const q = questions.find(qu => qu.id === a.questionId);
                            return (
                              <div key={a.questionId} className="space-y-1">
                                <p className="text-[10px] text-white/20 uppercase font-bold">{q?.text_he || 'שאלה'}</p>
                                <p className="text-white/70 text-sm font-light leading-snug">"{a.text}"</p>
                              </div>
                            );
                          })}
                      </div>
                  ))}
                </div>
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
                            <h2 className="text-3xl font-bold text-white">זמן לגלות תובנות</h2>
                            <Button onClick={handleAnalyze} className="w-full py-5 text-xl" disabled={responses.length < 1}>
                                זקק לי את המשוב
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Analysis Content Rendering remains similar to previous version, using analysis object fields */}
                    <div className="glass-panel p-10 bg-gradient-to-br from-onyx-800 to-onyx-950 border-amber-600/30">
                        <span className="px-3 py-1 bg-amber-600/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 inline-block">הצעה לכיוון מרכזי</span>
                        <h2 className="text-amber-500 text-sm font-bold uppercase tracking-[0.2em] mb-4">Suggested OBT</h2>
                        <p className="text-4xl font-bold text-white leading-tight mb-8">{lang === 'he' ? analysis.theOneBigThing_he : analysis.theOneBigThing_en}</p>
                        <div className="p-6 bg-white/5 rounded-2xl italic text-white/50 text-lg">"{lang === 'he' ? analysis.executiveSummary_he : analysis.executiveSummary_en}"</div>
                    </div>
                    {/* ... other sections for goalPrecision, actionPlan, etc ... */}
                    <div className="flex justify-center pt-8">
                      <Button onClick={() => exportToWord(user, analysis, responses)} variant="outline">ייצוא דוח מלא</Button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
