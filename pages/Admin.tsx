import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Button } from '../components/Button';
import { Layout } from '../components/Layout';

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [newCode, setNewCode] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      setMsg('סיסמה שגויה');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await storageService.updateRegistrationCode(newCode);
        setMsg('הקוד עודכן בהצלחה!');
        setNewCode('');
    } catch (e) {
        setMsg('שגיאה בעדכון הקוד');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
         {/* Header */}
         <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl font-serif font-black text-white mb-2 tracking-tight drop-shadow-lg">
                ניהול מערכת
            </h1>
            <p className="text-slate-300 font-light tracking-wide">
                שינוי הגדרות גישה ורישום
            </p>
        </div>

        <div className="glass-panel w-full max-w-md p-10 md:p-12 rounded-2xl animate-fade-in relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-bronze-800 via-bronze-500 to-bronze-800"></div>
            
            {!isAuthenticated ? (
                <form onSubmit={handleLogin} className="space-y-8">
                    <div className="group">
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">סיסמת מנהל</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="vintage-input w-full text-lg text-ink placeholder-slate-300 font-sans"
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <Button type="submit" variant="gold" className="w-full">כניסה</Button>
                    
                    {msg && <p className="text-rose-600 text-center text-sm font-medium bg-rose-50 p-2 rounded border border-rose-100">{msg}</p>}
                    
                    <button onClick={() => navigate('/')} className="w-full text-center text-sm text-slate-400 hover:text-bronze-600 mt-2 font-medium">
                        חזרה לדף הראשי
                    </button>
                </form>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-8">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center mb-6">
                        <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">סטטוס</span>
                        <p className="text-emerald-600 font-bold">מחובר כמנהל ✓</p>
                    </div>

                    <div className="group">
                        <label className="block text-xs font-bold text-bronze-600 mb-2 uppercase tracking-widest">קוד רישום חדש</label>
                        <input 
                            type="text" 
                            value={newCode}
                            onChange={e => setNewCode(e.target.value)}
                            className="vintage-input w-full text-center text-2xl tracking-[0.2em] font-serif font-bold text-ink"
                            placeholder="NEW-CODE"
                            dir="ltr"
                        />
                        <p className="text-xs text-slate-400 mt-2 text-center">קוד זה ישמש משתמשים חדשים להרשמה.</p>
                    </div>

                    <Button variant="gold" type="submit" className="w-full">עדכן קוד</Button>
                    
                    {msg && <p className="text-emerald-600 text-center font-bold bg-emerald-50 p-2 rounded border border-emerald-100">{msg}</p>}
                    
                    <div className="border-t border-slate-100 pt-6 mt-4">
                        <button onClick={() => navigate('/')} className="w-full text-center text-slate-500 hover:text-ink font-bold text-sm">יציאה וחזרה לדף הבית</button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </Layout>
  );
};