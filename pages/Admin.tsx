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

  // Simple hardcoded admin check
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
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
            <h1 className="text-2xl font-bold mb-6 text-center">ניהול מערכת</h1>
            
            {!isAuthenticated ? (
                <form onSubmit={handleLogin} className="space-y-4">
                    <p className="text-sm text-slate-500 text-center">נא להזנין סיסמת מנהל</p>
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Admin Password"
                    />
                    <Button type="submit" className="w-full">כניסה</Button>
                    {msg && <p className="text-red-500 text-center text-sm">{msg}</p>}
                    <button onClick={() => navigate('/')} className="w-full text-center text-sm text-slate-400 mt-4">חזרה</button>
                </form>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">קוד רישום חדש (Registration Code)</label>
                        <input 
                            type="text" 
                            value={newCode}
                            onChange={e => setNewCode(e.target.value)}
                            className="w-full p-3 border border-amber-300 bg-amber-50 rounded text-center text-xl tracking-widest"
                            placeholder="NEW-CODE"
                        />
                        <p className="text-xs text-slate-400 mt-2">קוד זה ישמש משתמשים חדשים להרשמה למערכת.</p>
                    </div>
                    <Button variant="gold" type="submit" className="w-full">עדכן קוד</Button>
                    {msg && <p className="text-emerald-600 text-center font-bold">{msg}</p>}
                    
                    <div className="border-t pt-4 mt-8">
                        <button onClick={() => navigate('/')} className="w-full text-center text-slate-500">יציאה וחזרה לדף הבית</button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </Layout>
  );
};