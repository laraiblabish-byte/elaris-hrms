import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  onClick,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-[0.98]';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#2D3250] text-white hover:bg-[#424769] focus:ring-[#676F9D]',
    accent:
      'bg-[#FFB17A] text-[#2D3250] font-semibold hover:bg-[#fca05f] focus:ring-[#FFB17A] shadow-[#FFB17A]/20',
    secondary:
      'bg-[#676F9D] text-white hover:bg-[#424769] focus:ring-[#676F9D]',
    outline:
      'bg-transparent border border-[#676F9D]/40 text-[#424769] hover:bg-[#676F9D]/10 focus:ring-[#676F9D]',
    ghost:
      'bg-transparent text-[#424769] hover:bg-gray-100 focus:ring-gray-300 shadow-none',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
    white:
      'bg-white text-[#2D3250] hover:bg-gray-50 focus:ring-[#676F9D] border border-gray-200',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

