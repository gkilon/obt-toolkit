import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { User } from '../types';

export const Landing: React.FC = () => {
  const [isRegister, setIsRegister] = useState(true);
  
  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cloudEnabled, setCloudEnabled] = useState(false);
  
  // Auto-detected user (but we won't block the UI with it)
  const [detectedUser, setDetectedUser] = useState<User | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    storageService.init();
    setCloudEnabled(storageService.isCloudEnabled());

    const user = storageService.getCurrentUser();
    if (user) {
      setDetectedUser(user);
    }
  }, []);

  const handleQuickLogin = () => {
      navigate('/dashboard');
  };

  const handleLogoutAndReset = () => {
      storageService.logout();
      setDetectedUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isRegister && !name.trim()) return;
    
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        // Registration flow
        await storageService.registerUser(name, email, password);
        navigate('/dashboard');
      } else {
        // Login flow
        const user = await storageService.login(email, password);
        if (user) {
          navigate('/dashboard');
        } else {
           setError('שם המשתמש (אימייל) או הסיסמה שגויים.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'אירעה שגיאה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center flex-grow max-w-2xl mx-auto w-full text-center space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            OBT AI 360 <br />
            <span className="text-indigo-600">גלה את הדבר האחד שמעכב אותך</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
            מערכת מקצועית לניתוח פידבק 360 באמצעות AI.
            <br/>
            צור חשבון, קבל קישור אישי, וגלה תובנות אמיתיות.
          </p>

          {!cloudEnabled && (
             <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 inline-block text-sm font-bold">
                 ⚠️ אין חיבור לענן (Firebase). המערכת לא תעבוד כשורה.
             </div>
          )}
        </div>

        {/* Detected User Banner (If exists, shows a quick link, but DOES NOT block the form) */}
        {detectedUser && (
            <div className="w-full max-w-md bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
                <div className="text-right">
                    <div className="text-xs text-indigo-500 uppercase font-bold">זוהה משתמש קודם</div>
                    <div className="font-bold text-slate-800">{detectedUser.name}</div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleLogoutAndReset}
                        className="text-xs text-slate-500 hover:text-slate-800 underline px-2"
                    >
                        התנתק
                    </button>
                    <button 
                        onClick={handleQuickLogin}
                        className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
                    >
                        המשך
                    </button>
                </div>
            </div>
        )}

        {/* Main Auth Form */}
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-indigo-100 border border-white relative">
          
            {/* Tabs */}
            <div className="flex mb-6 border-b border-slate-100">
                <button 
                    className={`flex-1 pb-3 text-sm font-medium transition-colors ${isRegister ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    onClick={() => { setIsRegister(true); setError(''); }}
                >
                    יצירת חשבון חדש
                </button>
                <button 
                    className={`flex-1 pb-3 text-sm font-medium transition-colors ${!isRegister ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    onClick={() => { setIsRegister(false); setError(''); }}
                >
                    כניסה למנויים
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="text-right space-y-4">
                
                {/* Name Field - Only for Register */}
                {isRegister && (
                    <div className="animate-fade-in">
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                        שם מלא (יופיע בשאלון)
                        </label>
                        <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="לדוגמה: ישראל ישראלי"
                        required={isRegister}
                        />
                    </div>
                )}

                {/* Email Field - Always visible */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    כתובת אימייל
                    </label>
                    <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="your@email.com"
                    required
                    />
                </div>

                {/* Password Field - Always visible */}
                <div>
                    <label htmlFor="pass" className="block text-sm font-medium text-slate-700 mb-1">
                    סיסמה
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

                <Button type="submit" className="w-full text-lg font-bold" isLoading={isLoading}>
                {isRegister ? 'הירשם והתחל' : 'התחבר למערכת'}
                </Button>
            </form>
        </div>
      </div>
    </Layout>
  );
};