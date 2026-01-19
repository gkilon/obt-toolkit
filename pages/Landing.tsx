
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { translations } from '../translations';

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

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                One Big <span className="text-[#e66a00]">Thing</span>
            </h1>
            <p className="text-xl text-white/60 max-w-xl mx-auto leading-relaxed">
               {t.subtitle}
            </p>
        </div>

        <div className="glass-panel w-full max-w-[460px] p-10">
            <div className="mb-10 text-center">
                <h2 className="text-2xl font-medium text-white">
                    {view === 'register' ? 'צור חשבון חדש' : view === 'reset' ? t.reset : 'Member Login'}
                </h2>
                <div className="h-px bg-white/10 w-full mt-6"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {view === 'register' && (
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="dark-input" placeholder={t.fullName} />
                )}
                
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="dark-input" 
                  placeholder="Email Address" 
                  dir="ltr"
                />
                
                {(view === 'register' || view === 'reset') && (
                    <input type="text" value={registrationCode} onChange={(e) => setRegistrationCode(e.target.value)} className="dark-input uppercase" placeholder="Registration Code" />
                )}
                
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="dark-input" 
                  placeholder="Password" 
                  dir="ltr"
                />
                
                {error && <p className="text-red-400 text-sm text-center font-light">{error}</p>}
                {successMsg && <p className="text-green-400 text-sm text-center font-light">{successMsg}</p>}

                <Button type="submit" variant="primary" className="w-full text-lg py-4" isLoading={isLoading}>
                    {view === 'register' ? t.registerBtn : view === 'reset' ? t.save : 'Login'}
                </Button>
            </form>

            <div className="mt-10 flex flex-col items-center gap-4 text-sm font-light">
                {view === 'login' ? (
                    <>
                        <button onClick={() => setView('reset')} className="text-white/40 hover:text-white transition-colors">Forgot Password</button>
                        <div className="text-white/40 mt-2">
                            Don't have an account? <button onClick={() => setView('register')} className="text-[#e66a00] font-medium hover:underline">Create Account</button>
                        </div>
                    </>
                ) : (
                    <button onClick={() => setView('login')} className="text-white/40 hover:text-white transition-colors">Back to Login</button>
                )}
            </div>
        </div>
      </div>
    </Layout>
  );
};
