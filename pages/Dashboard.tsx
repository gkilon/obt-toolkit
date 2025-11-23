import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { analyzeFeedback } from '../services/geminiService';
import { User, FeedbackResponse, AnalysisResult } from '../types';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

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
    
    // Load responses asynchronously
    const loadData = async () => {
        setLoadingData(true);
        try {
            const data = await storageService.getResponsesForUser(currentUser.id);
            setResponses(data);
        } catch (e) {
            console.error("Failed to load responses", e);
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
      const q1Answers = responses.map(r => r.q1_change);
      const result = await analyzeFeedback(q1Answers);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      alert("שגיאה בניתוח הנתונים. אנא וודא שיש לך מפתח API תקין ל-Gemini.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const copyLink = () => {
    if (!user) return;
    const baseUrl = window.location.href.split('#')[0];
    // Handle trailing slash
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const url = `${cleanBase}/#/survey/${user.id}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error('Could not copy text: ', err);
      alert(`העתק את הקישור:\n${url}`);
    });
  };

  const handleLogout = () => {
    storageService.logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto w-full space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">שלום, {user.name} 👋</h1>
            <p className="text-slate-500">
                {loadingData ? 'טוען נתונים...' : `יש לך ${responses.length} תשובות עד כה.`}
            </p>
            {!storageService.isCloudEnabled() && (
                <p className="text-xs text-amber-600 mt-1 font-medium">
                    ⚠️ מצב מקומי: נתונים שיוזנו ממכשירים אחרים לא יופיעו כאן.
                </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
             <Button onClick={copyLink} variant="secondary">
               {copied ? 'הקישור הועתק!' : 'העתק קישור לשאלון'}
               {!copied && (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                 </svg>
               )}
             </Button>
             <Button onClick={handleLogout} variant="outline">התנתק</Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Raw Responses (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-md text-sm">📝</span>
              תשובות שהתקבלו
            </h2>

            {loadingData ? (
                <div className="text-center py-20">
                    <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-500 mt-2">טוען תשובות...</p>
                </div>
            ) : responses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-400 text-lg mb-2">עדיין אין תשובות</p>
                <p className="text-slate-500">שלח/י את הקישור לחברים וקולגות כדי להתחיל.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {responses.map((resp, idx) => (
                  <div key={resp.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">משיב #{responses.length - idx}</span>
                      <span className="text-xs text-slate-400">{new Date(resp.timestamp).toLocaleDateString('he-IL')} {new Date(resp.timestamp).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-indigo-600 mb-1">הדבר האחד לשינוי</h3>
                        <p className="text-slate-800 bg-indigo-50/50 p-3 rounded-lg border border-indigo-50">{resp.q1_change}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-rose-600 mb-1">פעולות סותרות</h3>
                        <p className="text-slate-800 bg-rose-50/50 p-3 rounded-lg border border-rose-50">{resp.q2_actions}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: AI Analysis (1/3 width) - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-gradient-to-b from-indigo-600 to-indigo-800 text-white rounded-2xl p-6 shadow-xl shadow-indigo-200 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>

                <h2 className="text-xl font-bold mb-4 relative z-10 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  ניתוח AI
                </h2>
                
                {!analysis ? (
                  <div className="text-center py-8 relative z-10">
                    <p className="text-indigo-100 mb-6">
                      {responses.length > 0 
                        ? "המערכת מוכנה לנתח את הדבר האחד הגדול מתוך כל התשובות." 
                        : "המתן לקבלת תשובות כדי להפעיל את הניתוח."}
                    </p>
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={responses.length === 0}
                      isLoading={loadingAnalysis}
                      className="w-full bg-white text-indigo-700 hover:bg-indigo-700/10 hover:text-white border-2 border-transparent hover:border-white transition-all"
                    >
                      נתח תובנות עכשיו
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 relative z-10 animate-fade-in">
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-indigo-200 mb-1">הדבר הגדול</h3>
                      <p className="text-lg font-bold leading-relaxed">{analysis.summary}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-indigo-200 mb-2">נושאים מרכזיים</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keyThemes.map((theme, i) => (
                          <span key={i} className="text-xs bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                      <h3 className="text-xs uppercase tracking-wider text-indigo-200 mb-1">עצה לפעולה</h3>
                      <p className="text-sm">{analysis.actionableAdvice}</p>
                    </div>

                    <Button 
                      onClick={handleAnalyze} 
                      isLoading={loadingAnalysis}
                      className="w-full bg-indigo-700/50 hover:bg-indigo-700 text-sm py-2"
                    >
                      נתח מחדש
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Privacy Note */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500">
                <p className="flex items-start gap-2">
                  <span className="text-lg">🔒</span>
                  <span>הניתוח מתבצע בצורה מאובטחת. המערכת מתמקדת רק ב"דבר האחד" כפי שהתבקש.</span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};