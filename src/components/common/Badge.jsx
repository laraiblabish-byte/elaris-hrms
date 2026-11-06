import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const variantClasses = {
    // Brand palette styles
    default: 'bg-[#676F9D]/15 text-[#424769] border border-[#676F9D]/30',
    primary: 'bg-[#2D3250] text-[#FFFFFF]',
    accent: 'bg-[#FFB17A]/20 text-[#2D3250] border border-[#FFB17A]/40 font-semibold',
    secondary: 'bg-[#424769]/10 text-[#424769]',
    
    // Status styles
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    info: 'bg-sky-50 text-sky-700 border border-sky-200',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.default
      } ${className}`}
    >
      {children}
    </span>
  );
};

