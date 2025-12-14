import React from 'react';
import { Link } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-onyx-900 text-onyx-200 selection:bg-bronze-700 selection:text-white">
      
      {/* Glass Header */}
      <header className="sticky top-0 z-50 border-b border-onyx-700/50 bg-onyx-900/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-bronze-700 rounded flex items-center justify-center text-white font-bold font-heading shadow border border-bronze-600/50">
              360
            </div>
            <span className="font-heading font-normal text-lg tracking-wide text-onyx-100 group-hover:text-bronze-400 transition-colors">
              OBT <span className="text-onyx-500">System</span>
            </span>
          </Link>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-12 relative z-10">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-onyx-800 bg-onyx-900 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-onyx-500 uppercase tracking-widest">
            <p>© 2024 OBT Intelligent Feedback</p>
            <p className="mt-2 md:mt-0">Secured & Anonymous</p>
        </div>
      </footer>
    </div>
  );
};