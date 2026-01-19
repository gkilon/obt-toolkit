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
  
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    if (!currentUser) { navigate('/'); return; }
    setUser(currentUser);
    setGoal(currentUser.userGoal || '');
    if (!currentUser.userGoal) setIsEditingGoal(true);
    storageService.getResponsesForUser(currentUser.id).then(setResponses);
  }, [navigate]);

  const handleSaveGoal = async () => {
      if (!user || !goal.trim()) return;
      await storageService.updateUserGoal(user.id, goal);
      setUser({ ...user, userGoal: goal });
      setIsEditingGoal(false);
  };

  const handleAnalyze = async () => {
    setLoadingAnalysis(true);
    try {
      const result = await analyzeFeedback(responses, user?.userGoal);
      setAnalysis(result);
    } catch (error) {
      alert("Analysis encounterd an issue. Check your connection.");
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
        {/* Upper Dashboard Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-8 border-b border-onyx-800">
          <div className="space-y-1">
            <span className="text-bronze-500 font-bold tracking-[0.2em] text-[10px] uppercase block">Analysis Hub</span>
            <h1 className="text-4xl md:text-5xl font-heading font-light text-onyx-100">{t.dashboardTitle}, {user.name}</h1>
            <p className="text-onyx-500 text-sm">{t.feedbacksCollected}: <span className="text-bronze-400 font-mono font-bold">{responses.length}</span></p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={copyLink} variant="outline" className="rounded-full border-onyx-700 text-onyx-300 hover:border-bronze-500">
                <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    {copied ? t.linkCopied : t.copyLink}
                </span>
            </Button>
            <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="ghost" className="text-xs uppercase tracking-widest">{t.logout}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Sidebar / Context */}
          <div className="lg:col-span-4 space-y-10">
            <div className="glass-panel border-l-2 border-l-bronze-500/50 bg-onyx-800/20">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-onyx-500 uppercase tracking-widest">{t.myGoal}</h3>
                    <button onClick={() => setIsEditingGoal(true)} className="text-bronze-500 text-[10px] uppercase font-bold hover:text-bronze-400 transition-colors tracking-tighter">{t.edit}</button>
                </div>
                {isEditingGoal ? (
                    <div className="space-y-4">
                        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} className="dark-input w-full text-sm bg-onyx-950/50" rows={5} placeholder={t.goalHint} />
                        <div className="flex gap-2">
                            <Button onClick={handleSaveGoal} className="px-5 py-1 text-xs">{t.save}</Button>
                            <button onClick={() => setIsEditingGoal(false)} className="text-onyx-600 text-xs px-2 hover:text-onyx-400">✕</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-xl font-light italic leading-relaxed text-onyx-200">"{goal || 'Set your primary goal to begin synthesis...'}"</p>
                )}
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-black text-onyx-600 uppercase tracking-widest">Incoming Feedback</h3>
                    <span className="bg-onyx-800 text-onyx-400 text-[9px] px-2 py-0.5 rounded-full font-bold">{responses.length} responses</span>
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {responses.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-onyx-800 rounded-xl">
                            <p className="text-onyx-700 text-sm">Waiting for responses...</p>
                        </div>
                    )}
                    {responses.map(r => (
                        <div key={r.id} className="glass-panel p-5 bg-onyx-900/40 border-onyx-800/40 hover:border-onyx-700/60 transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[9px] bg-bronze-500/10 text-bronze-400 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">{translations[lang][r.relationship] || r.relationship}</span>
                                <span className="text-[9px] text-onyx-600 font-mono">{new Date(r.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-onyx-300 text-sm leading-relaxed mb-4">"{r.q1_change}"</p>
                            <div className="pt-3 border-t border-onyx-800/50">
                                <p className="text-onyx-500 text-[11px] italic">"{r.q2_actions}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* MAIN REPORT AREA */}
          <div className="lg:col-span-8">
            {!analysis ? (
                <div className="glass-panel min-h-[500px] flex flex-col items-center justify-center text-center space-y-8 bg-gradient-to-b from-onyx-800/10 to-transparent border-dashed border-2 border-onyx-800/50">
                    <div className="relative">
                        <div className="absolute inset-0 bg-bronze-500/20 blur-3xl rounded-full"></div>
                        <div className="relative w-24 h-24 rounded-full bg-onyx-900 border border-onyx-700 flex items-center justify-center text-bronze-500 shadow-2xl">
                             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M2 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="M12 22v-2"/><path d="m19.07 19.07-1.41-1.41"/><path d="M22 12h-2"/><path d="m19.07 4.93-1.41 1.41"/><circle cx="12" cy="12" r="4"/></svg>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-heading font-light text-onyx-100 mb-3">Professional Synthesis</h2>
                        <p className="text-onyx-500 max-w-sm mx-auto text-sm leading-relaxed">
                            Analyze {responses.length} perspectives to uncover your most powerful competitive advantage.
                        </p>
                    </div>
                    <Button 
                        onClick={handleAnalyze} 
                        isLoading={loadingAnalysis} 
                        className="px-12 py-4 rounded-full text-md font-bold shadow-2xl shadow-bronze-600/20 bg-bronze-600 hover:bg-bronze-500 transform hover:scale-105 transition-all" 
                        disabled={responses.length < 1}
                    >
                        {t.generateReport}
                    </Button>
                    {responses.length < 1 && <p className="text-[10px] text-red-900 uppercase font-black tracking-widest">Minimum 1 feedback required</p>}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-10">
                    
                    {/* Executive Summary & Score */}
                    <div className="glass-panel p-10 bg-gradient-to-br from-onyx-800/50 to-onyx-950 border-onyx-700/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-12 items-center mb-12">
                            <div className="relative w-40 h-40 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-onyx-800" />
                                    <circle 
                                        cx="80" cy="80" r="74" 
                                        stroke="currentColor" strokeWidth="6" 
                                        fill="transparent" 
                                        strokeDasharray={464.9} 
                                        strokeDashoffset={464.9 - (464.9 * analysis.goalPrecision.score) / 100} 
                                        className="text-bronze-500" 
                                        strokeLinecap="round" 
                                        style={{ transition: 'stroke-dashoffset 2s ease-out' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-heading font-thin text-white">{analysis.goalPrecision.score}</span>
                                    <span className="text-[9px] uppercase tracking-[0.2em] text-onyx-500 font-bold">Accuracy</span>
                                </div>
                            </div>
                            <div className="flex-grow text-center md:text-start">
                                <span className="inline-block text-[10px] bg-bronze-500/10 text-bronze-400 px-3 py-1 rounded-full font-black uppercase mb-4 tracking-widest">Executive Summary</span>
                                <h2 className="text-3xl font-heading text-white mb-4">Strategic Diagnosis</h2>
                                <p className="text-onyx-300 leading-relaxed text-lg font-light italic">"{analysis.executiveSummary}"</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-onyx-800 pt-10">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-onyx-500 uppercase tracking-widest">Goal Alignment Audit</h4>
                                <p className="text-sm text-onyx-400 leading-relaxed">{analysis.goalPrecision.critique}</p>
                            </div>
                            <div className="space-y-4 bg-bronze-500/5 p-6 rounded-2xl border border-bronze-500/10">
                                <h4 className="text-[10px] font-black text-bronze-500 uppercase tracking-widest">The Refined North Star</h4>
                                <p className="text-xl font-heading text-white leading-tight">"{analysis.goalPrecision.refinedGoal}"</p>
                            </div>
                        </div>
                    </div>

                    {/* Central Breakthrough - The Highlight */}
                    <div className="glass-panel p-1 border-bronze-500/30 bg-bronze-500/10 shadow-[0_0_50px_-12px_rgba(245,158,11,0.2)]">
                        <div className="bg-onyx-900 p-8 rounded-[11px] border border-onyx-800">
                             <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-full bg-bronze-500 flex items-center justify-center text-onyx-950">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                                </div>
                                <h3 className="text-xl font-heading text-bronze-400 uppercase tracking-tight">The Breakthrough Insight</h3>
                             </div>
                             <p className="text-2xl font-light text-white leading-snug">
                                {analysis.theOneBigThing}
                             </p>
                        </div>
                    </div>

                    {/* Multi-layered Analysis Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="glass-panel hover:bg-onyx-800/40 transition-colors">
                            <h4 className="text-[10px] font-black text-onyx-500 uppercase tracking-widest mb-6 border-b border-onyx-800 pb-3">Growth Catalysts</h4>
                            <ul className="space-y-4">
                                {analysis.question1Analysis.opportunities.map((item, i) => (
                                    <li key={i} className="flex gap-4 text-sm text-onyx-200 group">
                                        <span className="text-bronze-500 font-mono font-bold mt-1 text-xs">0{i+1}</span>
                                        <span className="group-hover:text-white transition-colors leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="glass-panel hover:bg-onyx-800/40 transition-colors">
                            <h4 className="text-[10px] font-black text-onyx-500 uppercase tracking-widest mb-6 border-b border-onyx-800 pb-3">The "Shadow" Report</h4>
                            <p className="text-sm text-onyx-300 leading-relaxed italic mb-6">"{analysis.question2Analysis.psychologicalPatterns}"</p>
                            <div className="flex flex-wrap gap-2">
                                {analysis.question2Analysis.blockers.map((tag, i) => (
                                    <span key={i} className="px-3 py-1 bg-red-950/20 text-red-400 text-[9px] rounded-full border border-red-900/30 uppercase font-black tracking-tighter">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Roadmap */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-onyx-600 uppercase tracking-widest px-2">The Execution Roadmap</h4>
                        <div className="space-y-4">
                            {analysis.actionPlan.map((step, i) => (
                                <div key={i} className="glass-panel flex gap-8 items-start hover:border-bronze-500/40 transition-all group bg-onyx-900/40">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-onyx-800 border border-onyx-700 flex items-center justify-center text-onyx-100 font-bold group-hover:bg-bronze-600 group-hover:text-onyx-900 group-hover:border-bronze-400 transition-all duration-500 text-lg">
                                        {i+1}
                                    </div>
                                    <div className="space-y-1">
                                        <h5 className="text-lg font-heading text-white group-hover:text-bronze-400 transition-colors">{step.title}</h5>
                                        <p className="text-sm text-onyx-400 leading-relaxed group-hover:text-onyx-200 transition-colors">{step.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Export Footer */}
                    <div className="pt-10 flex flex-col items-center gap-6">
                         <div className="h-px w-24 bg-onyx-800"></div>
                         <Button onClick={() => exportToWord(user, analysis, responses)} variant="secondary" className="px-10 py-3 rounded-full border border-onyx-700 hover:border-bronze-500/50 group">
                            <span className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-0.5 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                {t.downloadWord}
                            </span>
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