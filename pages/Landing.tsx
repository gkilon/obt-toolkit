import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

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
                 <div className="bg-bronze-900/90 border border-bronze-500 text-bronze-100 px-6 py-3 rounded shadow-lg backdrop-blur-xl flex items-center gap-3">
                     <span className="text-xl">⚠️</span>
                     <div>
                         <p className="font-medium text-sm">מצב אופליין (הדגמה)</p>
                         <p className="text-xs opacity-80">לא זוהה חיבור לענן. הנתונים יישמרו מקומית בלבד.</p>
                     </div>
                 </div>
             </div>
        )}

        {/* Header */}
        <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-heading font-normal text-onyx-100 mb-4 tracking-tight">
                One Big <span className="text-bronze-500 font-medium">Thing</span>
            </h1>
            <p className="text-lg text-onyx-400 max-w-md mx-auto leading-relaxed">
               פלטפורמת 360° חכמה לזיהוי מנוע הצמיחה המרכזי שלך.
            </p>
        </div>

        {/* Card */}
        <div className="glass-panel w-full max-w-[400px]">
            
            <div className="mb-8 text-center border-b border-onyx-700/50 pb-6">
                <h2 className="text-xl font-heading text-onyx-100">
                    {view === 'register' ? 'הצטרפות למערכת' : view === 'reset' ? 'שחזור גישה' : 'כניסה למנויים'}
                </h2>
                {view === 'login' && <p className="text-xs text-onyx-500 mt-2">התחבר כדי לראות את המשובים שלך</p>}
            </div>

            <div className="space-y-6">
                
                {view === 'login' && ALLOW_GUEST_MODE && (
                    <button 
                        type="button"
                        onClick={handleGuestLogin}
                        disabled={isLoading}
                        className="w-full text-xs font-bold text-onyx-400 hover:text-onyx-100 uppercase tracking-widest border border-onyx-700 hover:bg-onyx-700 py-3 rounded transition-all"
                    >
                        {offlineMode ? 'כניסה למצב דמו' : 'כניסה לאורחים'}
                    </button>
                )}

                {/* Email/Password Form */}
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
                                    className="dark-input font-mono text-center tracking-widest uppercase text-bronze-400 border-bronze-500/30 bg-bronze-900/10 focus:border-bronze-500"
                                    placeholder="קוד הצטרפות"
                                    dir="ltr"
                                    />
                                </div>
                                <p className="text-[10px] text-onyx-500 mt-1 mr-1">נדרש קוד אירגוני לפתיחת משתמש</p>
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

                        {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/30 p-2 rounded text-center">{error}</p>}
                        {successMsg && <p className="text-green-400 text-sm bg-green-900/20 border border-green-900/30 p-2 rounded text-center">{successMsg}</p>}

                        <div className="pt-2">
                            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                                {view === 'register' ? 'צור חשבון' : view === 'reset' ? 'עדכן סיסמה' : 'כניסה'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            {!offlineMode && (
                <div className="mt-8 pt-6 border-t border-onyx-700/50 flex flex-col items-center gap-3 text-sm">
                    {view === 'login' && (
                        <>
                            <button onClick={() => setView('reset')} className="text-onyx-500 hover:text-onyx-300 transition-colors text-xs">
                                שכחתי סיסמה
                            </button>
                            <div className="text-onyx-400">
                                אין לך חשבון? <button onClick={() => setView('register')} className="text-bronze-500 font-medium hover:text-bronze-400 transition-colors">הרשמה</button>
                            </div>
                        </>
                    )}
                    {(view === 'register' || view === 'reset') && (
                        <button onClick={() => setView('login')} className="text-onyx-400 hover:text-onyx-200 transition-colors">
                            חזרה לכניסה
                        </button>
                    )}
                </div>
            )}
        </div>
        
        <div className="mt-8 opacity-40 hover:opacity-100 transition-opacity">
            <Link to="/admin" className="text-[10px] text-onyx-600 uppercase tracking-widest hover:text-onyx-300">Admin Access</Link>
        </div>
      </div>
    </Layout>
  );
};