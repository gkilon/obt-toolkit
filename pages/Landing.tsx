
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await storageService.loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setIsGoogleLoading(false);
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

            <div className="mb-8">
              <button 
                onClick={handleGoogleLogin} 
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3.5 rounded-lg hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>
              
              <div className="relative flex items-center justify-center my-8">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-4 text-white/20 text-xs uppercase font-bold tracking-widest">or email</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>
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
