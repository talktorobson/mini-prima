
import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  title: string;
  description: string;
  variant: 'success' | 'destructive' | 'default';
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      const { title, description, variant = 'default' } = event.detail;
      const id = Math.random().toString(36).substr(2, 9);
      
      const newToast: Toast = {
        id,
        title,
        description,
        variant
      };

      setToasts(prev => [...prev, newToast]);

      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 5000);
    };

    window.addEventListener('show-toast', handleShowToast as EventListener);

    return () => {
      window.removeEventListener('show-toast', handleShowToast as EventListener);
    };
  }, []);

  const toast = ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const event = new CustomEvent('show-toast', {
      detail: { title, description, variant }
    });
    window.dispatchEvent(event);
  };

  return { toast, toasts };
};
