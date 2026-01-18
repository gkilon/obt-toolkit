import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { translations } from '../translations';

const ALLOW_GUEST_MODE = false;

export const Landing: React.FC = () => {
  const [lang, setLang] = useState<'he' | 'en'>(() => (localStorage.getItem('obt_lang') as 'he' | 'en') || 'he');
  
  useEffect(() => {
    const handleLangChange = (e: any) => setLang(e.detail);
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  const t = translations[lang];

  const [view, setView] = useState<'login' | 'register' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    storageService.init();
    const isConnected = storageService.isCloudEnabled();
    if (!isConnected) setOfflineMode(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (offlineMode && !ALLOW_GUEST_MODE) throw new Error(lang === 'he' ? "המערכת באופליין" : "System offline");
      if (view === 'register') {
        await storageService.registerUser(name, email, password, registrationCode);
        navigate('/dashboard');
      } else if (view === 'login') {
        await storageService.login(email, password);
        navigate('/dashboard');
      } else if (view === 'reset') {
        await storageService.resetPassword(email, registrationCode, password);
        setSuccessMsg(lang === 'he' ? "הסיסמה עודכנה" : "Password updated");
        setTimeout(() => setView('login'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-12 relative">
        <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-heading font-normal text-onyx-100 mb-4 tracking-tight">
                One Big <span className="text-bronze-500 font-medium">Thing</span>
            </h1>
            <p className="text-lg text-onyx-400 max-w-md mx-auto leading-relaxed">
               {t.subtitle}
            </p>
        </div>

        <div className="glass-panel w-full max-w-[400px]">
            <div className="mb-8 text-center border-b border-onyx-700/50 pb-6">
                <h2 className="text-xl font-heading text-onyx-100">
                    {view === 'register' ? t.register : view === 'reset' ? t.reset : t.login}
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {view === 'register' && (
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="dark-input" placeholder={t.fullName} />
                )}
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className={`dark-input ${lang === 'he' ? 'text-right' : 'text-left'}`} 
                  placeholder={t.email} 
                  dir="ltr"
                />
                {(view === 'register' || view === 'reset') && (
                    <div>
                        <input type="text" value={registrationCode} onChange={(e) => setRegistrationCode(e.target.value)} className="dark-input uppercase" placeholder={t.regCode} />
                        <p className="text-[10px] text-onyx-500 mt-1">{t.regCodeHint}</p>
                    </div>
                )}
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className={`dark-input ${lang === 'he' ? 'text-right' : 'text-left'}`} 
                  placeholder={t.password} 
                  dir="ltr"
                />
                
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                {successMsg && <p className="text-green-400 text-sm text-center">{successMsg}</p>}

                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                    {view === 'register' ? t.registerBtn : view === 'reset' ? t.save : t.loginBtn}
                </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-onyx-700/50 flex flex-col items-center gap-3 text-sm">
                {view === 'login' ? (
                    <>
                        <button onClick={() => setView('reset')} className="text-onyx-500 text-xs">{t.forgotPassword}</button>
                        <div className="text-onyx-400">
                            {t.noAccount} <button onClick={() => setView('register')} className="text-bronze-500 font-medium">{t.registerBtn}</button>
                        </div>
                    </>
                ) : (
                    <button onClick={() => setView('login')} className="text-onyx-400">{t.backToLogin}</button>
                )}
            </div>
        </div>
      </div>
    </Layout>
  );
};