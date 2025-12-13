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
  
  const baseStyles = "relative overflow-hidden inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group";
  
  const variants = {
    // Vibrant Coral Gradient with Glow
    primary: "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:scale-[1.02] border border-transparent",
    
    // Dark Glass
    secondary: "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-white/20 backdrop-blur-md",
    
    // Coral Outline
    outline: "bg-transparent text-primary-400 border border-primary-500/30 hover:bg-primary-500/10 hover:border-primary-500",
    
    // Minimal
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5"
  };

  const finalClassName = `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <button 
      className={finalClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Subtle shine animation for primary */}
      {variant === 'primary' && (
          <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[25deg] group-hover:animate-[shimmer_1.5s_infinite]" />
      )}
      
      {isLoading ? (
        <>
          <svg className="animate-spin -mr-1 ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-white">טוען...</span>
        </>
      ) : children}
    </button>
  );
};