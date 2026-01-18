import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { RelationshipType } from '../types';
import { translations } from '../translations';

export const Survey: React.FC = () => {
  const [lang, setLang] = useState<'he' | 'en'>(() => (localStorage.getItem('obt_lang') as 'he' | 'en') || 'he');
  
  useEffect(() => {
    const handleLangChange = (e: any) => setLang(e.detail);
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  const t = translations[lang];

  const { userId } = useParams<{ userId: string }>();
  const [userName, setUserName] = useState<string>('');
  const [userGoal, setUserGoal] = useState<string>('');
  const [relationship, setRelationship] = useState<RelationshipType>('peer');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
        storageService.getUserDataById(userId).then(data => {
            if (data) {
                setUserName(data.name);
                setUserGoal(data.userGoal || '');
            }
            setIsLoading(false);
        });
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSending(true);
    await storageService.addResponse(userId, relationship, q1, q2);
    setSubmitted(true);
    setIsSending(false);
  };

  if (isLoading) return <Layout><div className="text-center py-20">Loading...</div></Layout>;

  if (submitted) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-3xl font-heading mb-4">{t.thankYou}</h2>
          <p className="text-onyx-400 mb-10">{t.surveySuccess}</p>
          <Link to="/"><Button variant="outline">Home</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-10">
            <h1 className="text-3xl font-heading mb-4">{userName}</h1>
            {userGoal && <div className="bg-onyx-900/50 p-6 rounded italic text-lg">"{userGoal}"</div>}
        </div>

        <div className="glass-panel p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <label className="block text-sm font-bold mb-3">{t.relationship}</label>
                    <select value={relationship} onChange={(e) => setRelationship(e.target.value as RelationshipType)} className="dark-input">
                        <option value="peer">{t.peer}</option>
                        <option value="manager">{t.manager}</option>
                        <option value="subordinate">{t.subordinate}</option>
                        <option value="friend">{t.friend}</option>
                        <option value="other">{t.other}</option>
                    </select>
                </div>
                <div className="space-y-4">
                    <label className="block text-xl font-heading">{t.q1Label}</label>
                    <textarea required value={q1} onChange={(e) => setQ1(e.target.value)} className="dark-input min-h-[100px]" />
                </div>
                <div className="space-y-4">
                    <label className="block text-xl font-heading">{t.q2Label}</label>
                    <textarea required value={q2} onChange={(e) => setQ2(e.target.value)} className="dark-input min-h-[100px]" />
                </div>
                <Button type="submit" className="w-full" isLoading={isSending}>{t.submitSurvey}</Button>
            </form>
        </div>
      </div>
    </Layout>
  );
};