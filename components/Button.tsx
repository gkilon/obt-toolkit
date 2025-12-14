import React from 'react';

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
  
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-2 rounded font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide";
  
  const variants = {
    // Bronze Primary
    primary: "bg-bronze-700 hover:bg-bronze-600 text-white shadow-lg border border-bronze-600/50",
    
    // Onyx Dark
    secondary: "bg-onyx-700 hover:bg-onyx-600 text-onyx-100 border border-onyx-600",
    
    // Bronze Outline
    outline: "bg-transparent text-bronze-400 border border-bronze-700 hover:bg-bronze-700/10",
    
    // Minimal
    ghost: "bg-transparent text-onyx-400 hover:text-onyx-100 hover:bg-onyx-800"
  };

  const finalClassName = `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <button 
      className={finalClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -mr-1 ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>טוען...</span>
        </>
      ) : children}
    </button>
  );
};