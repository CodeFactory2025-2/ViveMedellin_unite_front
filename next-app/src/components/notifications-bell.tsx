"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const { notifications, unreadCount, markAllAsRead, clearAll, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!open) {
        return;
      }

      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const hasUnread = notifications.some((notification) => !notification.read);
    if (!hasUnread) {
      return;
    }
    markAllAsRead();
  }, [open, notifications, markAllAsRead]);

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        aria-label="Notificaciones"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="relative"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-destructive px-1.5 py-px text-xs font-semibold text-destructive-foreground">
            {unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Centro de notificaciones"
          className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] animate-in fade-in-0 zoom-in-95"
        >
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Notificaciones</CardTitle>
                <CardDescription>
                  {notifications.length ? `${notifications.length} mensajes recientes` : "Sin novedades"}
                </CardDescription>
              </div>
              {notifications.length ? (
                <Button variant="ghost" size="icon" onClick={clearAll} aria-label="Limpiar notificaciones">
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length ? (
                <ul className="space-y-3">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={cn(
                        "rounded-md border p-3 text-sm",
                        notification.read ? "bg-background" : "bg-primary/5",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{notification.title}</p>
                          <p className="text-muted-foreground text-sm leading-snug">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                            aria-label="Marcar como leída"
                          >
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no tienes notificaciones.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
