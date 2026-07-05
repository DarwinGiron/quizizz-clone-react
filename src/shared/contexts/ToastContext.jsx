import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return ctx;
};

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    classes: 'bg-white border-green-200 text-gray-800',
    iconClass: 'text-green-600',
  },
  error: {
    icon: XCircle,
    classes: 'bg-white border-red-200 text-gray-800',
    iconClass: 'text-red-600',
  },
  info: {
    icon: Info,
    classes: 'bg-white border-indigo-200 text-gray-800',
    iconClass: 'text-indigo-600',
  },
};

let idSeq = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, variant = 'info', duration = 4000) => {
      const id = ++idSeq;
      setToasts((prev) => [...prev, { id, message, variant }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [remove]
  );

  const value = {
    show,
    success: (message, duration) => show(message, 'success', duration),
    error: (message, duration) => show(message, 'error', duration),
    info: (message, duration) => show(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0">
        {toasts.map(({ id, message, variant }) => {
          const { icon: Icon, classes, iconClass } = VARIANTS[variant] || VARIANTS.info;
          return (
            <div
              key={id}
              className={`flex items-start gap-3 border rounded-xl shadow-lg p-4 animate-[fadeIn_0.2s_ease-out] ${classes}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClass}`} />
              <p className="text-sm font-medium flex-1">{message}</p>
              <button
                onClick={() => remove(id)}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
