import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { RelationshipType } from '../types';

export const Survey: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userName, setUserName] = useState<string>('');
  
  // Form State
  const [relationship, setRelationship] = useState<RelationshipType>('peer');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
        setIsLoadingUser(true);
        if (userId) {
            try {
                const name = await storageService.getUserNameById(userId);
                if (name) {
                    setUserName(name);
                } else {
                    setError('הקישור אינו תקין.');
                }
            } catch (e) {
                setError('שגיאה בטעינת הנתונים.');
            }
        }
        setIsLoadingUser(false);
    };
    checkConnection();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSending(true);
    try {
        await storageService.addResponse(userId, relationship, q1, q2);
        setSubmitted(true);
    } catch (err) {
        setError('שגיאה בשמירה. ייתכן והמערכת באופליין.');
    } finally {
        setIsSending(false);
    }
  };

  if (isLoadingUser) {
      return (
          <Layout>
              <div className="flex justify-center items-center h-[50vh]">
                 <div className="w-10 h-10 border-4 border-white/10 border-t-primary-500 rounded-full animate-spin"></div>
              </div>
          </Layout>
      );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center relative overflow-hidden">
          {/* Simple CSS Confetti Effect Background */}
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
            .confetti {
              position: absolute;
              width: 10px;
              height: 10px;
              background-color: #F97316;
              animation: confetti-fall 3s linear forwards;
            }
          `}</style>
          {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="confetti"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `-${Math.random() * 20}%`,
                    backgroundColor: ['#F97316', '#3B82F6', '#10B981', '#F43F5E'][Math.floor(Math.random() * 4)],
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
          ))}

          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-full flex items-center justify-center mb-8 text-5xl shadow-[0_0_50px_rgba(16,185,129,0.4)] animate-[bounce_1s_ease-out]">
             ✓
          </div>
          <h2 className="text-4xl font-heading font-bold text-white mb-4 tracking-tight">תודה רבה!</h2>
          <p className="text-slate-300 text-lg max-w-md mb-10 leading-relaxed">
                המשוב שלך התקבל בהצלחה. <br/>
                התשובות עוזרות ל-{userName} לצמוח ולהשתפר.
          </p>
          
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <Link to="/">
                <Button variant="outline" className="w-full">חזרה לדף הבית</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
      return (
        <Layout>
            <div className="max-w-md mx-auto mt-12 text-center p-8 glass-panel rounded-xl">
                <h2 className="text-xl font-bold text-rose-500 mb-2">שגיאה</h2>
                <p className="text-slate-300 mb-6">{error}</p>
                <Link to="/">
                    <Button variant="secondary">חזרה</Button>
                </Link>
            </div>
        </Layout>
      );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto w-full">
        
        <div className="text-center mb-10">
            <div className="inline-block px-4 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-xs font-bold uppercase tracking-widest mb-4">
                משוב 360 אנונימי
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">
               עבור {userName}
            </h1>
            <p className="text-slate-400 text-lg">
                דעתך חשובה לנו ועוזרת לייצר שינוי אמיתי.
            </p>
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden border border-white/10 shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-accent-500"></div>
            
            <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* Relationship */}
                <div>
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                        מה הקשר המקצועי שלך?
                    </label>
                    <div className="relative group">
                        <select 
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                            className="dark-input appearance-none cursor-pointer bg-midnight-800/50 hover:bg-midnight-800 transition-colors py-4 px-5 rounded-xl border-slate-700"
                        >
                            <option value="peer">אני קולגה / עמית</option>
                            <option value="manager">אני מנהל/ת ישיר/ה</option>
                            <option value="subordinate">אני כפיף/ה</option>
                            <option value="friend">אני חבר/ה</option>
                            <option value="other">ממשק עבודה אחר</option>
                        </select>
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-primary-400 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {/* Q1 */}
                <div className="space-y-4">
                    <label className="block text-xl md:text-2xl font-heading font-medium text-white leading-relaxed">
                        1. מהו <span className="text-primary-400 font-bold decoration-primary-500/30 underline decoration-4 underline-offset-4">הדבר האחד</span> (המרכזי ביותר) שאם ישונה, יקפיץ את האדם הזה קדימה?
                    </label>
                    <textarea
                        required
                        value={q1}
                        onChange={(e) => setQ1(e.target.value)}
                        rows={4}
                        className="dark-input min-h-[140px] text-lg focus:ring-2 focus:ring-primary-500/50"
                        placeholder="נסה/י להיות ספציפי/ת ככל האפשר..."
                    />
                </div>

                {/* Q2 */}
                <div className="space-y-4">
                    <label className="block text-xl md:text-2xl font-heading font-medium text-white leading-relaxed">
                        2. אילו התנהגויות קיימות כיום מעכבות אותו/ה או סותרות את השינוי הזה?
                    </label>
                    <textarea
                        required
                        value={q2}
                        onChange={(e) => setQ2(e.target.value)}
                        rows={4}
                        className="dark-input min-h-[140px] text-lg focus:ring-2 focus:ring-primary-500/50"
                        placeholder="לדוגמה: כשהוא/היא..."
                    />
                </div>

                <div className="pt-8 text-center border-t border-white/5">
                    <Button type="submit" variant="primary" isLoading={isSending} className="w-full md:w-2/3 text-lg py-4 font-bold shadow-glow hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] transform hover:-translate-y-1 transition-all duration-300">
                        שלח משוב
                    </Button>
                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest opacity-60">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        <span>המידע מאובטח ומוצפן</span>
                    </div>
                </div>
            </form>
        </div>
      </div>
    </Layout>
  );
};