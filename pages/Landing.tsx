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
  const [registrationCode, setRegistrationCode] = useState('OBT-VIP'); 
  
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
      if (connectionStatus === 'disconnected') {
          const retry = await storageService.testConnection();
          if (retry) setConnectionStatus('connected');
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
         setSuccessMsg("הסיסמה שונתה בהצלחה. ניתן להתחבר.");
         setTimeout(() => setView('login'), 2000);
      }
    } catch (err: any) {
      console.error("Submit Error:", err);
      if (err.message.includes("auth")) setError("פרטי הזיהוי שגויים.");
      else if (err.message.includes("network")) setError("שגיאת תקשורת.");
      else setError(err.message || 'אירעה שגיאה.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        
        {/* Modern Header Typography */}
        <div className="text-center mb-16 animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-serif font-black text-white mb-4 tracking-tight drop-shadow-lg">
                פריצת דרך <span className="text-bronze-400 italic">ניהולית</span>
            </h1>
            <div className="flex items-center justify-center gap-4 text-slate-300">
                <span className="h-px w-8 bg-slate-500/50"></span>
                <p className="text-lg text-slate-200 font-light tracking-wide">
                   זיהוי "הדבר האחד" לשינוי
                </p>
                <span className="h-px w-8 bg-slate-500/50"></span>
            </div>
        </div>

        {/* Modern Glass Card */}
        <div className="glass-panel w-full max-w-md p-10 md:p-12 rounded-2xl animate-fade-in relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-bronze-800 via-bronze-500 to-bronze-800"></div>
            
            <div className="text-center mb-10">
                <h2 className="text-3xl font-serif font-bold text-ink">
                    {view === 'register' ? 'הרשמה למערכת' : view === 'reset' ? 'איפוס סיסמה' : 'כניסת מנויים'}
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {view === 'register' && (
                    <div className="group animate-fade-in">
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">שם מלא</label>
                        <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="vintage-input w-full text-lg text-ink placeholder-slate-300 font-sans"
                        placeholder="ישראל ישראלי"
                        />
                    </div>
                )}

                <div className="group">
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">אימייל</label>
                    <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="vintage-input w-full text-lg text-ink placeholder-slate-300 text-left font-sans"
                    dir="ltr"
                    placeholder="name@company.com"
                    />
                </div>

                {(view === 'register' || view === 'reset') && (
                    <div className="group animate-fade-in">
                        <label className="block text-xs font-bold text-bronze-600 mb-1 uppercase tracking-widest">
                            {view === 'reset' ? 'קוד אימות' : 'קוד גישה (VIP)'}
                        </label>
                        <input
                        type="text"
                        value={registrationCode}
                        onChange={(e) => setRegistrationCode(e.target.value)}
                        className="vintage-input w-full text-center text-xl tracking-[0.2em] font-serif font-bold text-bronze-800"
                        placeholder="OBT-VIP"
                        dir="ltr"
                        />
                         {registrationCode === 'OBT-VIP' && <p className="text-[10px] text-emerald-600 text-center mt-1 font-bold">קוד תקין ✓</p>}
                    </div>
                )}

                <div className="group">
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">
                        {view === 'reset' ? 'סיסמה חדשה' : 'סיסמה'}
                    </label>
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="vintage-input w-full text-lg text-ink placeholder-slate-300 text-left font-sans"
                    dir="ltr"
                    placeholder="••••••••"
                    />
                </div>

                {error && <p className="text-rose-700 text-sm text-center bg-rose-50 p-2 rounded border border-rose-100 font-medium">{error}</p>}
                {successMsg && <p className="text-emerald-700 text-sm text-center bg-emerald-50 p-2 rounded border border-emerald-100 font-medium">{successMsg}</p>}

                <div className="pt-4">
                    <Button type="submit" variant="gold" className="w-full" isLoading={isLoading}>
                        {view === 'register' ? 'הרשמה' : view === 'reset' ? 'שמירה' : 'כניסה'}
                    </Button>
                </div>
            </form>

            <div className="mt-8 pt-6 flex flex-col items-center gap-4 text-sm border-t border-slate-100">
                {view === 'login' && (
                    <>
                        <button onClick={() => setView('reset')} className="text-slate-400 hover:text-bronze-600 transition-colors font-medium">
                            שכחתי סיסמה
                        </button>
                        <div className="text-slate-500">
                             אין חשבון? <button onClick={() => setView('register')} className="text-bronze-600 font-bold hover:underline">הצטרף לרשימה</button>
                        </div>
                    </>
                )}
                {(view === 'register' || view === 'reset') && (
                    <button onClick={() => setView('login')} className="text-slate-500 hover:text-ink font-bold">
                        חזרה לכניסה
                    </button>
                )}
            </div>
            
            <div className="absolute top-2 right-2">
                 <Link to="/admin" className="text-[10px] text-slate-200 hover:text-bronze-300 tracking-widest uppercase p-2">Admin</Link>
            </div>
        </div>
      </div>
    </Layout>
  );
};