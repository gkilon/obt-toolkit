import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export const Landing: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false); // Default to Login for a cleaner look
  
  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure we start with a clean connection attempt
    storageService.init();
    
    // NOTE: Auto-login logic removed to ensure explicit user identification
    // on every visit, as requested.
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
          throw new Error("אנא מלא את כל שדות החובה");
      }

      if (isRegister) {
        if (!name) throw new Error("אנא הזן שם מלא");
        // Registration flow
        await storageService.registerUser(name, email, password);
        navigate('/dashboard');
      } else {
        // Login flow
        await storageService.login(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      // Clean error message for user
      let msg = err.message;
      if (msg.includes("Firebase") || msg.includes("firestore")) msg = "שגיאת תקשורת עם השרת.";
      setError(msg || 'אירעה שגיאה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
      setIsRegister(!isRegister);
      setError('');
      // Keep email/pass filled if switching, but maybe clear name
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl mx-auto space-y-8 animate-fade-in py-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            OBT AI 360
          </h1>
          <p className="text-xl text-slate-600">
            הכלי המקצועי לניתוח משוב אישי וארגוני.
            <br/>
            <span className="text-base text-slate-500">
                מבוסס Gemini AI לזיהוי "הדבר האחד" שמעכב צמיחה.
            </span>
          </p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-slate-200 border border-slate-100">
          
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                    {isRegister ? 'יצירת חשבון חדש' : 'כניסה למערכת'}
                </h2>
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" title="מחובר לשרת"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Name Field - Only for Register */}
                {isRegister && (
                    <div className="animate-fade-in">
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                        שם מלא
                        </label>
                        <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="ישראל ישראלי"
                        autoComplete="name"
                        />
                    </div>
                )}

                {/* Email Field */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    אימייל
                    </label>
                    <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-left"
                    placeholder="name@company.com"
                    autoComplete="username"
                    dir="ltr"
                    />
                </div>

                {/* Password Field */}
                <div>
                    <label htmlFor="pass" className="block text-sm font-medium text-slate-700 mb-1">
                    סיסמה
                    </label>
                    <input
                    type="password"
                    id="pass"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="********"
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    dir="ltr"
                    />
                </div>

                {error && (
                    <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-lg text-right border border-rose-100 flex items-start gap-2">
                        <span className="mt-0.5">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <Button type="submit" className="w-full text-lg font-bold shadow-indigo-500/20 shadow-lg" isLoading={isLoading}>
                    {isRegister ? 'הירשם' : 'התחבר'}
                </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <span className="text-slate-500 text-sm ml-2">
                    {isRegister ? 'כבר יש לך חשבון?' : 'עדיין אין לך חשבון?'}
                </span>
                <button 
                    onClick={toggleMode}
                    className="text-indigo-600 font-bold text-sm hover:underline"
                >
                    {isRegister ? 'התחבר כאן' : 'הירשם בחינם'}
                </button>
            </div>
        </div>
      </div>
    </Layout>
  );
};