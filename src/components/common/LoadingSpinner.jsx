import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ message = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Loader2
        className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-[#FFB17A] mb-3`}
      />
      {message && <p className="text-sm font-medium text-[#424769]">{message}</p>}
    </div>
  );
};

