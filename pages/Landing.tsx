import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { FirebaseConfig } from '../types';

export const Landing: React.FC = () => {
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [fbConfig, setFbConfig] = useState<string>('');

  const navigate = useNavigate();

  useEffect(() => {
    const user = storageService.getCurrentUser();
    if (user) {
      navigate('/dashboard');
    }
    const existingConfig = storageService.getFirebaseConfig();
    if (existingConfig) {
        setFbConfig(JSON.stringify(existingConfig, null, 2));
    }
  }, [navigate]);

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
          setError('שם משתמש או סיסמה שגויים, או שהחיבור למסד הנתונים נכשל.');
        }
      }
    } catch (err) {
      setError('אירעה שגיאה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = () => {
      try {
          const config: FirebaseConfig = JSON.parse(fbConfig);
          storageService.saveFirebaseConfig(config);
          setShowSettings(false);
          alert('הגדרות נשמרו בהצלחה! כעת הנתונים יסונכרנו לענן.');
      } catch (e) {
          alert('פורמט JSON לא תקין. אנא וודא שהעתקת את כל האובייקט.');
      }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center flex-grow max-w-2xl mx-auto w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            גלה את הצעד הבא שלך <br />
            <span className="text-indigo-600">בעזרת פידבק כנה</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
            מערכת <b>OBT AI 360</b> לזיהוי ה"דבר האחד" שמעכב אותך.
            {!storageService.isCloudEnabled() && (
                <span className="block text-sm text-amber-600 mt-2 font-bold bg-amber-50 p-2 rounded-lg">
                    ⚠️ מצב הדגמה (ללא סנכרון ענן). לחץ על גלגל השיניים להגדרת בסיס נתונים.
                </span>
            )}
          </p>
        </div>

        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-indigo-100 border border-white relative">
          
          {/* Settings Toggle */}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="absolute top-4 left-4 text-slate-400 hover:text-indigo-600 transition-colors"
            title="הגדרות מסד נתונים"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {showSettings ? (
              <div className="text-right space-y-4 animate-fade-in">
                  <h3 className="font-bold text-lg">הגדרת בסיס נתונים (Firebase)</h3>
                  <p className="text-xs text-slate-500">
                      כדי לשמור נתונים בענן, צור פרויקט ב-Firebase והדבק כאן את אובייקט הקונפיגורציה.
                      (Project settings -> General -> Your apps -> SDK setup and configuration -> Config)
                  </p>
                  <textarea
                    value={fbConfig}
                    onChange={(e) => setFbConfig(e.target.value)}
                    className="w-full h-32 text-xs font-mono p-2 border rounded bg-slate-50 text-left"
                    placeholder='{ "apiKey": "...", "authDomain": "...", ... }'
                  />
                  <div className="flex gap-2">
                    <Button onClick={saveConfig} className="w-full text-sm">שמור הגדרות</Button>
                    <Button variant="outline" onClick={() => setShowSettings(false)} className="w-full text-sm">ביטול</Button>
                  </div>
              </div>
          ) : (
              <>
                <div className="flex mb-6 border-b border-slate-100">
                    <button 
                        className={`flex-1 pb-2 text-sm font-medium transition-colors ${isRegister ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
                        onClick={() => setIsRegister(true)}
                    >
                        הרשמה
                    </button>
                    <button 
                        className={`flex-1 pb-2 text-sm font-medium transition-colors ${!isRegister ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
                        onClick={() => setIsRegister(false)}
                    >
                        כניסה
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
                        placeholder="ישראל ישראלי"
                        required
                        />
                    </div>
                    <div>
                        <label htmlFor="pass" className="block text-sm font-medium text-slate-700 mb-1">
                        סיסמה {isRegister ? '(ליצירת המשתמש)' : ''}
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

                    {error && <p className="text-rose-500 text-sm">{error}</p>}

                    <Button type="submit" className="w-full text-lg" isLoading={isLoading}>
                    {isRegister ? 'צור חשבון והתחל' : 'התחבר לאזור אישי'}
                    </Button>
                </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};