import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'gold';
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
  // Updated Modern Base Styles
  const baseStyles = "px-8 py-3 rounded-lg font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 shadow-lg";
  
  const variants = {
    // Primary is now the Deep Wine/Burgundy
    primary: "bg-gradient-to-r from-bronze-800 to-bronze-600 text-white hover:from-bronze-900 hover:to-bronze-700 shadow-bronze-900/20 border border-transparent",
    // Secondary is clean white
    secondary: "bg-white text-ink border border-slate-200 hover:border-bronze-500 hover:text-bronze-700 hover:shadow-xl",
    // Outline is subtle
    outline: "bg-transparent text-slate-300 hover:text-white border-b border-transparent hover:border-white shadow-none rounded-none px-0 py-1 h-auto hover:translate-y-0",
    // Gold is now "Action/Submit" -> Emerald Green gradient for variety or keep the Wine theme but brighter
    gold: "bg-gradient-to-r from-bronze-600 to-rose-500 text-white hover:from-bronze-700 hover:to-rose-600 shadow-rose-900/20"
  };

  const finalClassName = variant === 'outline' 
    ? `font-sans text-sm tracking-wide text-slate-400 hover:text-white border-b border-white/20 hover:border-white transition-colors pb-0.5 disabled:opacity-50 ${className}`
    : `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <button 
      className={finalClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm tracking-wider">טוען...</span>
        </>
      ) : children}
    </button>
  );
};