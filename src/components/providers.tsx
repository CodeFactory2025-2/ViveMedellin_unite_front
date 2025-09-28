"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/hooks/useAuth";
import { NotificationsProvider } from "@/hooks/useNotifications";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <NotificationsProvider>
      <AuthProvider>{children}</AuthProvider>
    </NotificationsProvider>
  );
}
