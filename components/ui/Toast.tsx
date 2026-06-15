"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastHandlers = React.useMemo(() => ({
    success: (msg: string) => addToast(msg, "success"),
    error: (msg: string) => addToast(msg, "error"),
    warning: (msg: string) => addToast(msg, "warning"),
    info: (msg: string) => addToast(msg, "info"),
  }), [addToast]);

  return (
    <ToastContext.Provider value={toastHandlers}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          let styles = "";
          let Icon = Info;

          switch (t.type) {
            case "success":
              styles = "bg-white border-emerald-100 text-emerald-800 shadow-emerald-100/40";
              Icon = CheckCircle2;
              break;
            case "error":
              styles = "bg-white border-rose-100 text-rose-800 shadow-rose-100/40";
              Icon = AlertCircle;
              break;
            case "warning":
              styles = "bg-white border-amber-100 text-amber-800 shadow-amber-100/40";
              Icon = AlertTriangle;
              break;
            case "info":
              styles = "bg-white border-sky-100 text-sky-800 shadow-sky-100/40";
              Icon = Info;
              break;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg transition-all duration-300 animate-in slide-in-from-top-4 slide-in-from-right-4 duration-300 ${styles}`}
            >
              <div className="shrink-0 mt-0.5">
                {t.type === "success" && <Icon className="text-emerald-500" size={18} />}
                {t.type === "error" && <Icon className="text-rose-500" size={18} />}
                {t.type === "warning" && <Icon className="text-amber-500" size={18} />}
                {t.type === "info" && <Icon className="text-sky-500" size={18} />}
              </div>
              <div className="flex-1 text-xs font-bold leading-relaxed text-gray-800">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-lg hover:bg-gray-50"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
