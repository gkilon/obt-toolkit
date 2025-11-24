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
                    setError('קישור לא תקין.');
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
              <div className="flex justify-center items-center h-64 animate-fade-in">
                 <div className="w-1 h-16 bg-bronze-500 animate-pulse"></div>
              </div>
          </Layout>
      );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="glass-panel rounded-2xl flex flex-col items-center justify-center max-w-lg mx-auto text-center py-20 px-6 animate-fade-in shadow-2xl">
          <div className="text-6xl text-emerald-500 mb-6 drop-shadow-md">✓</div>
          <h2 className="text-3xl font-serif font-bold text-ink mb-6">תודה על הכנות</h2>
          <p className="text-slate-600 text-lg font-light leading-relaxed max-w-md">
                המשוב שלך נקלט בהצלחה ויישמר באנונימיות מוחלטת. תרומתך תסייע ל-{userName} בתהליך הצמיחה.
          </p>
          <div className="mt-12">
            <Link to="/">
                <Button variant="secondary">חזרה לדף הבית</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
      return (
        <Layout>
            <div className="glass-panel max-w-md mx-auto mt-20 text-center animate-fade-in p-10 rounded-xl">
                <h2 className="text-xl font-bold text-rose-700 mb-4">שגיאת מערכת</h2>
                <p className="text-slate-600 mb-8">{error}</p>
                <Link to="/">
                    <Button variant="secondary">חזרה</Button>
                </Link>
            </div>
        </Layout>
      );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto w-full animate-fade-in">
        
        {/* Document Header */}
        <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-bronze-300 block mb-3">טופס משוב דיסקרטי</span>
            <h1 className="text-4xl md:text-5xl font-serif font-black text-white drop-shadow-lg">
              {userName}
            </h1>
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-2xl shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-bronze-800 to-bronze-500"></div>

            <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* Context */}
                <div className="text-center bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <p className="text-slate-500 font-serif italic text-lg mb-4">
                        "מהו הקשר המקצועי שלך למוערך?"
                    </p>
                    <div className="inline-block relative w-full max-w-xs">
                        <select 
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                            className="w-full appearance-none bg-white border border-slate-200 rounded-lg py-3 px-4 text-ink font-bold text-lg focus:outline-none focus:border-bronze-600 focus:ring-2 focus:ring-bronze-100 cursor-pointer text-center transition-all"
                        >
                            <option value="peer">אני קולגה / עמית</option>
                            <option value="manager">אני מנהל/ת ישיר/ה</option>
                            <option value="subordinate">אני כפיף/ה</option>
                            <option value="friend">אני חבר/ה</option>
                            <option value="other">ממשק עבודה אחר</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                        </div>
                    </div>
                </div>

                {/* Q1 */}
                <div className="group">
                <label className="block text-xl md:text-2xl font-serif font-bold text-ink mb-4 leading-relaxed">
                    1. מהו <span className="text-bronze-600 underline decoration-bronze-300 decoration-4 underline-offset-4">הדבר האחד</span> (One Big Thing) שאם ישונה, יקפיץ את האדם הזה קדימה?
                </label>
                <textarea
                    required
                    value={q1}
                    onChange={(e) => setQ1(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:border-bronze-500 focus:ring-2 focus:ring-bronze-100 outline-none transition-all text-lg text-ink placeholder-slate-400 resize-none p-4 font-sans"
                    placeholder="התשובה שלך..."
                />
                </div>

                {/* Q2 */}
                <div className="group">
                <label className="block text-xl md:text-2xl font-serif font-bold text-ink mb-4 leading-relaxed">
                    2. אילו התנהגויות קיימות כיום מעכבות או סותרות את השינוי הזה?
                </label>
                <textarea
                    required
                    value={q2}
                    onChange={(e) => setQ2(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:border-bronze-500 focus:ring-2 focus:ring-bronze-100 outline-none transition-all text-lg text-ink placeholder-slate-400 resize-none p-4 font-sans"
                    placeholder="התשובה שלך..."
                />
                </div>

                <div className="pt-4 text-center">
                <Button type="submit" variant="gold" isLoading={isSending} className="w-full md:w-auto min-w-[200px] text-lg py-4 shadow-xl">
                    שליחת משוב
                </Button>
                <p className="mt-4 text-xs text-slate-400 font-bold tracking-wide">
                    🔒 המשוב הינו אנונימי לחלוטין.
                </p>
                </div>
            </form>
        </div>
      </div>
    </Layout>
  );
};
