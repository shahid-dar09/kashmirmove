import { useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ToastContext } from './ToastContextShared';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} className="text-secondary" />;
      case 'error': return <AlertCircle size={18} className="text-rose" />;
      case 'warning': return <AlertTriangle size={18} className="text-saffron" />;
      default: return <Info size={18} className="text-arctic" />;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success': return 'border-secondary/20 bg-secondary/5';
      case 'error': return 'border-rose/20 bg-rose/5';
      case 'warning': return 'border-saffron/20 bg-saffron/5';
      default: return 'border-arctic/20 bg-arctic/5';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 z-[9999] flex flex-col gap-3 sm:max-w-md sm:w-auto">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-xl animate-scale-in ${getColors(toast.type)} shadow-premium`}
          >
            <div className="shrink-0">{getIcon(toast.type)}</div>
            <p className="text-sm font-bold flex-1">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 transition-all duration-linear" style={{ width: '100%', animation: `shimmer ${toast.duration}ms linear forwards` }} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
