// src/lib/notifications-api.ts
// API simulada de notificaciones basada en localStorage

export type NotificationType =
  | "group:new-member"
  | "group:member-left"
  | "group:new-post"
  | "group:new-comment"
  | "system";

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
  data?: Record<string, unknown>;
}

const NOTIFICATIONS_KEY = "vive-medellin-notifications";
const isBrowser = typeof window !== "undefined";

const readFromStorage = (): NotificationPayload[] => {
  if (!isBrowser) {
    return [];
  }

  const stored = window.localStorage.getItem(NOTIFICATIONS_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed as NotificationPayload[];
    }
    return [];
  } catch (error) {
    console.warn("No se pudieron leer las notificaciones almacenadas", error);
    return [];
  }
};

const persist = (notifications: NotificationPayload[]) => {
  if (!isBrowser) {
    return;
  }
  window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new Event("notifications:updated"));
};

export const getNotifications = (): NotificationPayload[] => {
  return readFromStorage().sort((a, b) => b.createdAt - a.createdAt);
};

export const addNotification = (notification: NotificationPayload) => {
  const notifications = readFromStorage();
  notifications.push(notification);
  persist(notifications);
};

export const markNotificationAsRead = (id: string) => {
  const notifications = readFromStorage();
  const index = notifications.findIndex((notification) => notification.id === id);

  if (index === -1 || notifications[index].read) {
    return;
  }

  notifications[index] = { ...notifications[index], read: true };
  persist(notifications);
};

export const markAllNotificationsAsRead = () => {
  const notifications = readFromStorage();
  const hasUnread = notifications.some((notification) => !notification.read);

  if (!hasUnread) {
    return;
  }

  const updated = notifications.map((notification) => ({
    ...notification,
    read: true,
  }));
  persist(updated);
};

export const clearNotifications = () => {
  if (!isBrowser) {
    return;
  }
  window.localStorage.removeItem(NOTIFICATIONS_KEY);
  window.dispatchEvent(new Event("notifications:updated"));
};
