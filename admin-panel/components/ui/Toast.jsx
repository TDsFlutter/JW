"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cn } from "./cn";

const ToastContext = createContext(null);

const TONES = {
  success: "border-l-[#52c41a] bg-ok-bg",
  error: "border-l-crimson bg-danger-bg",
  info: "border-l-gold bg-[#fbf7ea]",
};

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = ++counter;
      setToasts((t) => [...t, { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[2000] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-card border border-line border-l-4 bg-white px-4 py-3 shadow-lg animate-[slideIn_0.25s_ease-out]",
              TONES[t.type] || TONES.info
            )}
          >
            <p className="flex-1 text-sm text-ink">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="-mr-1 text-gray-400 transition-colors hover:text-ink"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: () => {}, dismiss: () => {} };
  return ctx;
}

/**
 * Bridges legacy `error`/`success` string state into the toast system.
 * Drop into a component and pass the current error/success values.
 */
export function ToastBridge({ error, success }) {
  const { toast } = useToast();
  useEffect(() => {
    if (error) toast(error, "error");
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (success) toast(success, "success");
  }, [success]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
