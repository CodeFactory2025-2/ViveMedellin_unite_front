"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, setPendingRedirect } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    if (!isAuthenticated) {
      const target = search ? `${pathname}?${search}` : pathname;
      setPendingRedirect(target);
      router.replace(`/login?from=${encodeURIComponent(target)}`);
    }
  }, [isAuthenticated, pathname, search, router, setPendingRedirect]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span>Redirigiendo…</span>
      </div>
    );
  }

  return <>{children}</>;
}
