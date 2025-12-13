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
        setError('שגיאה בשמירה.');
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
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-6 text-4xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
             ✓
          </div>
          <h2 className="text-3xl font-heading font-bold text-white mb-4">תודה רבה!</h2>
          <p className="text-slate-400 text-lg max-w-md mb-8 leading-relaxed">
                המשוב שלך התקבל בהצלחה ועוזר לנו מאוד. התשובות נשמרות באופן אנונימי לחלוטין.
          </p>
          <Link to="/">
              <Button variant="outline">חזרה לדף הבית</Button>
          </Link>
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
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
              משוב 360 עבור {userName}
            </h1>
            <p className="text-slate-400">
                דיסקרטיות מלאה מובטחת. דעתך חשובה לנו.
            </p>
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500"></div>
            
            <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* Relationship */}
                <div>
                    <label className="block text-sm font-bold text-primary-400 uppercase tracking-widest mb-3">
                        מה הקשר המקצועי שלך?
                    </label>
                    <div className="relative">
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
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            ▼
                        </div>
                    </div>
                </div>

                {/* Q1 */}
                <div>
                    <label className="block text-xl font-heading font-medium text-white mb-4 leading-relaxed">
                        1. מהו <span className="text-primary-400 font-bold border-b-2 border-primary-500/50">הדבר האחד</span> (המרכזי ביותר) שאם ישונה, יקפיץ את האדם הזה קדימה?
                    </label>
                    <textarea
                        required
                        value={q1}
                        onChange={(e) => setQ1(e.target.value)}
                        rows={3}
                        className="dark-input min-h-[120px]"
                        placeholder="כתוב כאן בצורה חופשית..."
                    />
                </div>

                {/* Q2 */}
                <div>
                    <label className="block text-xl font-heading font-medium text-white mb-4 leading-relaxed">
                        2. אילו התנהגויות קיימות כיום מעכבות אותו/ה או סותרות את השינוי הזה?
                    </label>
                    <textarea
                        required
                        value={q2}
                        onChange={(e) => setQ2(e.target.value)}
                        rows={3}
                        className="dark-input min-h-[120px]"
                        placeholder="תן דוגמאות אם אפשר..."
                    />
                </div>

                <div className="pt-6 text-center">
                    <Button type="submit" variant="primary" isLoading={isSending} className="w-full md:w-auto min-w-[240px] text-lg py-4 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                        שלח משוב
                    </Button>
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 uppercase tracking-widest">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        <span>המידע מוצפן מקצה לקצה</span>
                    </div>
                </div>
            </form>
        </div>
      </div>
    </Layout>
  );
};