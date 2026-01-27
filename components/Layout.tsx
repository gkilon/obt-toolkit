
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { translations } from '../translations';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<'he' | 'en'>(() => {
    return (localStorage.getItem('obt_lang') as 'he' | 'en') || 'he';
  });

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
    localStorage.setItem('obt_lang', lang);
  }, [lang, t.dir]);

  const toggleLang = () => {
    const nextLang = lang === 'he' ? 'en' : 'he';
    setLang(nextLang);
    window.dispatchEvent(new CustomEvent('langChange', { detail: nextLang }));
  };

  return (
    <div className={`min-h-screen flex flex-col text-onyx-100 relative overflow-x-hidden ${lang === 'he' ? 'font-sans' : 'font-sans'}`} dir={t.dir}>
      
      {/* Background Effects */}
      <div className="fixed inset-0 bg-noise pointer-events-none z-0 mix-blend-overlay opacity-20"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-bronze-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-onyx-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <header className="sticky top-0 z-50 bg-onyx-900/90 backdrop-blur-md border-b border-onyx-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-4 group">
             <div className="bg-onyx-800 p-2.5 rounded-lg border border-onyx-700 shadow-sm text-bronze-500 group-hover:text-bronze-400 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <line x1="3" x2="21" y1="9" y2="9"/>
                  <line x1="9" x2="9" y1="21" y2="9"/>
               </svg>
             </div>
             
             <div>
                <h1 className="text-2xl font-normal text-onyx-100 tracking-tight leading-none">
                    OBT 
                    <span className="text-onyx-600 font-light mx-1">|</span> 
                    <span className="font-light tracking-wide text-onyx-300">360 Workspace</span>
                </h1>
             </div>
          </Link>

          <button 
            onClick={toggleLang}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-bronze-500/30 bg-onyx-800 hover:bg-onyx-700 transition-all text-xs font-bold text-bronze-500 hover:scale-105 active:scale-95 shadow-lg shadow-bronze-500/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {lang === 'he' ? 'English' : 'עברית'}
          </button>

        </div>
      </header>
      
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-12 relative z-10">
        {children}
      </main>
      
      <footer className="border-t border-onyx-800 bg-onyx-900/80 py-8 relative z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-onyx-500 uppercase tracking-widest">
            <div className="flex items-center gap-6">
              <p>© 2025 OBT Intelligent Feedback</p>
              <Link to="/admin" className="text-amber-600 hover:text-amber-500 font-bold transition-colors">
                ניהול מערכת (Admin)
              </Link>
            </div>
            <p className="mt-2 md:mt-0">Secured & Anonymous</p>
        </div>
      </footer>
    </div>
  );
};
