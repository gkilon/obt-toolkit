
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { translations } from '../translations';

export const Privacy: React.FC = () => {
  const [lang, setLang] = useState<'he' | 'en'>(() => (localStorage.getItem('obt_lang') as 'he' | 'en') || 'he');
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleLangChange = (e: any) => setLang(e.detail);
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  const t = translations[lang];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-10">
        <div className="glass-panel p-10 space-y-8 relative">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-amber-600">{t.privacyTitle}</h1>
            <button 
              onClick={() => navigate(-1)} 
              className="text-white/40 hover:text-white transition-colors p-2"
              title={t.close}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">{t.privacyP1Title}</h2>
            <p className="text-white/70 leading-relaxed">{t.privacyP1Content}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">{t.privacyP2Title}</h2>
            <ul className="space-y-2 text-white/70 list-disc list-inside">
              <li>{t.privacyP2Content1}</li>
              <li>{t.privacyP2Content2}</li>
              <li>{t.privacyP2Content3}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">{t.privacyP3Title}</h2>
            <p className="text-white/70 leading-relaxed">{t.privacyP3Content1}</p>
            <ul className="space-y-2 text-white/70 list-disc list-inside">
              <li>{t.privacyP3Content2}</li>
              <li>{t.privacyP3Content3}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">{t.privacyP4Title}</h2>
            <p className="text-white/70 leading-relaxed">{t.privacyP4Content1}</p>
            <ul className="space-y-2 text-white/70 list-disc list-inside">
              <li>{t.privacyP4Content2}</li>
              <li>{t.privacyP4Content3}</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">{t.privacyP5Title}</h2>
            <p className="text-white/70 leading-relaxed">{t.privacyP5Content}</p>
          </section>

          <section className="space-y-3 pt-6 border-t border-white/10">
            <h2 className="text-xl font-bold text-white">{t.privacyP6Title}</h2>
            <p className="text-white/70 leading-relaxed">{t.privacyP6Content}</p>
          </section>

          <div className="pt-8 flex justify-center">
            <Button onClick={() => navigate(-1)} variant="secondary" className="px-12">
              {t.close}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
