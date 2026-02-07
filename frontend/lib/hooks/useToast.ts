import { useState, useCallback } from 'react';
import { ToastType, ToastMessage } from '../types';

export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((type: ToastType, title: string, description?: string) => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, type, title, description }]);

        // Auto remove after 5s
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
}
