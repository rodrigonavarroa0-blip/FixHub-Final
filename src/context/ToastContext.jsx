/* TOAST CONTEXT - REACT */
/* Small notifications ("Service saved.", "Status updated.") that any component can show
   with:  const showToast = useToast();  showToast("Text", "success" | "error" | "info"); */

import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);
const VISIBLE_TIME = 3500;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = "success") => {
        const id = Date.now() + Math.random();
        setToasts((current) => [...current, { id, message, type, hiding: false }]);
        //After a few seconds the toast gets the "toast-hide" class, which plays the exit animation.
        setTimeout(() => {
            setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, hiding: true } : toast)));
        }, VISIBLE_TIME);
    }, []);

    //When the exit animation ends, the toast is removed from the list.
    function removeToast(id) {
        setToasts((current) => current.filter((toast) => toast.id !== id || !toast.hiding));
    }

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div className="toast-region" aria-live="polite">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast toast-${toast.type}${toast.hiding ? " toast-hide" : ""}`}
                        onAnimationEnd={() => removeToast(toast.id)}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
