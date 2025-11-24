import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export const Landing: React.FC = () => {
  const [view, setView] = useState<'login' | 'register' | 'reset'>('login');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState(''); // New Master Key Field
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    storageService.init();
    const verifyConnection = async () => {
        setConnectionStatus('checking');
        const isLive = await storageService.testConnection();
        setConnectionStatus(isLive ? 'connected' : 'disconnected');
    };
    verifyConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      // Re-verify connection
      if (connectionStatus !== 'connected') {
          const retry = await storageService.testConnection();
          if (!retry) throw new Error("אין תקשורת לשרת. בדוק חיבור אינטרנט.");
      }

      if (view === 'register') {
        if (!name || !email || !password || !registrationCode) throw new Error("אנא מלא את כל השדות");
        await storageService.registerUser(name, email, password, registrationCode);
        navigate('/dashboard');
      } 
      else if (view === 'login') {
        if (!email || !password) throw new Error("אנא מלא אימייל וסיסמה");
        await storageService.login(email, password);
        navigate('/dashboard');
      }
      else if (view === 'reset') {
         if (!email || !registrationCode || !password) throw new Error("נדרש אימייל, קוד אימות וסיסמה חדשה");
         await storageService.resetPassword(email, registrationCode, password);
         setSuccessMsg("הסיסמה שונתה בהצלחה! כעת ניתן להתחבר.");
         setTimeout(() => setView('login'), 2000);
      }
    } catch (err: any) {
      console.error("Submit Error:", err);
      setError(err.message || 'אירעה שגיאה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mb-12 animate-slide-up">
          <span className="text-amber-600 tracking-[0.3em] text-xs font-bold uppercase">Executive Growth Platform</span>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
             הכלי שלך <span className="text-transparent bg-clip-text gold-gradient">לפריצת דרך</span>
          </h1>
          <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto">
            מערכת 360° חכמה שתעזור לך לזהות את "הדבר האחד" שיקפיץ אותך קדימה, באמצעות ניתוח בינה מלאכותית של פידבק מהסביבה שלך.
          </p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl shadow-slate-200/50 relative overflow-hidden animate-fade-in">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-1 gold-gradient"></div>

            <div className="text-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-slate-800">
                    {view === 'register' ? 'הצטרפות למערכת' : view === 'reset' ? 'שחזור סיסמה' : 'כניסה למנויים'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                   {view === 'register' ? 'נדרש קוד רישום (VIP) להצטרפות' : view === 'reset' ? 'הזן את קוד הרישום לאימות' : 'הזן את פרטי הגישה שלך'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Name - Register only */}
                {view === 'register' && (
                    <div className="animate-fade-in">
                        <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">שם מלא</label>
                        <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 outline-none transition-all"
                        placeholder="ישראל ישראלי"
                        />
                    </div>
                )}

                {/* Email - All views */}
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">אימייל עסקי</label>
                    <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 outline-none transition-all text-left"
                    placeholder="name@company.com"
                    dir="ltr"
                    />
                </div>

                {/* Registration Code - Register & Reset */}
                {(view === 'register' || view === 'reset') && (
                    <div className="animate-fade-in">
                        <label className="block text-xs font-bold text-amber-600 mb-1 uppercase tracking-wider">
                            {view === 'reset' ? 'קוד אימות (Master Key)' : 'קוד רישום (VIP Code)'}
                        </label>
                        <input
                        type="text"
                        value={registrationCode}
                        onChange={(e) => setRegistrationCode(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-amber-200 bg-amber-50/50 focus:bg-white focus:border-amber-400 outline-none transition-all text-center tracking-widest font-mono"
                        placeholder="XXXX-XXXX"
                        dir="ltr"
                        />
                    </div>
                )}

                {/* Password - All views (In reset it's "New Password") */}
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                        {view === 'reset' ? 'סיסמה חדשה' : 'סיסמה'}
                    </label>
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 outline-none transition-all"
                    placeholder="••••••••"
                    dir="ltr"
                    />
                </div>

                {/* Messages */}
                {error && (
                    <div className="bg-rose-50 text-rose-700 text-sm p-3 rounded border border-rose-100 text-center animate-fade-in">
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded border border-emerald-100 text-center animate-fade-in">
                        {successMsg}
                    </div>
                )}

                <Button 
                    type="submit" 
                    variant="gold"
                    className="w-full mt-4 text-base shadow-lg" 
                    isLoading={isLoading}
                    disabled={connectionStatus === 'disconnected'}
                >
                    {view === 'register' ? 'צור חשבון' : view === 'reset' ? 'אפס סיסמה' : 'התחבר למערכת'}
                </Button>
            </form>

            {/* Links */}
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-2 text-center text-sm">
                
                {view === 'login' && (
                    <>
                        <button onClick={() => setView('reset')} className="text-slate-500 hover:text-slate-800 transition-colors">
                            שכחתי סיסמה?
                        </button>
                        <div className="text-slate-400">
                             אין לך חשבון עדיין? <button onClick={() => setView('register')} className="text-amber-600 font-bold hover:underline">הצטרף כאן</button>
                        </div>
                    </>
                )}

                {(view === 'register' || view === 'reset') && (
                    <button onClick={() => {
                        setView('login');
                        setError('');
                        setSuccessMsg('');
                    }} className="text-slate-500 hover:text-slate-800 font-medium">
                        חזרה להתחברות
                    </button>
                )}
            </div>
            
            <div className="mt-4 flex justify-between items-center text-[10px]">
                 <div>
                    {connectionStatus === 'disconnected' ? (
                        <span className="text-rose-500 bg-rose-50 px-2 py-1 rounded">שרת מנותק</span>
                    ) : (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            מחובר לענן
                        </span>
                    )}
                 </div>
                 <Link to="/admin" className="text-slate-300 hover:text-slate-500 transition-colors">ניהול מערכת</Link>
            </div>
        </div>
      </div>
    </Layout>
  );
};