import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    const duration = toast.duration !== undefined ? toast.duration : 4000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  let borderStyle = 'border-l-4 border-[#FFB17A]';
  let Icon = Info;
  let iconColor = 'text-[#FFB17A]';

  if (toast.type === 'success') {
    borderStyle = 'border-l-4 border-emerald-400';
    Icon = CheckCircle2;
    iconColor = 'text-emerald-400';
  } else if (toast.type === 'error') {
    borderStyle = 'border-l-4 border-rose-400';
    Icon = AlertCircle;
    iconColor = 'text-rose-400';
  } else if (toast.type === 'warning') {
    borderStyle = 'border-l-4 border-amber-400';
    Icon = AlertTriangle;
    iconColor = 'text-amber-400';
  }

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl bg-[#2D3250] text-white backdrop-blur-md transition-all duration-300 animate-slide-in ${borderStyle}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 text-xs leading-relaxed font-medium">
        {toast.message}
      </div>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-white/10"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast container with high z-index (z-[9999]) to always appear above modals */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
