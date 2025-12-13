import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

// SECURITY SETTING:
// Set this to 'true' to allow anyone to try the app without registering.
// Set this to 'false' to force users to have the Registration Code.
const ALLOW_GUEST_MODE = false;

export const Landing: React.FC = () => {
  const [view, setView] = useState<'login' | 'register' | 'reset'>('login');
  
  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState(''); 
  
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
      if (offlineMode && !ALLOW_GUEST_MODE) throw new Error("המערכת באופליין וגישת אורחים חסומה.");
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
                        {/* Google Button REMOVED for security */}
                        
                        {/* Guest Button - Only shown if ALLOW_GUEST_MODE is true */}
                        {ALLOW_GUEST_MODE && (
                            <button 
                                type="button"
                                onClick={handleGuestLogin}
                                disabled={isLoading}
                                className="w-full text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest border border-white/10 hover:bg-white/5 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {offlineMode ? 'כניסה למצב דמו (ללא שמירה)' : 'כניסה לאורחים (מצב הדגמה)'}
                            </button>
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
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1 mr-1">נדרש קוד אירגוני לפתיחת משתמש</p>
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

                        {error && <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 p-2 rounded text-center animate-pulse">{error}</p>}
                        {successMsg && <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-center">{successMsg}</p>}

                        <div className="pt-2">
                            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                                {view === 'register' ? 'צור חשבון' : view === 'reset' ? 'עדכן סיסמה' : 'כניסה'}
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