'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function showToast(message: string, type: Toast['type'] = 'info') {
  const toast: Toast = { id: String(++toastId), message, type };
  listeners.forEach(fn => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 4000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px]',
            toast.type === 'success' && 'bg-green-600',
            toast.type === 'warning' && 'bg-yellow-600',
            toast.type === 'info' && 'bg-blue-600'
          )}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
