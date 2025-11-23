import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { User } from '../types';

export const Landing: React.FC = () => {
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [existingUser, setExistingUser] = useState<User | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Force init check when landing loads
    storageService.init();
    setCloudEnabled(storageService.isCloudEnabled());

    const user = storageService.getCurrentUser();
    if (user) {
      setExistingUser(user);
    }
  }, []);

  const handleContinueAsUser = () => {
      navigate('/dashboard');
  };

  const handleSwitchAccount = () => {
      storageService.logout();
      setExistingUser(null);
      setName('');
      setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;
    
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        await storageService.registerUser(name, password);
        navigate('/dashboard');
      } else {
        const user = await storageService.login(name, password);
        if (user) {
          navigate('/dashboard');
        } else {
          // הודעת שגיאה מפורטת יותר
          if (cloudEnabled) {
             setError('שם משתמש או סיסמה שגויים, או שהמשתמש טרם סונכרן לענן.');
          } else {
             setError('שם משתמש או סיסמה שגויים.');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'אירעה שגיאה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  if (existingUser) {
      return (
        <Layout>
            <div className="flex flex-col items-center justify-center flex-grow max-w-lg mx-auto w-full text-center space-y-8 animate-fade-in py-12">
                 <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-3xl mb-2">
                    👋
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800">
                     שלום, {existingUser.name}
                 </h2>
                 <p className="text-slate-600">
                     אתה מחובר כרגע במכשיר זה.
                 </p>
                 <div className="flex flex-col gap-3 w-full">
                     <Button onClick={handleContinueAsUser} className="w-full">
                         המשך ללוח הבקרה
                     </Button>
                     <Button onClick={handleSwitchAccount} variant="outline" className="w-full">
                         התנתק / החלף משתמש
                     </Button>
                 </div>
            </div>
        </Layout>
      );
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center flex-grow max-w-2xl mx-auto w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            OBT AI 360 <br />
            <span className="text-indigo-600">גלה את הדבר האחד שמעכב אותך</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
            מערכת לזיהוי ה"דבר האחד" (One Big Thing) על בסיס פידבק כנה ואנונימי, מנותח על ידי AI.
            {!cloudEnabled ? (
                <span className="block text-sm text-amber-600 mt-2 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200">
                    ⚠️ מצב הדגמה מקומי (ללא סנכרון ענן).<br/>
                    נא לוודא חיבור לאינטרנט לטעינת Firebase.
                </span>
            ) : (
                <span className="block text-sm text-green-600 mt-2 font-bold bg-green-50 p-2 rounded-lg border border-green-200 inline-block">
                     ☁️ מחובר לענן - ניתן לגשת מכל מכשיר
                </span>
            )}
          </p>
        </div>

        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-indigo-100 border border-white relative">
          
            <div className="flex mb-6 border-b border-slate-100">
                <button 
                    className={`flex-1 pb-2 text-sm font-medium transition-colors ${isRegister ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
                    onClick={() => { setIsRegister(true); setError(''); }}
                >
                    הרשמה (יצירת חשבון)
                </button>
                <button 
                    className={`flex-1 pb-2 text-sm font-medium transition-colors ${!isRegister ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
                    onClick={() => { setIsRegister(false); setError(''); }}
                >
                    כניסה לחשבון קיים
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-right space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    שם מלא
                    </label>
                    <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="לדוגמה: ישראל ישראלי"
                    required
                    />
                </div>
                <div>
                    <label htmlFor="pass" className="block text-sm font-medium text-slate-700 mb-1">
                    סיסמה {isRegister ? '(תישמר לכניסה הבאה)' : ''}
                    </label>
                    <input
                    type="password"
                    id="pass"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="********"
                    required
                    />
                </div>
                </div>

                {error && (
                    <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-lg text-right border border-rose-100">
                        {error}
                    </div>
                )}

                <Button type="submit" className="w-full text-lg" isLoading={isLoading}>
                {isRegister ? 'צור חשבון והתחל' : 'התחבר לאזור אישי'}
                </Button>
            </form>
        </div>
      </div>
    </Layout>
  );
};