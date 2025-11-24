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
                // Must fetch from cloud
                const name = await storageService.getUserNameById(userId);
                if (name) {
                    setUserName(name);
                } else {
                    setError('הקישור אינו תקין או שהמשתמש אינו קיים.');
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
        setError('אירעה שגיאה בשמירה. אנא נסה שוב.');
    } finally {
        setIsSending(false);
    }
  };

  if (isLoadingUser) {
      return (
          <Layout>
              <div className="flex justify-center items-center h-64 animate-fade-in">
                 <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
              </div>
          </Layout>
      );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-8 animate-slide-up py-16">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-5xl shadow-sm mb-2">
            ✓
          </div>
          <div>
            <h2 className="text-4xl font-serif font-bold text-slate-800 mb-4">תודה רבה</h2>
            <p className="text-slate-600 text-lg font-light leading-relaxed">
                הכנות שלך מוערכת מאוד. התשובות נשמרו בהצלחה באופן אנונימי ויעזרו ל-{userName} לקפוץ קדימה.
            </p>
          </div>
          <Link to="/">
              <Button variant="outline" className="mt-8">חזרה לדף הבית</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (error) {
      return (
        <Layout>
            <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-xl text-center shadow-lg animate-fade-in border-t-4 border-rose-500">
                <h2 className="text-xl font-bold text-slate-800 mb-2">שגיאה</h2>
                <p className="text-slate-600">{error}</p>
                <Link to="/">
                    <Button variant="secondary" className="mt-6 w-full">חזרה</Button>
                </Link>
            </div>
        </Layout>
      );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto w-full animate-fade-in pb-12">
        
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 relative">
          
          <div className="text-center mb-12">
            <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">
              משוב מקדם ובונה
            </h1>
            <div className="inline-block bg-slate-100 text-slate-800 px-6 py-2 rounded-full font-medium text-sm tracking-wide">
              עבור: {userName}
            </div>
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100/50">
                 <p className="text-amber-800 text-sm font-medium">
                    🔒 המשוב הינו אנונימי לחלוטין ומנותח על ידי בינה מלאכותית.
                 </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* Relationship */}
            <div className="space-y-2 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <label className="block text-lg font-serif font-bold text-slate-800">
                    אני עבור {userName}...
                </label>
                <select 
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as RelationshipType)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:border-amber-400 outline-none transition-all"
                >
                    <option value="peer">קולגה / עמית לעבודה</option>
                    <option value="manager">מנהל/ת ישיר/ה</option>
                    <option value="subordinate">כפיף/ה (מנוהל/ת ע"י {userName})</option>
                    <option value="friend">חבר/ה או בן/בת משפחה</option>
                    <option value="other">אחר / ממשק עבודה אחר</option>
                </select>
            </div>

            {/* Question 1 */}
            <div className="space-y-4">
              <label className="block text-xl font-serif font-bold text-slate-800 leading-relaxed">
                1. מהו <span className="text-amber-600 border-b-2 border-amber-200/50 pb-1">הדבר האחד</span> (One Big Thing) שאם {userName} ישנה אותו, זה <span className="text-emerald-600 font-bold">יקפיץ אותו/ה משמעותית קדימה</span>?
              </label>
              <textarea
                required
                value={q1}
                onChange={(e) => setQ1(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all resize-none text-lg"
                placeholder="תן דוגמה ספציפית ובונה..."
              />
            </div>

            {/* Question 2 */}
            <div className="space-y-4">
              <label className="block text-xl font-serif font-bold text-slate-800">
                2. אילו התנהגויות או פעולות קיימות כיום סותרות את אותו השינוי?
              </label>
              <textarea
                required
                value={q2}
                onChange={(e) => setQ2(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all resize-none text-lg"
                placeholder="למשל: נטייה להימנע מ..."
              />
            </div>

            <div className="pt-6">
              <Button type="submit" variant="gold" isLoading={isSending} className="w-full py-4 text-lg font-bold shadow-xl shadow-amber-500/10">
                שלח משוב
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};