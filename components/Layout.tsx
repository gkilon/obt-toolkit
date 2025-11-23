import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              OBT
            </div>
            <span className="font-bold text-slate-800 text-lg">AI 360</span>
          </div>
        </div>
      </header>
      <main className="flex-grow flex flex-col px-4 py-8">
        {children}
      </main>
      <footer className="py-6 text-center text-slate-400 text-sm">
        <p>© 2024 OBT AI 360. Powered by Gemini.</p>
      </footer>
    </div>
  );
};