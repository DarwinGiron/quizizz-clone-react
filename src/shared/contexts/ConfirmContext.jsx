import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);

// useConfirm() reemplaza a window.confirm(): devuelve una Promise<boolean>
// para poder seguir escribiendo `if (!(await confirm('...'))) return;`
export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm debe usarse dentro de un ConfirmProvider');
  }
  return ctx;
};

export const ConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({
        message,
        title: options.title || '¿Estás seguro?',
        confirmLabel: options.confirmLabel || 'Confirmar',
        cancelLabel: options.cancelLabel || 'Cancelar',
        danger: options.danger !== false,
      });
    });
  }, []);

  const close = (result) => {
    setDialog(null);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-lg shrink-0 ${dialog.danger ? 'bg-red-100' : 'bg-indigo-100'}`}>
                <AlertTriangle className={`w-5 h-5 ${dialog.danger ? 'text-red-600' : 'text-indigo-600'}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{dialog.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{dialog.message}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {dialog.cancelLabel}
              </button>
              <button
                onClick={() => close(true)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-shadow hover:shadow-lg ${
                  dialog.danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                }`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
