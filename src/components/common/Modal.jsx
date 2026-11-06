import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showClose = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Dark backdrop overlay */}
      <div
        className="fixed inset-0 bg-[#2D3250]/75 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centering wrapper with relative z-index strictly ABOVE backdrop */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center relative z-20 pointer-events-none">
        <div
          className={`pointer-events-auto relative z-30 w-full ${
            sizeClasses[size] || sizeClasses.md
          } transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all border border-gray-100 flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-100 bg-[#2D3250] px-6 py-5 text-white shrink-0">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-1 text-xs text-gray-300">
                  {subtitle}
                </p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
