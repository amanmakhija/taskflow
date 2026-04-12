import { useState, useCallback } from 'react';

interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastListeners: Array<(toasts: ToastData[]) => void> = [];
let toastList: ToastData[] = [];

function notify(listeners: typeof toastListeners, data: ToastData[]) {
  listeners.forEach((l) => l(data));
}

export function toast(opts: Omit<ToastData, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  toastList = [...toastList, { ...opts, id }];
  notify(toastListeners, toastList);
  setTimeout(() => {
    toastList = toastList.filter((t) => t.id !== id);
    notify(toastListeners, toastList);
  }, 4000);
}

export function useToastState() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const subscribe = useCallback(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts);
    };
  }, []);
  return { toasts, subscribe };
}
