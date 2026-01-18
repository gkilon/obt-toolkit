import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { analyzeFeedback } from '../services/geminiService';
import { exportToWord } from '../services/exportService';
import { User, FeedbackResponse, AnalysisResult } from '../types';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { translations } from '../translations';

export const Dashboard: React.FC = () => {
  const [lang, setLang] = useState<'he' | 'en'>(() => (localStorage.getItem('obt_lang') as 'he' | 'en') || 'he');
  
  useEffect(() => {
    const handleLangChange = (e: any) => setLang(e.detail);
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  const t = translations[lang];

  const [user, setUser] = useState<User | null>(null);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [goal, setGoal] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    if (!currentUser) { navigate('/'); return; }
    setUser(currentUser);
    setGoal(currentUser.userGoal || '');
    if (!currentUser.userGoal) setIsEditingGoal(true);

    storageService.getResponsesForUser(currentUser.id).then(setResponses);
  }, [navigate]);

  const handleSaveGoal = async () => {
      if (!user || !goal.trim()) return;
      await storageService.updateUserGoal(user.id, goal);
      setUser({ ...user, userGoal: goal });
      setIsEditingGoal(false);
  };

  const handleAnalyze = async () => {
    setLoadingAnalysis(true);
    try {
      const result = await analyzeFeedback(responses, user?.userGoal);
      setAnalysis(result);
    } catch (error) {
      alert("Error during analysis");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const copyLink = () => {
    const baseUrl = window.location.href.split('#')[0];
    const url = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/#/survey/${user?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8 border-b border-onyx-800">
          <div>
            <h1 className="text-4xl font-heading text-onyx-100">{t.dashboardTitle}, {user.name}</h1>
            <p className="text-onyx-400 mt-2">{t.feedbacksCollected}: {responses.length}</p>
          </div>
          <Button onClick={() => { storageService.logout(); navigate('/'); }} variant="ghost">{t.logout}</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="glass-panel p-6 border-l-4 border-l-bronze-700">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-heading text-onyx-100">🎯 {t.myGoal}</h3>
                    <button onClick={() => setIsEditingGoal(true)} className="text-bronze-500 text-sm">{t.edit}</button>
                </div>
                {isEditingGoal ? (
                    <div className="space-y-4">
                        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} className="dark-input w-full" />
                        <div className="flex gap-3">
                            <Button onClick={handleSaveGoal}>{t.save}</Button>
                            <button onClick={() => setIsEditingGoal(false)} className="text-onyx-500">{t.cancel}</button>
                        </div>
                    </div>
                ) : (
                    <p className="text-lg italic text-onyx-200">"{goal}"</p>
                )}
            </div>

            <div className="flex justify-between items-center">
                <Button onClick={copyLink} variant="primary">{copied ? t.linkCopied : t.copyLink}</Button>
            </div>

            <div className="space-y-4">
                {responses.map(r => (
                    <div key={r.id} className="glass-panel p-4">
                        <p className="text-xs text-bronze-500 font-bold mb-2 uppercase">{t[r.relationship] || r.relationship}</p>
                        <p className="text-onyx-200 mb-2">{r.q1_change}</p>
                        <p className="text-onyx-500 text-sm italic">{r.q2_actions}</p>
                    </div>
                ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="glass-panel p-6">
                <h2 className="text-lg font-heading mb-4">✦ {t.aiAnalysis}</h2>
                {!analysis ? (
                    <Button onClick={handleAnalyze} isLoading={loadingAnalysis} className="w-full">{t.generateReport}</Button>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm">{analysis.summary}</p>
                        <ul className="text-xs space-y-1">
                            {analysis.keyThemes.map((theme, i) => <li key={i}>• {theme}</li>)}
                        </ul>
                        <div className="bg-bronze-900/10 p-3 rounded text-xs text-bronze-300">
                            <strong>{t.save}:</strong> {analysis.actionableAdvice}
                        </div>
                        <Button onClick={() => exportToWord(user, analysis, responses)} variant="secondary" className="w-full">{t.downloadWord}</Button>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};