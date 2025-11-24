import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-transparent text-ink selection:bg-bronze-200">
      
      {/* Modern Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex flex-col group cursor-default">
            <h1 className="text-2xl font-serif font-black tracking-wider text-white group-hover:text-bronze-200 transition-colors">
              OBT <span className="font-light text-bronze-400">360°</span>
            </h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-bold mt-0.5">
              Executive Suite
            </span>
          </div>
          
        </div>
      </header>
      
      <main className="flex-grow flex flex-col relative pt-32 pb-16">
        <div className="px-6 w-full max-w-4xl mx-auto z-10">
          {children}
        </div>
      </main>
      
      <footer className="py-12 text-center text-slate-400 border-t border-white/10 mt-auto bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-2">
            <p className="font-serif italic text-sm text-slate-400 opacity-80">
                "The only way to do great work is to love what you do."
            </p>
            <p className="text-[10px] uppercase tracking-widest mt-4 opacity-50 text-slate-500">
                © 2024 OBT System • Powered by Gemini Advanced
            </p>
        </div>
      </footer>
    </div>
  );
};