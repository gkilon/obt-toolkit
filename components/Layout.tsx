import React from 'react';
import { Link } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-midnight-900 bg-radial-glow text-slate-100 selection:bg-primary-500 selection:text-white">
      
      {/* Decorative Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent-900/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Glass Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-midnight-900/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
                <div className="absolute inset-0 bg-primary-500 blur opacity-40 group-hover:opacity-70 transition-opacity rounded-lg"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold font-heading shadow-lg border border-white/10">
                360
                </div>
            </div>
            <span className="font-heading font-semibold text-xl tracking-tight text-white group-hover:text-primary-400 transition-colors">
              OBT <span className="font-light text-slate-400">System</span>
            </span>
          </Link>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-12 relative z-10">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 bg-midnight-900/50 backdrop-blur-sm relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 uppercase tracking-widest">
            <p>© 2024 OBT Intelligent Feedback</p>
            <p className="mt-2 md:mt-0">Secured & Anonymous</p>
        </div>
      </footer>
    </div>
  );
};