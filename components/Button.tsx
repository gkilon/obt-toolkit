
import React, { useState, useEffect } from 'react';
import { translations } from '../translations';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const [lang, setLang] = useState<'he' | 'en'>(() => (localStorage.getItem('obt_lang') as 'he' | 'en') || 'he');
  
  useEffect(() => {
    const handleLangChange = (e: any) => setLang(e.detail);
    window.addEventListener('langChange', handleLangChange);
    return () => window.removeEventListener('langChange', handleLangChange);
  }, []);

  const t = translations[lang];
  
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-3.5 font-medium text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed tracking-wide";
  
  const variants = {
    primary: "bg-[#c25400] hover:bg-[#e66a00] text-white rounded-lg shadow-lg active:scale-[0.98]",
    secondary: "bg-onyx-700 hover:bg-onyx-600 text-white rounded-lg",
    outline: "bg-transparent text-white border border-white/10 hover:bg-white/5 rounded-lg",
    ghost: "bg-transparent text-white/60 hover:text-white"
  };

  const finalClassName = `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <button 
      className={finalClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{t.processing}</span>
        </div>
      ) : children}
    </button>
  );
};
