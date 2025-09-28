"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  addNotification as pushNotification,
  clearNotifications,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationPayload,
} from "@/lib/notifications-api";

interface NotificationsContextValue {
  notifications: NotificationPayload[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  addNotification: (notification: NotificationPayload) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const update = () => setNotifications(getNotifications());
    update();

    window.addEventListener("notifications:updated", update);
    return () => window.removeEventListener("notifications:updated", update);
  }, []);

  const addNotification = (notification: NotificationPayload) => {
    pushNotification(notification);
    setNotifications(getNotifications());
  };

  const markAsRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications(getNotifications());
  };

  const markAllAsRead = () => {
    markAllNotificationsAsRead();
    setNotifications(getNotifications());
  };

  const clearAll = () => {
    clearNotifications();
    setNotifications([]);
  };

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      markAsRead,
      markAllAsRead,
      clearAll,
      addNotification,
    }),
    [notifications],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications debe usarse dentro de NotificationsProvider");
  }
  return context;
};

