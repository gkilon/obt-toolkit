import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export const Survey: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userName, setUserName] = useState<string>('טוען...');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (userId) {
      storageService.getUserNameById(userId).then(name => {
          setUserName(name);
      });
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setIsSending(true);
    try {
        await storageService.addResponse(userId, q1, q2);
        setSubmitted(true);
    } catch (error) {
        alert('אירעה שגיאה בשליחת הטופס. אנא נסה שוב.');
    } finally {
        setIsSending(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center flex-grow max-w-md mx-auto text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-4">
            ✓
          </div>
          <h2 className="text-3xl font-bold text-slate-800">תודה רבה!</h2>
          <p className="text-slate-600">
            התשובות שלך נשמרו בהצלחה {storageService.isCloudEnabled() ? '' : '(באופן מקומי)'} ויעזרו ל{userName} לצמוח.
          </p>
          
          {!storageService.isCloudEnabled() && (
              <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-800 border border-amber-100">
                  ⚠️ שים לב: האפליקציה במצב הדגמה. הנתונים נשמרו בדפדפן שלך ולא ישלחו ל{userName} אלא אם כן תשלח אותם ידנית.
              </div>
          )}

          <div className="pt-8 border-t w-full border-slate-200">
            <p className="text-sm text-slate-500 mb-4">רוצה ליצור שאלון משלך?</p>
            <Link to="/">
              <Button variant="outline" className="w-full">צור שאלון OBT AI 360</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-indigo-100 border border-white">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              OBT AI 360 - פידבק עבור <span className="text-indigo-600">{userName}</span>
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              התשובות שלך אנונימיות לחלוטין. כנות היא המפתח לצמיחה.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Question 1 */}
            <div className="space-y-3">
              <label className="block text-lg font-medium text-slate-800">
                1. מהו הדבר האחד (One Big Thing) שאם {userName} ישנה אותו, זה יקפיץ אותו/ה קדימה?
              </label>
              <textarea
                required
                value={q1}
                onChange={(e) => setQ1(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                placeholder="נסה/י להיות ספציפי/ת..."
              />
            </div>

            {/* Question 2 */}
            <div className="space-y-3">
              <label className="block text-lg font-medium text-slate-800">
                2. אילו פעולות {userName} עושה (או לא עושה) היום שסותרות את אותו הדבר?
              </label>
              <textarea
                required
                value={q2}
                onChange={(e) => setQ2(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                placeholder="למשל: הוא נמנע מ... או היא נוטה ל..."
              />
            </div>

            <div className="pt-4">
              <Button type="submit" isLoading={isSending} className="w-full text-lg shadow-lg shadow-indigo-200">
                שלח משוב אנונימי
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};