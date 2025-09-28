"use client";

import type { ReactNode } from "react";

import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description ? (
                <div className="text-sm opacity-90">{description as ReactNode}</div>
              ) : null}
            </div>
            {action ? <div>{action}</div> : null}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
