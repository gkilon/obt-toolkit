
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { translations } from '../translations';

export const Privacy: React.FC = () => {
  const [lang, setLang] = useState<'he' | 'en'>(() => (localStorage.getItem('obt_lang') as 'he' | 'en') || 'he');
  
  useEffect(() => {
    const handleLangChange = (e: any) => setLang(e.detail);
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  const t = translations[lang];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-10">
        <div className="glass-panel p-10 space-y-8">
          <h1 className="text-3xl font-bold text-amber-600 mb-6">{t.privacyTitle}</h1>
          
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
        </div>
      </div>
    </Layout>
  );
};
