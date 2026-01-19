
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { analyzeFeedback } from '../services/geminiService';
import { exportToWord } from '../services/exportService';
import { User, FeedbackResponse, AnalysisResult } from '../types';
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
    storageService.getResponsesForUser(currentUser.id).then(setResponses);
  }, [navigate]);

  useEffect(() => {
    if (loadingAnalysis) {
      const messages = lang === 'he' ? [
        "קורא את המשובים בעיון...",
        "מזהה דפוסים נסתרים...",
        "מגבש אסטרטגיית פריצת דרך...",
        "מזקק את ה-One Big Thing...",
        "מכין את הדוח הסופי..."
      ] : [
        "Analyzing feedbacks...",
        "Identifying patterns...",
        "Crafting breakthrough strategy...",
        "Synthesizing the One Big Thing...",
        "Finalizing your report..."
      ];
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
  };

  const handleAnalyze = async () => {
    if (responses.length === 0) return;
    setLoadingAnalysis(true);
    try {
      const result = await analyzeFeedback(responses, user?.userGoal);
      setAnalysis(result);
    } catch (error) {
      alert(lang === 'he' ? "הניתוח נתקל בשגיאה. אנא נסה שוב." : "Analysis failed. Please try again.");
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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8 border-b border-onyx-800">
          <div>
            <span className="text-bronze-500 font-bold tracking-widest text-[10px] uppercase mb-2 block">מרכז בקרה אישי</span>
            <h1 className="text-4xl font-heading text-white">{t.dashboardTitle}, {user.name}</h1>
            <p className="text-onyx-400 mt-2">{t.feedbacksCollected}: <span className="text-bronze-500 font-bold">{responses.length}</span></p>
          </div>
          <div className="flex gap-4">
            <Button onClick={copyLink} variant="outline" className="rounded-full border-bronze-500/30 text-bronze-500">
              {copied ? t.linkCopied : t.copyLink}
            </Button>
            <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="ghost" className="text-onyx-500">
              {t.logout}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Context & Responses */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel p-6 border-r-4 border-r-bronze-500/50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-onyx-400 uppercase tracking-tighter">🎯 {t.myGoal}</h3>
                    <button onClick={() => setIsEditingGoal(true)} className="text-bronze-500 text-[10px] uppercase hover:underline">{t.edit}</button>
                </div>
                {isEditingGoal ? (
                    <div className="space-y-4">
                        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} className="dark-input w-full text-sm p-4 rounded-lg" rows={4} placeholder={t.goalHint} />
                        <div className="flex gap-2">
                            <Button onClick={handleSaveGoal} className="px-4 py-1.5 text-xs bg-bronze-600">שמור מטרה</Button>
                            <button onClick={() => setIsEditingGoal(false)} className="text-onyx-500 text-xs">ביטול</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-lg font-light leading-relaxed text-onyx-200">"{goal || 'תאר את השינוי שאתה רוצה לחולל...'}"</p>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-onyx-500 uppercase tracking-widest px-2">משובים שהתקבלו</h3>
                {responses.length === 0 && <p className="text-onyx-600 text-sm italic px-2">ממתין למשובים ראשונים...</p>}
                {responses.map(r => (
                    <div key={r.id} className="glass-panel p-4 bg-onyx-800/20 hover:bg-onyx-800/40 transition-colors border-bronze-500/10">
                        <p className="text-[9px] text-bronze-500 font-bold mb-2 uppercase tracking-tighter">{translations[lang][r.relationship] || r.relationship}</p>
                        <p className="text-onyx-200 text-sm mb-3">"{r.q1_change}"</p>
                        <div className="h-px bg-onyx-700/30 w-full mb-3"></div>
                        <p className="text-onyx-500 text-xs italic">"{r.q2_actions}"</p>
                    </div>
                ))}
            </div>
          </div>

          {/* Right Column: AI Analysis */}
          <div className="lg:col-span-8">
            {!analysis ? (
                <div className="glass-panel min-h-[450px] flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-onyx-700">
                    {loadingAnalysis ? (
                        <div className="space-y-8">
                            <div className="relative w-24 h-24 mx-auto">
                              <div className="absolute inset-0 border-4 border-bronze-500/10 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-bronze-500 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-2xl font-heading text-bronze-400 animate-pulse">{loadingMessage}</p>
                              <p className="text-onyx-600 text-xs">הניתוח לוקח בדרך כלל 15-20 שניות</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="w-20 h-20 bg-bronze-500/10 rounded-full flex items-center justify-center mx-auto text-bronze-500 shadow-xl shadow-bronze-500/5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="M2 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="M12 22v-4"/><path d="m19.07 19.07-2.83-2.83"/><path d="M22 12h-4"/><path d="m19.07 4.93-2.83 2.83"/></svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-heading text-white mb-2">מוכן לניתוח ה-AI?</h2>
                                <p className="text-onyx-500 max-w-sm mx-auto text-sm leading-relaxed">
                                    המערכת תסרוק את כל המשובים ותבנה עבורך מפת דרכים אסטרטגית המבוססת על פסיכולוגיה ארגונית.
                                </p>
                            </div>
                            <Button onClick={handleAnalyze} className="px-10 py-4 rounded-full bg-bronze-600 hover:bg-bronze-500 shadow-2xl shadow-bronze-500/20" disabled={responses.length < 1}>
                                {t.generateReport}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    {/* Main Synthesis Card */}
                    <div className="glass-panel p-8 bg-gradient-to-br from-onyx-800 to-onyx-900 border-bronze-500/20">
                        <div className="flex flex-col md:flex-row items-center gap-8 mb-8 border-b border-onyx-700/50 pb-8">
                            <div className="relative w-32 h-32 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-onyx-800" />
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * analysis.goalPrecision.score) / 100} className="text-bronze-500" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-heading font-bold text-white">{analysis.goalPrecision.score}%</span>
                                    <span className="text-[10px] uppercase text-onyx-500 tracking-tighter">דיוק מטרה</span>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-heading text-white mb-3">סיכום מנהלים אסטרטגי</h2>
                                <p className="text-onyx-300 leading-relaxed text-lg font-light italic">"{analysis.executiveSummary}"</p>
                            </div>
                        </div>

                        <div className="bg-bronze-500/10 p-6 rounded-xl border border-bronze-500/20 mb-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 text-bronze-500/10 group-hover:text-bronze-500/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="M2 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="M12 22v-4"/><path d="m19.07 19.07-2.83-2.83"/><path d="M22 12h-4"/><path d="m19.07 4.93-2.83 2.83"/></svg>
                            </div>
                            <h3 className="text-lg font-heading text-bronze-400 mb-4 flex items-center gap-3">
                                <span className="bg-bronze-500 text-onyx-950 p-1.5 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg></span>
                                The One Big Thing - פריצת הדרך
                            </h3>
                            <p className="text-xl font-light text-white leading-relaxed relative z-10">{analysis.theOneBigThing}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-onyx-500 uppercase tracking-widest border-r-2 border-onyx-700 pr-3">ביקורת והכוונה</h4>
                                <p className="text-sm text-onyx-400">{analysis.goalPrecision.critique}</p>
                             </div>
                             <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-bronze-500 uppercase tracking-widest border-r-2 border-bronze-500/30 pr-3">מטרה מזוקקת לעתיד</h4>
                                <p className="text-md font-medium text-white p-4 bg-onyx-950/40 rounded-lg border border-onyx-700/50">"{analysis.goalPrecision.refinedGoal}"</p>
                             </div>
                        </div>
                    </div>

                    {/* Insights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-panel p-6 border-onyx-700/30">
                            <h4 className="text-[10px] font-bold text-onyx-500 uppercase tracking-widest mb-4">הזדמנויות מרכזיות</h4>
                            <ul className="space-y-3">
                                {analysis.question1Analysis.opportunities.map((opt, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-onyx-200">
                                        <span className="text-bronze-500 font-bold">•</span> {opt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="glass-panel p-6 border-onyx-700/30">
                            <h4 className="text-[10px] font-bold text-onyx-500 uppercase tracking-widest mb-4">דפוסים מעכבים (The Shadow)</h4>
                            <p className="text-sm text-onyx-300 leading-relaxed italic mb-4">"{analysis.question2Analysis.psychologicalPatterns}"</p>
                            <div className="flex flex-wrap gap-2">
                                {analysis.question2Analysis.blockers.map((b, i) => (
                                    <span key={i} className="px-2 py-1 bg-onyx-700/40 text-onyx-300 text-[10px] rounded uppercase border border-onyx-600/50">{b}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Plan */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-bold text-onyx-600 uppercase tracking-widest px-2">תוכנית פעולה אופרטיבית</h4>
                        <div className="grid grid-cols-1 gap-4">
                            {analysis.actionPlan.map((step, i) => (
                                <div key={i} className="glass-panel flex gap-6 items-start hover:border-bronze-500/40 transition-all group p-5">
                                    <div className="w-12 h-12 rounded-xl bg-onyx-700/50 flex items-center justify-center text-white font-black group-hover:bg-bronze-600 group-hover:text-onyx-950 transition-all duration-500 shadow-inner">0{i+1}</div>
                                    <div className="flex-1">
                                        <h5 className="font-heading text-lg text-white mb-1 group-hover:text-bronze-400 transition-colors">{step.title}</h5>
                                        <p className="text-sm text-onyx-400 leading-relaxed">{step.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 pt-12 border-t border-onyx-800/50">
                        <Button onClick={() => exportToWord(user, analysis, responses)} variant="outline" className="px-12 py-4 rounded-full border-onyx-700 hover:border-bronze-500/40 text-onyx-300">
                          {t.downloadWord}
                        </Button>
                        <p className="text-[10px] text-onyx-600 uppercase tracking-widest">דוח זה מוגן וזמין להורדה בפורמט וורד</p>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
