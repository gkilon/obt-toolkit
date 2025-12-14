import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { analyzeFeedback } from '../services/geminiService';
import { exportToWord } from '../services/exportService';
import { User, FeedbackResponse, AnalysisResult } from '../types';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

const relationshipLabels: Record<string, string> = {
  'manager': 'מנהלים',
  'peer': 'קולגות',
  'subordinate': 'כפיפים',
  'friend': 'חברים',
  'other': 'אחר'
};

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  // Goal State
  const [goal, setGoal] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cloudError, setCloudError] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check Cloud Status
    if (!storageService.isCloudEnabled()) {
        setCloudError(true);
    }

    const currentUser = storageService.getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }
    setUser(currentUser);
    setGoal(currentUser.userGoal || '');
    
    // Auto-open edit mode if no goal is set
    if (!currentUser.userGoal) {
        setIsEditingGoal(true);
    }

    const loadData = async () => {
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

  const handleSaveGoal = async () => {
      if (!user) return;
      if (!goal.trim()) return;

      setIsSavingGoal(true);
      try {
          await storageService.updateUserGoal(user.id, goal);
          setUser({ ...user, userGoal: goal });
          setIsEditingGoal(false);
      } catch (e) {
          alert('שגיאה בשמירת המטרה');
      } finally {
          setIsSavingGoal(false);
      }
  };

  const handleAnalyze = async () => {
    if (responses.length === 0) return;
    setLoadingAnalysis(true);
    try {
      const result = await analyzeFeedback(responses, user?.userGoal);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      alert("שגיאה בניתוח הנתונים. וודא שיש מפתח API תקין.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const copyLink = () => {
    if (!user) return;
    if (!user.userGoal) {
        alert("יש להגדיר את מטרת הצמיחה שלך לפני שיתוף השאלון.");
        setIsEditingGoal(true);
        return;
    }

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
      <div className="pb-12">
        
        {/* Critical Cloud Error Banner */}
        {cloudError && (
            <div className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded mb-8 flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                    <h3 className="font-bold">אין חיבור לענן (Firebase)</h3>
                    <p className="text-sm opacity-90">
                        המערכת פועלת במצב מקומי בלבד כי חסרים מפתחות התחברות. 
                        <br/>
                        <strong>המשמעות:</strong> הקישור האישי שלך לא יעבוד עבור אנשים אחרים והמידע שלהם לא יישמר. יש להגדיר משתני סביבה תקינים.
                    </p>
                </div>
            </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8 border-b border-onyx-800">
          <div>
            <span className="text-bronze-500 font-bold uppercase tracking-widest text-xs mb-2 block">Dashboard</span>
            <h1 className="text-4xl font-heading text-onyx-100">
                שלום, {user.name}
            </h1>
            <p className="text-onyx-400 mt-2 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cloudError ? 'bg-red-500' : 'bg-green-600'}`}></span>
                סטטוס: {cloudError ? 'מנותק' : 'מחובר לענן'} • נאספו {responses.length} משובים
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
             <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="ghost">
                יציאה
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content (Responses) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* GOAL SETTING SECTION */}
            <div className="glass-panel p-6 border-l-4 border-l-bronze-700">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-heading text-onyx-100 flex items-center gap-2">
                            <span className="text-bronze-500">🎯</span> מטרת הצמיחה שלי
                        </h3>
                        <p className="text-onyx-400 text-sm mt-1">
                            זו ההצהרה שתוצג למשיבים בתחילת השאלון.
                        </p>
                    </div>
                    {!isEditingGoal && (
                        <button onClick={() => setIsEditingGoal(true)} className="text-bronze-500 hover:text-bronze-400 text-sm underline">
                            ערוך
                        </button>
                    )}
                </div>

                {isEditingGoal ? (
                    <div className="space-y-4">
                        <textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="dark-input w-full min-h-[100px]"
                            placeholder="דוגמה: אני רוצה להפוך למנהל אסטרטגי יותר ופחות לעסוק בפרטים הקטנים..."
                        />
                        <div className="flex gap-3">
                            <Button onClick={handleSaveGoal} isLoading={isSavingGoal} className="py-2 px-4 text-xs">שמור מטרה</Button>
                            <button onClick={() => { setIsEditingGoal(false); setGoal(user.userGoal || ''); }} className="text-onyx-500 hover:text-onyx-300 text-xs">ביטול</button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-onyx-900/50 p-4 rounded border border-onyx-700/50">
                        <p className="text-lg font-medium text-onyx-200 italic">"{goal}"</p>
                    </div>
                )}
            </div>

            {/* RESPONSES SECTION */}
            {responses.length === 0 ? (
              <div className="glass-panel rounded p-16 text-center border-dashed border-2 border-onyx-700 mt-8">
                <div className="w-16 h-16 bg-onyx-700 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl text-onyx-400">
                    🚀
                </div>
                <h3 className="text-2xl font-heading font-medium text-onyx-100 mb-3">המסע שלך מתחיל כאן</h3>
                
                {!user.userGoal ? (
                     <p className="text-bronze-400 max-w-sm mx-auto mb-8 font-medium">
                        שלב 1: עליך להגדיר את מטרת הצמיחה שלך בתיבה למעלה.
                    </p>
                ) : (
                    <p className="text-onyx-400 max-w-sm mx-auto mb-8 leading-relaxed">
                        כעת יש לשלוח את הקישור לאנשים שעובדים איתך כדי לקבל פידבק על המטרה שהצבת.
                    </p>
                )}
                
                <Button onClick={copyLink} variant="primary" disabled={cloudError || !user.userGoal} className={!user.userGoal ? 'opacity-50 grayscale' : ''}>
                    {copied ? '✓ הקישור הועתק!' : 'העתק קישור אישי'}
                </Button>
              </div>
            ) : (
              <div className="space-y-12 mt-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-heading text-onyx-100">המשובים שהתקבלו</h3>
                    <Button onClick={copyLink} variant="secondary" className="whitespace-nowrap text-xs" disabled={cloudError}>
                        {copied ? '✓ הועתק' : 'העתק קישור לעוד אנשים'}
                    </Button>
                </div>

                {Object.entries(groupedResponses).map(([rel, items]) => (
                   <div key={rel}>
                       <h3 className="text-lg font-medium text-bronze-500 mb-5 flex items-center gap-3 uppercase tracking-wider">
                           {relationshipLabels[rel] || rel}
                           <span className="text-[10px] text-onyx-900 bg-onyx-200 px-2 py-0.5 rounded-full font-bold">{items.length}</span>
                           <div className="h-px bg-onyx-700 flex-grow"></div>
                       </h3>
                       
                       <div className="grid gap-4">
                            {items.map((resp) => (
                                <div key={resp.id} className="glass-panel p-6 hover:border-bronze-500/30 transition-colors group">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="text-[10px] font-bold text-bronze-500 uppercase tracking-widest mb-2">דיוק המטרה</div>
                                            <p className="text-onyx-200 text-lg leading-relaxed">{resp.q1_change}</p>
                                        </div>
                                        <div className="md:border-r md:border-onyx-700/50 md:pr-6">
                                            <div className="text-[10px] font-bold text-onyx-500 uppercase tracking-widest mb-2">חסמים והתנהגויות</div>
                                            <p className="text-onyx-400 text-sm italic">"{resp.q2_actions}"</p>
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
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
                 
                 {/* Analysis Card */}
                 <div className="glass-panel p-0 overflow-hidden">
                    <div className="bg-onyx-700/50 p-6 border-b border-onyx-700">
                        <h2 className="text-lg font-heading text-onyx-100 flex items-center gap-2">
                            <span className="text-bronze-500 text-xl">✦</span> ניתוח AI
                        </h2>
                        <p className="text-onyx-500 text-xs mt-1 uppercase tracking-widest">Powered by Gemini Pro</p>
                    </div>

                    <div className="p-6">
                        {!analysis ? (
                        <div className="text-center py-8">
                            <p className="text-onyx-400 mb-8 text-sm leading-relaxed">
                            המערכת תבדוק האם המטרה שלך ("{user.userGoal ? (user.userGoal.length > 20 ? user.userGoal.substring(0,20)+'...' : user.userGoal) : '...'}") תואמת את מה שהסביבה רואה.
                            </p>
                            <Button 
                            onClick={handleAnalyze} 
                            disabled={responses.length === 0}
                            isLoading={loadingAnalysis}
                            variant="primary"
                            className="w-full"
                            >
                            צור דוח תובנות
                            </Button>
                        </div>
                        ) : (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-bold text-bronze-500 uppercase tracking-widest mb-3">האם המטרה מדויקת?</h4>
                                <p className="text-onyx-200 font-medium text-lg leading-relaxed">{analysis.summary}</p>
                            </div>
                            
                            <div className="bg-onyx-900/50 p-4 rounded border border-onyx-800">
                                <h4 className="text-[10px] font-bold text-onyx-500 uppercase tracking-widest mb-3">נושאים שעלו</h4>
                                <ul className="space-y-2">
                                    {analysis.keyThemes.map((theme, i) => (
                                    <li key={i} className="text-sm text-onyx-300 flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-bronze-500 mt-1.5"></span>
                                        {theme}
                                    </li>
                                    ))}
                                </ul>
                            </div>

                            {analysis.groupAnalysis && (
                                <div className="pt-4 border-t border-onyx-700/50">
                                    <h4 className="text-[10px] font-bold text-onyx-500 uppercase tracking-widest mb-3">פרספקטיבות</h4>
                                    <div className="space-y-4">
                                        {Object.entries(analysis.groupAnalysis).map(([key, val]) => (
                                            <div key={key}>
                                                <span className="text-xs font-bold text-onyx-300 block mb-1">{relationshipLabels[key] || key}</span>
                                                <p className="text-xs text-onyx-400 leading-relaxed">{val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-bronze-900/10 p-5 rounded border border-bronze-700/30">
                                <h4 className="text-[10px] font-bold text-bronze-500 uppercase tracking-widest mb-2">המלצה לביצוע</h4>
                                <p className="text-sm text-bronze-300 font-medium italic">"{analysis.actionableAdvice}"</p>
                            </div>
                            
                            <div className="space-y-3 pt-4">
                                <Button onClick={handleExport} variant="secondary" className="w-full">
                                    הורד כקובץ Word
                                </Button>
                                <button 
                                    onClick={handleAnalyze} 
                                    className="text-[10px] uppercase tracking-widest text-onyx-500 hover:text-onyx-300 w-full text-center transition-colors"
                                >
                                רענן ניתוח מחדש
                                </button>
                            </div>
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