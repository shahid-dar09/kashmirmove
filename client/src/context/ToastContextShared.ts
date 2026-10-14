import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastContextType {
  addToast: (messageOrTitle: string, typeOrDesc?: string | ToastType, durationOrType?: number | string | ToastType) => void;
}

export const ToastContext = createContext<ToastContextType>({
  addToast: () => {},
});

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
