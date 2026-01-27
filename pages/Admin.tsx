
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';
import { SurveyQuestion } from '../types';

export const Admin: React.FC = () => {
  // שמירת מצב ההתחברות ב-sessionStorage כדי שלא ייעלם בטעות
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('obt_admin_auth') === 'true';
  });
  
  const [password, setPassword] = useState('');
  const [newCode, setNewCode] = useState('');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      storageService.getSurveyQuestions()
        .then(setQuestions)
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('obt_admin_auth', 'true');
      setMsg('');
    } else {
      setMsg('סיסמה שגויה');
      // העלמת הודעת השגיאה אחרי 3 שניות
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('obt_admin_auth');
    navigate('/');
  };

  const handleSaveQuestions = async () => {
    try {
      await storageService.updateSurveyQuestions(questions);
      setMsg('השאלון עודכן בהצלחה!');
      setTimeout(() => setMsg(''), 3000);
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
    if (window.confirm('האם אתה בטוח שברצונך למחוק את השאלה?')) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: keyof SurveyQuestion, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2">ניהול מערכת</h1>
            <p className="text-white/40">הזן סיסמת מנהל כדי להמשיך</p>
          </div>
          
          <form onSubmit={handleLogin} className="glass-panel p-10 w-full max-w-md space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">סיסמה</label>
              <input 
                type="password" 
                autoFocus
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="dark-input text-center text-xl tracking-widest" 
                placeholder="••••••••" 
              />
            </div>
            
            <Button type="submit" className="w-full py-4">כניסה למערכת</Button>
            
            {msg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-center text-sm animate-shake">
                {msg}
              </div>
            )}
          </form>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">הגדרות שאלון ותשתית</h1>
            <p className="text-white/40 text-sm">ניהול שאלות ה-360 והגדרות קוד רישום</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="text-white/50 border-white/10">יציאה בטוחה</Button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 animate-pulse text-white/20">טוען נתונים מהענן...</div>
        ) : (
          <>
            <div className="glass-panel p-8 space-y-8">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-amber-600">ניהול שאלות (360)</h2>
                <span className="text-xs text-white/20 uppercase tracking-widest">סה"כ שאלות: {questions.length}</span>
              </div>

              <div className="space-y-6">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-6 bg-white/5 rounded-xl border border-white/10 space-y-4 hover:border-white/20 transition-all">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                        <span className="text-xs font-bold uppercase text-white/40">הגדרות שאלה</span>
                      </div>
                      <button 
                        onClick={() => removeQuestion(q.id)} 
                        className="text-white/20 hover:text-red-400 transition-colors"
                        title="מחק שאלה"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/30 uppercase">טקסט בעברית</label>
                        <input value={q.text_he} onChange={e => updateQuestion(q.id, 'text_he', e.target.value)} className="dark-input" placeholder="שאלה בעברית" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/30 uppercase">טקסט באנגלית</label>
                        <input value={q.text_en} onChange={e => updateQuestion(q.id, 'text_en', e.target.value)} className="dark-input" placeholder="שאלה באנגלית" dir="ltr" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/30 uppercase block">סוג מידע</label>
                        <select value={q.type} onChange={e => updateQuestion(q.id, 'type', e.target.value)} className="dark-input py-2 w-48 text-sm">
                          <option value="general">שאלה כללית</option>
                          <option value="goal">מטרת צמיחה (Goal)</option>
                          <option value="blocker">חסמים (Blocker)</option>
                        </select>
                      </div>
                      
                      <div className="flex items-end pb-3">
                        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-white/10 bg-onyx-800 text-amber-600 focus:ring-amber-600/50"
                            checked={q.required} 
                            onChange={e => updateQuestion(q.id, 'required', e.target.checked)} 
                          />
                          <span className="group-hover:text-white transition-colors">שאלת חובה</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={addQuestion} 
                  className="w-full py-4 border-2 border-dashed border-white/5 rounded-xl text-white/20 hover:text-amber-600 hover:border-amber-600/30 hover:bg-amber-600/5 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  <span>הוסף שאלה חדשה לשאלון</span>
                </button>
              </div>
              
              <Button onClick={handleSaveQuestions} className="w-full py-5 text-xl shadow-xl shadow-amber-600/10">שמור את כל השינויים במבנה השאלון</Button>
            </div>

            <div className="glass-panel p-8 space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-amber-600">קוד רישום (VIP Access)</h2>
                <p className="text-xs text-white/30 mt-1">קוד זה נדרש ממשתמשים חדשים בזמן ההרשמה למערכת</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  value={newCode} 
                  onChange={e => setNewCode(e.target.value)} 
                  className="dark-input uppercase tracking-widest text-lg md:max-w-xs" 
                  placeholder="הזן קוד חדש..." 
                />
                <Button 
                  onClick={async () => {
                    if (!newCode) return;
                    await storageService.updateRegistrationCode(newCode);
                    setMsg('קוד הרישום עודכן בהצלחה!');
                    setNewCode('');
                    setTimeout(() => setMsg(''), 3000);
                  }}
                  variant="secondary"
                >
                  עדכן קוד גישה
                </Button>
              </div>
            </div>
          </>
        )}
        
        {msg && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-10 py-4 rounded-full shadow-2xl animate-bounce z-[100] font-bold flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
             {msg}
          </div>
        )}
      </div>
    </Layout>
  );
};
