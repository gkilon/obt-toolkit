import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gold-gradient rounded-lg flex items-center justify-center text-white font-serif font-bold text-lg shadow-md">
              OBT
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-xl tracking-wide font-serif">AI 360°</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-amber-600 font-bold">Executive Feedback</span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow flex flex-col relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-slate-100 to-transparent -z-10"></div>
        <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] bg-indigo-900/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="px-4 py-8 md:py-12 w-full max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        <p className="font-serif italic">© 2024 OBT Executive Suite. Powered by Gemini Advanced.</p>
      </footer>
    </div>
  );
};