import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, { variant = "info", duration = 4500 } = {}) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, variant }]);
      const timeout = setTimeout(() => dismiss(id), duration);
      timeoutsRef.current.set(id, timeout);
      return id;
    },
    [dismiss]
  );

  useEffect(() => () => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();
  }, []);

  const value = useMemo(
    () => ({
      info: (msg, opts) => push(msg, { ...opts, variant: "info" }),
      success: (msg, opts) => push(msg, { ...opts, variant: "success" }),
      error: (msg, opts) => push(msg, { ...opts, variant: "error", duration: opts?.duration ?? 6500 }),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.variant}`}>
            <span>{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              className="toast-dismiss"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return ctx;
}
