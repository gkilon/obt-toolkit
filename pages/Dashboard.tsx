import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { analyzeFeedback } from '../services/geminiService';
import { exportToWord } from '../services/exportService';
import { User, FeedbackResponse, AnalysisResult, RelationshipType } from '../types';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

const relationshipLabels: Record<string, string> = {
  'manager': 'מנהלים',
  'peer': 'קולגות',
  'subordinate': 'כפיפים',
  'friend': 'חברים/משפחה',
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
    
    // Strict Cloud Check for Data
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
      <div className="animate-fade-in space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-1">
                לוח בקרה אישי
            </h1>
            <p className="text-slate-500 font-light">
                שלום, <span className="font-medium text-slate-800">{user.name}</span>. 
                {loadingData ? ' מסנכרן נתונים...' : ` התקבלו ${responses.length} משובים.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
             <Button onClick={copyLink} variant="outline" className="border-slate-300">
               {copied ? 'הקישור הועתק!' : 'העתק קישור להפצה'}
             </Button>
             
             {responses.length > 0 && (
                <Button onClick={handleExport} variant="secondary" className="gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    הורד דוח Word
                </Button>
             )}

             <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="primary" className="bg-slate-800">
                יציאה
             </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Data (8/12) */}
          <div className="lg:col-span-8 space-y-8">
            
            {responses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🚀</div>
                <h3 className="text-lg font-bold text-slate-700">התחל את המסע שלך</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                    שלח את הקישור למנהלים, קולגות וכפיפים כדי לגלות מה יקפיץ אותך קדימה.
                </p>
                <Button onClick={copyLink} variant="gold" className="mt-6 mx-auto">
                    העתק קישור עכשיו
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedResponses).map(([rel, items]) => (
                   <div key={rel} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                       <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">קבוצה:</span>
                            <h2 className="text-lg font-serif font-bold text-slate-800">
                                {relationshipLabels[rel] || rel}
                            </h2>
                            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-auto">
                                {items.length} תשובות
                            </span>
                       </div>
                       <div className="divide-y divide-slate-100">
                            {items.map((resp) => (
                                <div key={resp.id} className="p-5 hover:bg-amber-50/10 transition-colors grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-amber-600 mb-1">הדבר האחד לשינוי:</h4>
                                        <p className="text-slate-800 leading-relaxed">{resp.q1_change}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 mb-1">חסם/סתירה:</h4>
                                        <p className="text-slate-500 leading-relaxed italic text-sm">"{resp.q2_actions}"</p>
                                    </div>
                                </div>
                            ))}
                       </div>
                   </div> 
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Analysis (4/12) */}
          <div className="lg:col-span-4">
            <div className="sticky top-28">
              <div className="navy-gradient text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center backdrop-blur-sm">✨</div>
                        <h2 className="text-xl font-serif font-bold tracking-wide">ניתוח AI מתקדם</h2>
                    </div>
                    
                    {!analysis ? (
                    <div className="text-center py-6">
                        <p className="text-slate-300 text-sm mb-8 leading-relaxed">
                        המערכת תסרוק את כל התשובות (מנהלים, קולגות, כפיפים) ותזקק עבורך את התובנה המרכזית לפריצת דרך.
                        </p>
                        <Button 
                        onClick={handleAnalyze} 
                        disabled={responses.length === 0}
                        isLoading={loadingAnalysis}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 border-none font-bold"
                        >
                        בצע ניתוח נתונים
                        </Button>
                    </div>
                    ) : (
                    <div className="space-y-6 animate-fade-in max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
                        {/* Summary */}
                        <div>
                            <h3 className="text-[10px] uppercase tracking-widest text-amber-500 mb-2">השורה התחתונה</h3>
                            <p className="text-lg font-medium leading-relaxed text-white">{analysis.summary}</p>
                        </div>
                        
                        <div className="w-full h-px bg-white/10"></div>

                        {/* Themes */}
                        <div>
                            <h3 className="text-[10px] uppercase tracking-widest text-amber-500 mb-2">נושאים חוזרים</h3>
                            <div className="flex flex-wrap gap-2">
                                {analysis.keyThemes.map((theme, i) => (
                                <span key={i} className="text-xs bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
                                    {theme}
                                </span>
                                ))}
                            </div>
                        </div>

                        {/* Group Breakdown */}
                        {analysis.groupAnalysis && Object.keys(analysis.groupAnalysis).length > 0 && (
                            <div className="bg-white/5 rounded-lg p-3 space-y-3">
                                <h3 className="text-[10px] uppercase tracking-widest text-amber-500">תובנות לפי קבוצה</h3>
                                {Object.entries(analysis.groupAnalysis).map(([key, val]) => (
                                    <div key={key}>
                                        <span className="text-xs font-bold text-white block">{relationshipLabels[key] || key}:</span>
                                        <p className="text-xs text-slate-300">{val}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Advice */}
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 mt-4">
                            <h3 className="text-[10px] uppercase tracking-widest text-amber-500 mb-2">המלצה לדרך פעולה</h3>
                            <p className="text-sm text-slate-300 leading-relaxed">{analysis.actionableAdvice}</p>
                        </div>

                        <button 
                            onClick={handleAnalyze} 
                            className="text-xs text-slate-400 hover:text-white underline mt-2 w-full text-center"
                        >
                        נתח מחדש
                        </button>
                    </div>
                    )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};