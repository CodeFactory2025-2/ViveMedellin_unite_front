// src/lib/notifications-api.ts
// API simulada para gestión de notificaciones

// Tipos
export interface Notification {
  id: string;
  userId: string;
  type: 'group_invite' | 'event_reminder' | 'new_member' | 'new_event' | 'message' | 'system';
  title: string;
  message: string;
  relatedId?: string; // ID del grupo, evento, etc. relacionado
  read: boolean;
  createdAt: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Simulación de base de datos
const NOTIFICATIONS_KEY = 'vive-medellin-notifications';

// Utilidades
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const getNotifications = (): Notification[] => {
  const notifications = localStorage.getItem(NOTIFICATIONS_KEY);
  return notifications ? JSON.parse(notifications) : [];
};

const saveNotifications = (notifications: Notification[]): void => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

const delay = (ms: number = 800): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// API Endpoints simulados

/**
 * Obtiene todas las notificaciones de un usuario
 */
export const getUserNotifications = async (userId: string): Promise<ApiResponse<Notification[]>> => {
  await delay();
  
  const allNotifications = getNotifications();
  const userNotifications = allNotifications.filter(n => n.userId === userId);
  
  // Ordenar por fecha, las más recientes primero
  userNotifications.sort((a, b) => b.createdAt - a.createdAt);
  
  return {
    success: true,
    data: userNotifications
  };
};

/**
 * Obtiene el conteo de notificaciones no leídas
 */
export const getUnreadCount = async (userId: string): Promise<ApiResponse<number>> => {
  await delay();
  
  const allNotifications = getNotifications();
  const unreadCount = allNotifications.filter(n => n.userId === userId && !n.read).length;
  
  return {
    success: true,
    data: unreadCount
  };
};

/**
 * Marca una notificación como leída
 */
export const markAsRead = async (notificationId: string, userId: string): Promise<ApiResponse<Notification>> => {
  await delay();
  
  const allNotifications = getNotifications();
  const notificationIndex = allNotifications.findIndex(n => n.id === notificationId && n.userId === userId);
  
  if (notificationIndex === -1) {
    return {
      success: false,
      error: 'Notificación no encontrada'
    };
  }
  
  allNotifications[notificationIndex].read = true;
  saveNotifications(allNotifications);
  
  return {
    success: true,
    data: allNotifications[notificationIndex]
  };
};

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
export const markAllAsRead = async (userId: string): Promise<ApiResponse<null>> => {
  await delay();
  
  const allNotifications = getNotifications();
  
  // Encontrar y actualizar todas las notificaciones no leídas del usuario
  for (const notification of allNotifications) {
    if (notification.userId === userId && !notification.read) {
      notification.read = true;
    }
  }
  
  saveNotifications(allNotifications);
  
  return {
    success: true
  };
};

/**
 * Elimina una notificación
 */
export const deleteNotification = async (notificationId: string, userId: string): Promise<ApiResponse<null>> => {
  await delay();
  
  const allNotifications = getNotifications();
  const updatedNotifications = allNotifications.filter(n => !(n.id === notificationId && n.userId === userId));
  
  if (updatedNotifications.length === allNotifications.length) {
    return {
      success: false,
      error: 'Notificación no encontrada'
    };
  }
  
  saveNotifications(updatedNotifications);
  
  return {
    success: true
  };
};

/**
 * Elimina todas las notificaciones leídas de un usuario
 */
export const deleteAllRead = async (userId: string): Promise<ApiResponse<null>> => {
  await delay();
  
  const allNotifications = getNotifications();
  const updatedNotifications = allNotifications.filter(n => !(n.userId === userId && n.read));
  
  saveNotifications(updatedNotifications);
  
  return {
    success: true
  };
};

/**
 * Crea una nueva notificación para un usuario (para uso interno en la API)
 */
export const createNotification = async (
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  relatedId?: string
): Promise<Notification> => {
  const allNotifications = getNotifications();
  
  const newNotification: Notification = {
    id: generateId(),
    userId,
    type,
    title,
    message,
    relatedId,
    read: false,
    createdAt: Date.now()
  };
  
  allNotifications.push(newNotification);
  saveNotifications(allNotifications);
  
  return newNotification;
};

// Inicializar datos de prueba para notificaciones
export const initializeMockNotificationsData = (): void => {
  const existingNotifications = getNotifications();
  
  if (existingNotifications.length === 0) {
    const notifications: Notification[] = [
      {
        id: '1',
        userId: '1', // Usuario Demo
        type: 'group_invite',
        title: 'Invitación a grupo',
        message: 'Has sido invitado a unirte al grupo "Voluntarios El Poblado"',
        relatedId: '2', // ID del grupo Voluntarios El Poblado
        read: false,
        createdAt: Date.now() - 86400000 // 1 día atrás
      },
      {
        id: '2',
        userId: '1', // Usuario Demo
        type: 'event_reminder',
        title: 'Recordatorio de evento',
        message: 'El evento "Caminata ecológica" en el grupo "Amigos del Parque Arví" comenzará mañana',
        relatedId: '101', // ID del evento
        read: true,
        createdAt: Date.now() - 172800000 // 2 días atrás
      },
      {
        id: '3',
        userId: '2', // Administrador
        type: 'new_member',
        title: 'Nuevo miembro',
        message: 'Usuario Demo se ha unido a tu grupo "Voluntarios El Poblado"',
        relatedId: '2', // ID del grupo Voluntarios El Poblado
        read: false,
        createdAt: Date.now() - 259200000 // 3 días atrás
      }
    ];
    
    saveNotifications(notifications);
    console.log('[API] Datos de prueba de notificaciones inicializados');
  }
};

// Inicializar datos de prueba
initializeMockNotificationsData();