import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export const Survey: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userName, setUserName] = useState<string>('');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [fatalError, setFatalError] = useState(false); // If true, hide form
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
        setIsLoadingUser(true);
        setFatalError(false);
        setError('');

        if (userId) {
            try {
                // Try to get user name (checks cloud then local)
                const name = await storageService.getUserNameById(userId);
                if (name) {
                    setUserName(name);
                } else {
                    // Critical: User not found in Cloud OR Local
                    setFatalError(true);
                    if (!storageService.isCloudEnabled()) {
                        setError('לא ניתן למצוא את המשתמש. כיוון שהאפליקציה אינה מחוברת לענן, ניתן למלא את השאלון רק במכשיר שבו נוצר הקישור.');
                    } else {
                        setError('לא נמצא משתמש כזה במערכת. ייתכן והקישור שגוי.');
                    }
                }
            } catch (e) {
                setFatalError(true);
                setError('שגיאה בטעינת פרטי המשתמש.');
            }
        } else {
            setFatalError(true);
            setError('קישור לא תקין: חסר מזהה משתמש.');
        }
        setIsLoadingUser(false);
    };
    checkConnection();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setIsSending(true);
    setError('');

    try {
        await storageService.addResponse(userId, q1, q2);
        setSubmitted(true);
    } catch (err: any) {
        console.error(err);
        setError('אירעה שגיאה בשמירה.');
    } finally {
        setIsSending(false);
    }
  };

  if (isLoadingUser) {
      return (
          <Layout>
              <div className="flex justify-center items-center h-64 animate-fade-in">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="text-slate-500">טוען שאלון...</div>
                  </div>
              </div>
          </Layout>
      );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center flex-grow max-w-md mx-auto text-center space-y-6 animate-fade-in py-12">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm">
            ✓
          </div>
          <h2 className="text-3xl font-bold text-slate-800">תודה רבה!</h2>
          <p className="text-slate-600 text-lg">
            התשובות שלך נשמרו בהצלחה ויעזרו ל{userName} לצמוח.
          </p>
          
          {!storageService.isCloudEnabled() && (
             <div className="bg-amber-50 text-amber-800 text-sm p-4 rounded-xl border border-amber-200 mt-4 mx-4">
                 <strong>שים לב:</strong> התשובה נשמרה מקומית על מכשיר זה (מצב הדגמה).
             </div>
          )}

          <div className="pt-8 w-full">
            <Link to="/">
              <Button variant="outline" className="w-full">צור שאלון משלך</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (fatalError) {
      return (
        <Layout>
            <div className="max-w-md mx-auto mt-10 p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-xl shadow-slate-200/50 animate-fade-in">
                <div className="text-5xl mb-6">🧐</div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">לא הצלחנו לפתוח את השאלון</h2>
                <p className="text-slate-600 mb-6 leading-relaxed">{error}</p>
                
                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-500 text-right mb-6" dir="rtl">
                    <strong>למה זה קורה?</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>הקישור לא הועתק במלואו</li>
                        <li>המשתמש לא קיים במערכת</li>
                        <li>האפליקציה פועלת ללא חיבור ענן (Firebase) ומנסה לגשת ממיקום אחר</li>
                    </ul>
                </div>

                <Link to="/">
                    <Button className="w-full">חזרה לדף הבית</Button>
                </Link>
            </div>
        </Layout>
      );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto w-full space-y-8 animate-fade-in pb-12">
        
        {!storageService.isCloudEnabled() && (
            <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded shadow-sm text-right">
                <p className="text-blue-800 text-sm font-medium">
                    ℹ️ מצב מקומי: התשובות יישמרו רק על המכשיר הזה.
                </p>
            </div>
        )}

        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl shadow-indigo-100/50 border border-white">
          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              OBT AI 360
            </h1>
            <div className="inline-block bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-medium text-sm md:text-base">
              פידבק עבור: {userName}
            </div>
            <p className="text-slate-500 text-sm mt-4 max-w-md mx-auto">
              התשובות אנונימיות לחלוטין. ה-AI ינתח אותן כדי למצוא את הדבר האחד שצריך לשנות.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Question 1 */}
            <div className="space-y-3">
              <label className="block text-lg font-bold text-slate-800">
                1. מהו <span className="text-indigo-600 border-b-2 border-indigo-200">הדבר האחד</span> (One Big Thing) שאם {userName} ישנה אותו, זה יקפיץ אותו/ה קדימה?
              </label>
              <textarea
                required
                value={q1}
                onChange={(e) => setQ1(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none shadow-sm"
                placeholder="נסה/י להיות ספציפי/ת וכנה..."
              />
            </div>

            {/* Question 2 */}
            <div className="space-y-3">
              <label className="block text-lg font-bold text-slate-800">
                2. אילו פעולות {userName} עושה (או לא עושה) היום שסותרות את אותו הדבר?
              </label>
              <textarea
                required
                value={q2}
                onChange={(e) => setQ2(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none shadow-sm"
                placeholder="למשל: הוא נמנע מ... או היא נוטה ל..."
              />
            </div>

            {error && (
                <div className="text-rose-600 bg-rose-50 p-3 rounded-lg text-sm text-center font-medium">
                    {error}
                </div>
            )}

            <div className="pt-4">
              <Button type="submit" isLoading={isSending} className="w-full text-lg shadow-lg shadow-indigo-500/20 py-4">
                שלח משוב אנונימי
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};