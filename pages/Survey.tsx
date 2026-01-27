
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { RelationshipType, SurveyQuestion } from '../types';
import { translations } from '../translations';

export const Survey: React.FC = () => {
  const [lang, setLang] = useState<'he' | 'en'>(() => (localStorage.getItem('obt_lang') as 'he' | 'en') || 'he');
  const { userId } = useParams<{ userId: string }>();

  const [userName, setUserName] = useState<string>('');
  const [userGoal, setUserGoal] = useState<string>('');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [relationship, setRelationship] = useState<RelationshipType>('peer');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLangChange = (e: any) => setLang(e.detail);
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  const t = translations[lang];

  useEffect(() => {
    if (userId) {
      storageService.getUserDataById(userId).then(userData => {
        setUserName(userData.name);
        setUserGoal(userData.userGoal || '');
        storageService.getSurveyQuestions(userId).then(surveyQuestions => {
          setQuestions(surveyQuestions);
          setIsLoading(false);
        });
      }).catch(err => {
        console.error("Failed to load survey", err);
        setIsLoading(false);
      });
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const missing = questions.filter(q => q.required && !answers[q.id]);
    if (missing.length > 0) {
      alert(t.fillRequired);
      return;
    }
    setIsSending(true);
    const formattedAnswers = Object.entries(answers).map(([qid, text]) => ({ questionId: qid, text }));
    try {
      await storageService.addResponse(userId, relationship, formattedAnswers);
      setSubmitted(true);
    } catch (err) {
      alert("Submission error");
    } finally {
      setIsSending(false);
    }
  };

  const updateAnswer = (qid: string, text: string) => {
    setAnswers({ ...answers, [qid]: text });
  };

  if (isLoading) return <Layout><div className="text-center py-20 animate-pulse">{t.loadingSurvey}</div></Layout>;

  if (submitted) {
    return (
      <Layout>
        <div className="text-center py-20 space-y-8">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2 className="text-3xl font-bold">{t.thankYou}</h2>
          <p className="text-white/40 max-w-sm mx-auto">{t.surveySuccess}</p>
          <Link to="/"><Button variant="outline">{t.backHome}</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto w-full space-y-10">
        <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white tracking-tight">{userName}</h1>
            {userGoal && (
              <div className="glass-panel p-6 border-amber-600/20 bg-amber-600/5">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">{t.myGoal}:</p>
                <p className="italic text-lg text-white/80">"{userGoal}"</p>
              </div>
            )}
        </div>

        <form onSubmit={handleSubmit} className="glass-panel p-10 space-y-10">
            <div className="space-y-4">
                <label className="block text-sm font-bold text-white/40 uppercase tracking-widest">{t.relationship}</label>
                <select value={relationship} onChange={(e) => setRelationship(e.target.value as RelationshipType)} className="dark-input">
                    <option value="peer">{t.peer}</option>
                    <option value="manager">{t.manager}</option>
                    <option value="subordinate">{t.subordinate}</option>
                    <option value="friend">{t.friend}</option>
                    <option value="other">{t.other}</option>
                </select>
            </div>
            <div className="space-y-12">
              {questions.map((q) => (
                <div key={q.id} className="space-y-4">
                    <label className="block text-xl font-medium leading-relaxed">
                      {lang === 'he' ? q.text_he : q.text_en || q.text_he}
                      {q.required && <span className="text-amber-600 mx-2">*</span>}
                    </label>
                    <textarea 
                      required={q.required} 
                      value={answers[q.id] || ''} 
                      onChange={(e) => updateAnswer(q.id, e.target.value)} 
                      className="dark-input min-h-[120px] resize-none"
                    />
                </div>
              ))}
            </div>
            <Button type="submit" className="w-full py-5 text-xl" isLoading={isSending}>
              {t.submitSurvey}
            </Button>
        </form>
      </div>
    </Layout>
  );
};
