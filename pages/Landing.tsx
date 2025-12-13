import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export const Landing: React.FC = () => {
  const [view, setView] = useState<'login' | 'register' | 'reset'>('login');
  
  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('OBT-VIP'); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Connection State
  const [offlineMode, setOfflineMode] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    storageService.init();
    const isConnected = storageService.isCloudEnabled();
    
    if (!isConnected) {
        setOfflineMode(true);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
        await storageService.loginWithGoogle();
        navigate('/dashboard');
    } catch (err: any) {
        console.warn("Google login failed, forcing guest mode.");
        // If Google fails, try Guest mode silently
        try {
            await storageService.loginAsGuest();
            navigate('/dashboard');
        } catch (e) {
            setError("התחברות נכשלה.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
      setIsLoading(true);
      await storageService.loginAsGuest();
      setIsLoading(false);
      navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (offlineMode) throw new Error("המערכת במצב אופליין. ניתן להיכנס כאורח בלבד.");

      if (view === 'register') {
        if (!name || !email || !password || !registrationCode) throw new Error("נא למלא את כל השדות");
        await storageService.registerUser(name, email, password, registrationCode);
        navigate('/dashboard');
      } 
      else if (view === 'login') {
        if (!email || !password) throw new Error("נא למלא אימייל וסיסמה");
        await storageService.login(email, password);
        navigate('/dashboard');
      }
      else if (view === 'reset') {
         if (!email || !registrationCode || !password) throw new Error("חסרים פרטים לשיחזור");
         await storageService.resetPassword(email, registrationCode, password);
         setSuccessMsg("הסיסמה עודכנה. אפשר להתחבר.");
         setTimeout(() => setView('login'), 2000);
      }
    } catch (err: any) {
      console.error("Submit Error:", err);
      if (err.message.includes("auth")) setError("פרטים שגויים.");
      else setError(err.message || 'אירעה שגיאה.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-12 relative">
        
        {/* Connection Status Banner */}
        {offlineMode && (
             <div className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4">
                 <div className="bg-amber-900/90 border border-amber-500 text-amber-100 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-xl flex items-center gap-3">
                     <span className="text-xl">⚠️</span>
                     <div>
                         <p className="font-bold text-sm">מצב אופליין (הדגמה)</p>
                         <p className="text-xs opacity-80">לא זוהה חיבור לענן. הנתונים יישמרו מקומית בלבד.</p>
                     </div>
                 </div>
             </div>
        )}

        {/* Header */}
        <div className="text-center mb-12 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary-500/20 rounded-full blur-[50px]"></div>
            <h1 className="relative text-5xl md:text-6xl font-heading font-bold text-white mb-4 tracking-tight">
                One Big <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Thing</span>
            </h1>
            <p className="relative text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
               פלטפורמת 360° חכמה לזיהוי מנוע הצמיחה המרכזי שלך.
            </p>
        </div>

        {/* Glass Card */}
        <div className="glass-panel w-full max-w-[420px] p-8 md:p-10 rounded-2xl relative overflow-hidden">
            
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-heading font-semibold text-white">
                    {view === 'register' ? 'הצטרפות למערכת' : view === 'reset' ? 'שחזור גישה' : 'כניסה למנויים'}
                </h2>
                {view === 'login' && <p className="text-xs text-slate-500 mt-2">התחבר כדי לראות את המשובים שלך</p>}
            </div>

            <div className="space-y-6">
                
                {view === 'login' && (
                    <div className="space-y-3">
                        {/* Google Login - Disabled in offline mode to prevent confusion */}
                        <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading || offlineMode}
                            className={`w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-medium py-3 px-4 rounded-xl transition-all active:scale-[0.98] group ${offlineMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>כניסה מהירה עם Google</span>
                        </button>

                        <button 
                            type="button"
                            onClick={handleGuestLogin}
                            disabled={isLoading}
                            className="w-full text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest border border-white/10 hover:bg-white/5 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {offlineMode ? 'כניסה למצב דמו (ללא שמירה)' : 'כניסה לאורחים (מצב הדגמה)'}
                        </button>
                        
                        {!offlineMode && (
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink-0 mx-3 text-slate-500 text-[10px] uppercase tracking-widest">או עם סיסמה</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>
                        )}
                    </div>
                )}

                {/* Email/Password Form - Only if online */}
                {!offlineMode && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {view === 'register' && (
                            <div>
                                <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="dark-input"
                                placeholder="שם מלא"
                                />
                            </div>
                        )}

                        <div>
                            <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="dark-input text-left"
                            dir="ltr"
                            placeholder="כתובת אימייל"
                            />
                        </div>

                        {(view === 'register' || view === 'reset') && (
                            <div>
                                <div className="relative group">
                                    <input
                                    type="text"
                                    value={registrationCode}
                                    onChange={(e) => setRegistrationCode(e.target.value)}
                                    className="dark-input font-mono text-center tracking-widest uppercase text-primary-400 border-primary-500/30 bg-primary-500/5"
                                    placeholder="קוד הצטרפות"
                                    dir="ltr"
                                    />
                                    <div className="absolute -bottom-5 right-0 w-full text-center">
                                        <span className="text-[10px] text-slate-500">קוד ברירת מחדל: OBT-VIP</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={view === 'register' || view === 'reset' ? 'mt-6' : ''}>
                            <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="dark-input text-left"
                            dir="ltr"
                            placeholder={view === 'reset' ? 'סיסמה חדשה' : 'סיסמה'}
                            />
                        </div>

                        {error && <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 p-2 rounded text-center">{error}</p>}
                        {successMsg && <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-center">{successMsg}</p>}

                        <div className="pt-2">
                            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                                {view === 'register' ? 'צור חשבון' : view === 'reset' ? 'עדכן' : 'כניסה'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            {!offlineMode && (
                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-3 text-sm">
                    {view === 'login' && (
                        <>
                            <button onClick={() => setView('reset')} className="text-slate-400 hover:text-white transition-colors">
                                שכחתי סיסמה
                            </button>
                            <div className="text-slate-500">
                                אין לך חשבון? <button onClick={() => setView('register')} className="text-primary-400 font-medium hover:text-primary-300 transition-colors">הרשמה</button>
                            </div>
                        </>
                    )}
                    {(view === 'register' || view === 'reset') && (
                        <button onClick={() => setView('login')} className="text-slate-400 hover:text-white transition-colors">
                            חזרה לכניסה
                        </button>
                    )}
                </div>
            )}
        </div>
        
        <div className="mt-8 opacity-40 hover:opacity-100 transition-opacity">
            <Link to="/admin" className="text-xs text-slate-500 uppercase tracking-widest hover:text-white">Admin Access</Link>
        </div>
      </div>
    </Layout>
  );
};