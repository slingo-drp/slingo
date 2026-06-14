import { createContext, useContext } from "react";

export type ToastTone = "success" | "info" | "error";

export type ToastOptions = {
  durationMs?: number;
  message: string;
  tone?: ToastTone;
};

export type ToastContextValue = {
  showToast: (messageOrOptions: string | ToastOptions) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
