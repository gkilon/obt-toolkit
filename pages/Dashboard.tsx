import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { analyzeFeedback } from '../services/geminiService';
import { exportToWord } from '../services/exportService';
import { User, FeedbackResponse, AnalysisResult } from '../types';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

const relationshipLabels: Record<string, string> = {
  'manager': 'מנהל/ת',
  'peer': 'קולגה',
  'subordinate': 'כפיף/ה',
  'friend': 'חבר/ה',
  'other': 'אחר'
};

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }
    setUser(currentUser);
    
    const loadData = async () => {
        if (!storageService.isCloudEnabled()) {
             setLoadingData(false);
             return;
        }
        setLoadingData(true);
        try {
            const data = await storageService.getResponsesForUser(currentUser.id);
            setResponses(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingData(false);
        }
    };
    loadData();
  }, [navigate]);

  const handleAnalyze = async () => {
    if (responses.length === 0) return;
    setLoadingAnalysis(true);
    try {
      const result = await analyzeFeedback(responses);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      alert("שגיאה בניתוח הנתונים.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const copyLink = () => {
    if (!user) return;
    const baseUrl = window.location.href.split('#')[0];
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const url = `${cleanBase}/#/survey/${user.id}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExport = () => {
      if(user) exportToWord(user, analysis, responses);
  };

  const groupResponses = (data: FeedbackResponse[]) => {
      const grouped: Record<string, FeedbackResponse[]> = {};
      data.forEach(r => {
          const key = r.relationship || 'other';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(r);
      });
      return grouped;
  };

  if (!user) return null;
  const groupedResponses = groupResponses(responses);

  return (
    <Layout>
      <div className="animate-fade-in pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/20 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-bronze-300 block mb-2">אזור אישי</span>
            <h1 className="text-4xl font-serif font-bold text-white drop-shadow-md">
                {user.name}
            </h1>
            <p className="text-slate-200 font-light italic mt-2 opacity-90">
                {loadingData ? 'טוען נתונים...' : `מערכת ניתוח משובים 360° • ${responses.length} משובים התקבלו`}
            </p>
          </div>
          <div className="flex gap-4">
             <Button onClick={copyLink} variant="secondary">
               {copied ? 'הועתק ✓' : 'העתק קישור'}
             </Button>
             <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="outline">
                יציאה
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content (Responses) */}
          <div className="lg:col-span-2 space-y-10">
            
            {responses.length === 0 ? (
              <div className="glass-panel text-center py-24 rounded-2xl">
                <h3 className="text-2xl font-serif font-bold text-ink mb-4">המסע מתחיל כאן</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-light">
                    שלח את הקישור לאנשי מפתח בארגון כדי לקבל את הפרספקטיבה שתשנה את התמונה.
                </p>
                <Button onClick={copyLink} variant="gold">
                    העתק קישור לשליחה
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedResponses).map(([rel, items]) => (
                   <div key={rel}>
                       <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-xl font-serif font-bold text-white">
                                {relationshipLabels[rel] || rel}
                            </h2>
                            <span className="h-px flex-grow bg-white/20"></span>
                            <span className="text-xs font-bold text-bronze-300 bg-black/30 px-2 py-1 rounded-full">{items.length}</span>
                       </div>
                       
                       <div className="grid gap-6">
                            {items.map((resp) => (
                                <div key={resp.id} className="glass-panel p-6 rounded-xl hover:-translate-y-1 transition-transform relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-bronze-600"></div>
                                    <div className="pl-4">
                                        <div className="mb-4">
                                            <span className="text-[10px] font-bold text-bronze-600 uppercase tracking-widest block mb-1">הדבר האחד</span>
                                            <p className="text-lg text-ink font-serif font-medium leading-relaxed">{resp.q1_change}</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">חסם</span>
                                            <p className="text-sm text-slate-500 font-light italic">"{resp.q2_actions}"</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                       </div>
                   </div> 
                ))}
              </div>
            )}
          </div>

          {/* Sidebar (Analysis) */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 bg-slate-900 text-white p-8 shadow-2xl rounded-2xl relative overflow-hidden border border-slate-700/50">
                {/* Decoration blob */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-bronze-600 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-royal-800 rounded-full blur-3xl opacity-30"></div>
                
                <div className="relative z-10">
                    <h2 className="text-xl font-serif font-bold text-bronze-200 mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
                        <span>✨</span> ניתוח AI
                    </h2>
                    
                    {!analysis ? (
                    <div className="text-center py-8">
                        <p className="text-slate-300 text-sm mb-8 font-light leading-relaxed">
                        מערכת הבינה המלאכותית תסרוק את התשובות ותזקק עבורך את התובנה המרכזית.
                        </p>
                        <Button 
                        onClick={handleAnalyze} 
                        disabled={responses.length === 0}
                        isLoading={loadingAnalysis}
                        variant="gold"
                        className="w-full shadow-lg shadow-bronze-900/50"
                        >
                        הפק דוח תובנות
                        </Button>
                    </div>
                    ) : (
                    <div className="space-y-8 animate-fade-in max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                        <div>
                            <span className="text-[10px] uppercase tracking-widest text-bronze-400 font-bold">תובנת על</span>
                            <p className="text-lg leading-relaxed mt-2 text-white font-serif font-medium">{analysis.summary}</p>
                        </div>
                        
                        <div>
                            <span className="text-[10px] uppercase tracking-widest text-bronze-400 font-bold">נושאים מרכזיים</span>
                            <ul className="mt-2 space-y-2">
                                {analysis.keyThemes.map((theme, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2 bg-white/5 p-2 rounded">
                                    <span className="text-bronze-500 mt-0.5">•</span>
                                    {theme}
                                </li>
                                ))}
                            </ul>
                        </div>

                        {analysis.groupAnalysis && (
                            <div className="space-y-4 pt-4 border-t border-white/10">
                                {Object.entries(analysis.groupAnalysis).map(([key, val]) => (
                                    <div key={key}>
                                        <span className="text-xs font-bold text-white block mb-1">{relationshipLabels[key] || key}</span>
                                        <p className="text-xs text-slate-400 font-light leading-relaxed">{val}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-gradient-to-br from-bronze-900 to-slate-900 p-4 rounded-xl border border-bronze-500/30 mt-4 shadow-inner">
                            <span className="text-[10px] uppercase tracking-widest text-bronze-300 block mb-2 font-bold">המלצה לביצוע</span>
                            <p className="text-sm text-white italic font-medium">"{analysis.actionableAdvice}"</p>
                        </div>
                        
                        <div className="space-y-3 pt-6">
                            <Button onClick={handleExport} variant="secondary" className="w-full bg-white text-ink hover:bg-slate-100 border-none">
                                שמור כקובץ Word
                            </Button>
                            <button 
                                onClick={handleAnalyze} 
                                className="text-xs text-slate-500 hover:text-slate-300 w-full text-center underline transition-colors"
                            >
                            רענן ניתוח
                            </button>
                        </div>
                    </div>
                    )}
                </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};