
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
        "מקשיב למשובים...",
        "מזקק כיווני מחשבה...",
        "בונה לך כמה אפשרויות...",
        "מכין את הדוח..."
      ] : [
        "Processing feedback...",
        "Identifying themes...",
        "Building multiple perspectives...",
        "Finalizing..."
      ];
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
      const result = await analyzeFeedback(responses, user?.userGoal);
      setAnalysis(result);
    } catch (error) {
      alert(lang === 'he' ? "משהו השתבש. נסה שוב." : "Analysis failed.");
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
            <span className="text-amber-600 font-bold tracking-widest text-[10px] uppercase block">
                {lang === 'he' ? 'מרחב הצמיחה האישי' : 'PERSONAL GROWTH SPACE'}
            </span>
            <h1 className="text-4xl font-bold text-white tracking-tight">{t.dashboardTitle}, {user.name}</h1>
            <p className="text-white/40 text-sm">{t.feedbacksCollected}: <span className="text-amber-500 font-bold">{responses.length}</span></p>
          </div>
          <div className="flex gap-3">
            <Button onClick={copyLink} variant="outline" className="rounded-lg py-2.5">
              {copied ? t.linkCopied : t.copyLink}
            </Button>
            <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="ghost" className="text-white/30 hover:text-white">
              {t.logout}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel p-6 border-l-4 border-l-amber-600">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-tighter">{t.myGoal}</h3>
                    <button onClick={() => setIsEditingGoal(true)} className="text-amber-600 text-[10px] uppercase hover:underline">{t.edit}</button>
                </div>
                {isEditingGoal ? (
                    <div className="space-y-4">
                        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} className="dark-input w-full text-sm" rows={4} />
                        <div className="flex gap-2">
                            <Button onClick={handleSaveGoal} className="px-4 py-2 text-xs">{t.save}</Button>
                            <button onClick={() => setIsEditingGoal(false)} className="text-white/40 text-xs">{t.cancel}</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-lg font-light leading-relaxed text-white/90">"{goal || t.goalHint}"</p>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-2">
                    {lang === 'he' ? 'מה עלה במשוב?' : 'FEEDBACK SUMMARY'}
                </h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {responses.length === 0 && <p className="text-white/20 text-sm italic p-4 text-center glass-panel">ממתין למשיבים...</p>}
                  {responses.map(r => (
                      <div key={r.id} className="glass-panel p-4 border-white/5 hover:border-white/10 transition-all group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] text-amber-600 font-bold uppercase tracking-tighter">{translations[lang][r.relationship] || r.relationship}</span>
                            <span className="text-[9px] text-white/10 uppercase">#{r.id.slice(-4)}</span>
                          </div>
                          <p className="text-white/70 text-sm mb-3 font-light leading-snug">"{r.q1_change}"</p>
                          <div className="h-px bg-white/5 w-full mb-3"></div>
                          <p className="text-white/40 text-[11px] italic">"{r.q2_actions}"</p>
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
                              <div className="absolute inset-0 border-4 border-amber-600/10 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-2xl font-light text-white animate-pulse">{loadingMessage}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 max-w-md">
                            <div className="w-20 h-20 bg-amber-600/10 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-2xl shadow-amber-600/20">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="M2 12h4"/><path d="m4.93 19.07 2.83-2.647"/><path d="M12 22v-4"/><path d="m19.07 19.07-2.83-2.83"/><path d="M22 12h-4"/><path d="m19.07 4.93-2.83 2.83"/></svg>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-4">{lang === 'he' ? 'מוכן לזקק תובנות?' : 'Ready to refine?'}</h2>
                                <p className="text-white/40 text-sm leading-relaxed">
                                    {lang === 'he' ? 'המערכת תעזור לך לראות את המשובים מזווית חדשה ותציע כיווני מחשבה לצמיחה.' : 'The system will help you see feedback from a new angle and suggest growth paths.'}
                                </p>
                            </div>
                            <Button onClick={handleAnalyze} className="w-full py-5 text-xl" disabled={responses.length < 1}>
                                {lang === 'he' ? 'זקק לי את המשוב' : 'Refine feedback'}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    
                    <div className="glass-panel p-10 bg-gradient-to-br from-onyx-800 to-onyx-950 border-amber-600/30 relative overflow-hidden group shadow-[0_0_50px_-12px_rgba(194,84,0,0.3)]">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="px-3 py-1 bg-amber-600/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                                    {lang === 'he' ? 'כיוון מרכזי אפשרי' : 'PRIMARY SUGGESTION'}
                                </span>
                                <div className="h-px flex-1 bg-white/5"></div>
                            </div>
                            
                            <h2 className="text-amber-500 text-sm font-bold uppercase tracking-[0.2em] mb-4">Suggested OBT</h2>
                            <p className="text-4xl font-bold text-white leading-tight mb-8 max-w-2xl">
                                {lang === 'he' ? analysis.theOneBigThing_he : analysis.theOneBigThing_en}
                            </p>
                            
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 italic text-white/50 text-lg font-light leading-relaxed">
                              "{lang === 'he' ? analysis.executiveSummary_he : analysis.executiveSummary_en}"
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-panel p-8 space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                    {lang === 'he' ? 'נקודות חוזק ואימפקט' : 'STRENGTHS & IMPACT'}
                                </h4>
                            </div>
                            <ul className="space-y-4">
                                {(lang === 'he' ? analysis.question1Analysis.opportunities_he : analysis.question1Analysis.opportunities_en).map((opt, i) => (
                                    <li key={i} className="flex gap-4 text-white/80 leading-snug">
                                        <span className="text-amber-600 font-bold">#</span> {opt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="glass-panel p-8 space-y-4 border-red-900/10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                    {lang === 'he' ? 'ממה כדאי להיזהר?' : 'WATCH OUT FOR'}
                                </h4>
                            </div>
                            <p className="text-white/80 italic font-light leading-relaxed">
                                "{lang === 'he' ? analysis.question2Analysis.psychologicalPatterns_he : analysis.question2Analysis.psychologicalPatterns_en}"
                            </p>
                        </div>
                    </div>

                    <div className="glass-panel p-8 border-white/10 flex flex-col md:flex-row gap-10 items-center">
                        <div className="relative w-24 h-24 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                                <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={263.8} strokeDashoffset={263.8 - (263.8 * analysis.goalPrecision.score) / 100} className="text-amber-600" strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white">{analysis.goalPrecision.score}%</span>
                                <span className="text-[8px] uppercase text-white/30">Match</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <h4 className="text-[10px] font-bold text-amber-600 uppercase mb-1">
                                    {lang === 'he' ? 'מיקוד המטרה שלך' : 'GOAL FOCUS'}
                                </h4>
                                <p className="text-white/60 text-sm">
                                    {lang === 'he' ? analysis.goalPrecision.critique_he : analysis.goalPrecision.critique_en}
                                </p>
                            </div>
                            <div className="p-4 bg-amber-600/5 rounded-xl border border-amber-600/10">
                                <p className="text-white font-medium italic">
                                    "{lang === 'he' ? analysis.goalPrecision.refinedGoal_he : analysis.goalPrecision.refinedGoal_en}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Alternative OBT Section */}
                    <div className="glass-panel p-8 border-dashed border-white/10 bg-white/[0.02]">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-white/20 text-xs font-bold uppercase tracking-widest">
                                {lang === 'he' ? 'זווית ראייה חלופית' : 'ALTERNATIVE ANGLE'}
                            </span>
                        </div>
                        <h4 className="text-lg font-bold text-white/80 mb-2">OBT אפשרי נוסף:</h4>
                        <p className="text-white/60 italic">
                            {lang === 'he' ? analysis.alternativeOBT_he : analysis.alternativeOBT_en}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                          <h3 className="text-xl font-bold text-white">
                              {lang === 'he' ? 'רעיונות לצעדים הבאים' : 'IDEAS FOR ACTION'}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {analysis.actionPlan.map((step, i) => (
                                <div key={i} className="glass-panel flex gap-8 items-start p-6 group">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 font-black">0{i+1}</div>
                                    <div className="space-y-1">
                                        <h5 className="text-lg font-bold text-white">
                                            {lang === 'he' ? step.title_he : step.title_en}
                                        </h5>
                                        <p className="text-white/50 text-sm leading-relaxed">
                                            {lang === 'he' ? step.content_he : step.content_en}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-6 pt-16 border-t border-white/5">
                        <p className="text-[11px] text-white/30 text-center max-w-lg">
                            {lang === 'he' ? 'הדוח הוכן בעזרת AI כדי לשקף לך דפוסים שעלו מהמשובים. בסופו של דבר, אתה זה שמכיר הכי טוב את המציאות שלך - הבחירה במה להתמקד היא בידיים שלך.' : 'This report was prepared by AI to reflect patterns from your feedback. Ultimately, you know your reality best - the choice of focus is yours.'}
                        </p>
                        <Button onClick={() => exportToWord(user, analysis, responses)} variant="outline" className="px-10 py-4">
                          {t.downloadWord}
                        </Button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
