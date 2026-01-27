
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { SurveyQuestion, QuestionType } from '../types';

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [newCode, setNewCode] = useState('');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      storageService.getSurveyQuestions().then(setQuestions);
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') setIsAuthenticated(true);
    else setMsg('סיסמה שגויה');
  };

  const handleSaveQuestions = async () => {
    try {
      await storageService.updateSurveyQuestions(questions);
      setMsg('השאלון עודכן בהצלחה!');
    } catch (e) {
      setMsg('שגיאה בשמירת השאלון');
    }
  };

  const addQuestion = () => {
    const newQ: SurveyQuestion = {
      id: 'q_' + Date.now(),
      text_he: '',
      text_en: '',
      type: 'general',
      required: true
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof SurveyQuestion, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-3xl font-bold mb-8">ניהול מערכת</h1>
          <form onSubmit={handleLogin} className="glass-panel p-10 w-full max-w-md space-y-6">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="dark-input" placeholder="סיסמת מנהל" />
            <Button type="submit" className="w-full">כניסה</Button>
            {msg && <p className="text-red-400 text-center">{msg}</p>}
          </form>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">הגדרות שאלון ותשתית</h1>
          <Button onClick={() => navigate('/')} variant="outline">יציאה</Button>
        </div>

        <div className="glass-panel p-8 space-y-8">
          <h2 className="text-xl font-bold text-amber-600">ניהול שאלות (360)</h2>
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-6 bg-white/5 rounded-xl border border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-white/40">שאלה {idx + 1}</span>
                  <button onClick={() => removeQuestion(q.id)} className="text-red-400 text-xs hover:underline">מחק שאלה</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input value={q.text_he} onChange={e => updateQuestion(q.id, 'text_he', e.target.value)} className="dark-input" placeholder="שאלה בעברית" />
                  <input value={q.text_en} onChange={e => updateQuestion(q.id, 'text_en', e.target.value)} className="dark-input" placeholder="שאלה באנגלית" dir="ltr" />
                </div>
                <div className="flex gap-4 items-center">
                  <select value={q.type} onChange={e => updateQuestion(q.id, 'type', e.target.value)} className="dark-input w-48">
                    <option value="general">שאלה כללית</option>
                    <option value="goal">מטרת צמיחה (Goal)</option>
                    <option value="blocker">חסמים (Blocker)</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm text-white/60">
                    <input type="checkbox" checked={q.required} onChange={e => updateQuestion(q.id, 'required', e.target.checked)} />
                    שאלת חובה
                  </label>
                </div>
              </div>
            ))}
            <Button onClick={addQuestion} variant="outline" className="w-full border-dashed">+ הוסף שאלה חדשה</Button>
          </div>
          <Button onClick={handleSaveQuestions} className="w-full py-4 text-lg">שמור מבנה שאלון</Button>
        </div>

        <div className="glass-panel p-8 space-y-6">
          <h2 className="text-xl font-bold text-amber-600">קוד רישום (VIP Access)</h2>
          <div className="flex gap-4">
            <input value={newCode} onChange={e => setNewCode(e.target.value)} className="dark-input uppercase" placeholder="קוד חדש" />
            <Button onClick={async () => {
              await storageService.updateRegistrationCode(newCode);
              setMsg('קוד עודכן!');
              setNewCode('');
            }}>עדכן קוד</Button>
          </div>
        </div>
        
        {msg && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-8 py-3 rounded-full shadow-2xl animate-bounce">{msg}</div>}
      </div>
    </Layout>
  );
};
