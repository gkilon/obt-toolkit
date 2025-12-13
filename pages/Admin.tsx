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
      <div className="flex flex-col items-center justify-center py-12">
         <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">
                ניהול מערכת
            </h1>
            <p className="text-slate-500">System Configuration</p>
        </div>

        <div className="glass-panel w-full max-w-md p-10 rounded-xl">
            
            {!isAuthenticated ? (
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">סיסמת מנהל</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="dark-input"
                            placeholder="••••••••"
                        />
                        <p className="text-[10px] text-slate-600 mt-2 text-center">רמז: admin123</p>
                    </div>
                    
                    <Button type="submit" variant="primary" className="w-full">כניסה</Button>
                    
                    {msg && <p className="text-rose-400 text-center text-sm mt-4">{msg}</p>}
                    
                    <button onClick={() => navigate('/')} type="button" className="w-full text-center text-xs uppercase tracking-widest text-slate-500 hover:text-white mt-4 transition-colors">
                        חזרה
                    </button>
                </form>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-8">
                    <div className="bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20 text-center text-sm text-emerald-400 font-medium">
                        ✓ מחובר כמנהל מערכת
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-primary-400 uppercase tracking-widest mb-2">קוד רישום חדש</label>
                        <input 
                            type="text" 
                            value={newCode}
                            onChange={e => setNewCode(e.target.value)}
                            className="dark-input text-center font-mono tracking-widest text-xl"
                            placeholder="NEW-CODE"
                            dir="ltr"
                        />
                    </div>

                    <Button variant="primary" type="submit" className="w-full">עדכן קוד</Button>
                    
                    {msg && <p className="text-emerald-400 text-center font-medium text-sm">{msg}</p>}
                    
                    <div className="border-t border-white/10 pt-6 mt-2">
                        <button onClick={() => navigate('/')} type="button" className="w-full text-center text-slate-500 hover:text-white text-xs uppercase tracking-widest">יציאה</button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </Layout>
  );
};