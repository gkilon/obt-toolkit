import React from 'react';
import { Link } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col text-onyx-100 relative overflow-x-hidden">
      
      {/* Background Effects */}
      {/* Moved z-index to 0 and removed high opacity to prevent content obscuring */}
      <div className="fixed inset-0 bg-noise pointer-events-none z-0 mix-blend-overlay opacity-20"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-bronze-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-onyx-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-onyx-900/90 backdrop-blur-md border-b border-onyx-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-4 group">
             {/* Icon Box */}
             <div className="bg-onyx-800 p-2.5 rounded-lg border border-onyx-700 shadow-sm text-bronze-500 group-hover:text-bronze-400 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <line x1="3" x2="21" y1="9" y2="9"/>
                  <line x1="9" x2="9" y1="21" y2="9"/>
               </svg>
             </div>
             
             {/* Logo Text */}
             <div>
                <h1 className="text-2xl font-normal text-onyx-100 tracking-tight leading-none">
                    OBT 
                    <span className="text-onyx-600 font-light mx-1">|</span> 
                    <span className="font-light tracking-wide text-onyx-300">360 Workspace</span>
                </h1>
             </div>
          </Link>

        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-12 relative z-10">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-onyx-800 bg-onyx-900/80 py-8 relative z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-onyx-500 uppercase tracking-widest">
            <p>© 2024 OBT Intelligent Feedback</p>
            <p className="mt-2 md:mt-0">Secured & Anonymous</p>
        </div>
      </footer>
    </div>
  );
};