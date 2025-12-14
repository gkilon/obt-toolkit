import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { RelationshipType } from '../types';

export const Survey: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userName, setUserName] = useState<string>('');
  const [userGoal, setUserGoal] = useState<string>('');
  
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
                const userData = await storageService.getUserDataById(userId);
                if (userData && userData.name) {
                    setUserName(userData.name);
                    setUserGoal(userData.userGoal || '');
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
                 <div className="w-8 h-8 border-4 border-onyx-700 border-t-bronze-500 rounded-full animate-spin"></div>
              </div>
          </Layout>
      );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center relative overflow-hidden">
          <div className="w-20 h-20 bg-green-900/30 text-green-500 border border-green-800 rounded-full flex items-center justify-center mb-8 text-4xl">
             ✓
          </div>
          <h2 className="text-3xl font-heading text-onyx-100 mb-4 tracking-tight">תודה רבה!</h2>
          <p className="text-onyx-400 text-lg max-w-md mb-10 leading-relaxed">
                המשוב שלך התקבל בהצלחה. <br/>
                התשובות יעזרו ל-{userName} לדייק את הדרך לצמיחה.
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
            <div className="max-w-md mx-auto mt-12 text-center p-8 glass-panel">
                <h2 className="text-xl font-bold text-red-500 mb-2">שגיאה</h2>
                <p className="text-onyx-300 mb-6">{error}</p>
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
            <div className="inline-block px-4 py-1 bg-onyx-800 border border-onyx-700 rounded-full text-bronze-400 text-xs font-bold uppercase tracking-widest mb-4">
                משוב 360 אנונימי
            </div>
            <h1 className="text-3xl md:text-5xl font-heading text-onyx-100 mb-4">
               עבור {userName}
            </h1>
            <p className="text-onyx-400 text-lg">
                דעתך חשובה לנו ועוזרת לייצר שינוי אמיתי.
            </p>
        </div>

        <div className="glass-panel p-8 md:p-12 relative overflow-hidden">
            
            <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* Introduction - THE USER GOAL */}
                {userGoal && (
                    <div className="bg-onyx-900/50 border border-onyx-700 p-6 rounded relative">
                         <div className="absolute -top-3 right-4 bg-onyx-900 text-bronze-500 px-2 text-xs font-bold uppercase tracking-widest border border-onyx-700 rounded">
                             המטרה ש-{userName} הציב/ה
                         </div>
                         <p className="text-xl font-medium text-onyx-200 italic leading-relaxed">
                             "{userGoal}"
                         </p>
                    </div>
                )}

                {/* Relationship */}
                <div>
                    <label className="block text-sm font-bold text-onyx-400 uppercase tracking-widest mb-3">
                        מה הקשר המקצועי שלך?
                    </label>
                    <div className="relative group">
                        <select 
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                            className="dark-input appearance-none cursor-pointer"
                        >
                            <option value="peer">אני קולגה / עמית</option>
                            <option value="manager">אני מנהל/ת ישיר/ה</option>
                            <option value="subordinate">אני כפיף/ה</option>
                            <option value="friend">אני חבר/ה</option>
                            <option value="other">ממשק עבודה אחר</option>
                        </select>
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-onyx-500 group-hover:text-bronze-400 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {/* Q1 */}
                <div className="space-y-4">
                    <label className="block text-xl md:text-2xl font-heading font-normal text-onyx-100 leading-relaxed">
                        1. האם לדעתך <span className="text-bronze-500 font-medium underline decoration-bronze-500/30 underline-offset-4">המטרה שהוצגה</span> תקפיץ אותו/ה מדרגה?
                    </label>
                    <p className="text-onyx-400 text-sm">
                        (האם את/ה רוצה לדייק או להרחיב? ניתן לנסח מחדש את המטרה אם לדעתך נדרש כיוון אחר)
                    </p>
                    <textarea
                        required
                        value={q1}
                        onChange={(e) => setQ1(e.target.value)}
                        rows={4}
                        className="dark-input min-h-[140px] text-lg"
                        placeholder="לדעתי המטרה..."
                    />
                </div>

                {/* Q2 */}
                <div className="space-y-4">
                    <label className="block text-xl md:text-2xl font-heading font-normal text-onyx-100 leading-relaxed">
                        2. אילו התנהגויות קיימות כיום מעכבות אותו/ה או סותרות את השינוי הזה?
                    </label>
                    <textarea
                        required
                        value={q2}
                        onChange={(e) => setQ2(e.target.value)}
                        rows={4}
                        className="dark-input min-h-[140px] text-lg"
                        placeholder="לדוגמה: כשהוא/היא..."
                    />
                </div>

                <div className="pt-8 text-center border-t border-onyx-700/50">
                    <Button type="submit" variant="primary" isLoading={isSending} className="w-full md:w-2/3 text-lg py-4">
                        שלח משוב
                    </Button>
                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-onyx-500 uppercase tracking-widest opacity-60">
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