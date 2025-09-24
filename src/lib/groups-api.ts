// src/lib/groups-api.ts
// API simulada para la gestión de grupos

import { User } from './api';

// Tipos
export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  theme?: string;           // Tema específico del grupo
  participationRules?: string; // Reglas de participación
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  imageUrl?: string;
  creatorId: string;
  createdAt: number;
  members: GroupMember[];
  events: Event[];
  isPublic: boolean;
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: number;
}

export interface Event {
  id: string;
  groupId: string;
  title: string;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  startDate: number;
  endDate?: number;
  imageUrl?: string;
  attendees: string[]; // User IDs
  createdBy: string; // User ID
  createdAt: number;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  category: string;
  theme?: string;           // Tema específico del grupo
  participationRules?: string; // Reglas de participación
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  imageUrl?: string;
  isPublic: boolean;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  category?: string;
  theme?: string;
  participationRules?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  imageUrl?: string;
  isPublic?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Simulación de base de datos
const GROUPS_KEY = 'vive-medellin-groups';

// Utilidades
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const getGroups = (): Group[] => {
  const groups = localStorage.getItem(GROUPS_KEY);
  return groups ? JSON.parse(groups) : [];
};

const saveGroups = (groups: Group[]): void => {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
};

const delay = (ms: number = 800): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// API Endpoints simulados

/**
 * Obtiene la lista de todos los grupos (públicos y privados a los que pertenece el usuario)
 */
export const getAllGroups = async (userId: string): Promise<ApiResponse<Group[]>> => {
  await delay();
  
  const allGroups = getGroups();
  
  // Filtrar para mostrar solo los grupos públicos y los privados a los que pertenece el usuario
  const accessibleGroups = allGroups.filter(group => 
    group.isPublic || group.members.some(m => m.userId === userId)
  );
  
  return {
    success: true,
    data: accessibleGroups
  };
};

/**
 * Obtiene los detalles de un grupo específico
 */
export const getGroupById = async (groupId: string, userId: string): Promise<ApiResponse<Group>> => {
  await delay();
  
  const groups = getGroups();
  const group = groups.find(g => g.id === groupId);
  
  if (!group) {
    return {
      success: false,
      error: 'Grupo no encontrado'
    };
  }
  
  // Verificar si el usuario tiene acceso al grupo (si es público o es miembro)
  const hasAccess = group.isPublic || group.members.some(m => m.userId === userId);
  
  if (!hasAccess) {
    return {
      success: false,
      error: 'No tienes permiso para ver este grupo'
    };
  }
  
  return {
    success: true,
    data: group
  };
};

/**
 * Crea un nuevo grupo
 */
export const createGroup = async (request: CreateGroupRequest, userId: string): Promise<ApiResponse<Group>> => {
  await delay();
  
  const groups = getGroups();
  
  // Crear el nuevo grupo
  const newGroup: Group = {
    id: generateId(),
    name: request.name,
    description: request.description,
    category: request.category,
    theme: request.theme,
    participationRules: request.participationRules,
    location: request.location,
    imageUrl: request.imageUrl,
    creatorId: userId,
    createdAt: Date.now(),
    members: [
      {
        userId: userId,
        role: 'admin',
        joinedAt: Date.now()
      }
    ],
    events: [],
    isPublic: request.isPublic
  };
  
  groups.push(newGroup);
  saveGroups(groups);
  
  return {
    success: true,
    data: newGroup
  };
};

/**
 * Actualiza un grupo existente
 */
export const updateGroup = async (groupId: string, request: UpdateGroupRequest, userId: string): Promise<ApiResponse<Group>> => {
  await delay();
  
  const groups = getGroups();
  const groupIndex = groups.findIndex(g => g.id === groupId);
  
  if (groupIndex === -1) {
    return {
      success: false,
      error: 'Grupo no encontrado'
    };
  }
  
  const group = groups[groupIndex];
  
  // Verificar que el usuario es administrador del grupo
  const isAdmin = group.members.some(m => m.userId === userId && m.role === 'admin');
  
  if (!isAdmin) {
    return {
      success: false,
      error: 'No tienes permisos para editar este grupo'
    };
  }
  
  // Actualizar los campos proporcionados
  const updatedGroup: Group = {
    ...group,
    name: request.name ?? group.name,
    description: request.description ?? group.description,
    category: request.category ?? group.category,
    theme: request.theme ?? group.theme,
    participationRules: request.participationRules ?? group.participationRules,
    location: request.location ?? group.location,
    imageUrl: request.imageUrl ?? group.imageUrl,
    isPublic: request.isPublic ?? group.isPublic
  };
  
  groups[groupIndex] = updatedGroup;
  saveGroups(groups);
  
  return {
    success: true,
    data: updatedGroup
  };
};

/**
 * Elimina un grupo
 */
export const deleteGroup = async (groupId: string, userId: string): Promise<ApiResponse<null>> => {
  await delay();
  
  const groups = getGroups();
  const group = groups.find(g => g.id === groupId);
  
  if (!group) {
    return {
      success: false,
      error: 'Grupo no encontrado'
    };
  }
  
  // Solo el creador puede eliminar el grupo
  if (group.creatorId !== userId) {
    return {
      success: false,
      error: 'No tienes permisos para eliminar este grupo'
    };
  }
  
  const updatedGroups = groups.filter(g => g.id !== groupId);
  saveGroups(updatedGroups);
  
  return {
    success: true
  };
};

/**
 * Une a un usuario a un grupo
 */
export const joinGroup = async (groupId: string, userId: string): Promise<ApiResponse<Group>> => {
  await delay();
  
  const groups = getGroups();
  const groupIndex = groups.findIndex(g => g.id === groupId);
  
  if (groupIndex === -1) {
    return {
      success: false,
      error: 'Grupo no encontrado'
    };
  }
  
  const group = groups[groupIndex];
  
  // Verificar si el grupo es público o si el usuario ya es miembro
  if (!group.isPublic) {
    return {
      success: false,
      error: 'Este es un grupo privado'
    };
  }
  
  if (group.members.some(m => m.userId === userId)) {
    return {
      success: false,
      error: 'Ya eres miembro de este grupo'
    };
  }
  
  // Añadir al usuario como miembro
  group.members.push({
    userId,
    role: 'member',
    joinedAt: Date.now()
  });
  
  groups[groupIndex] = group;
  saveGroups(groups);
  
  return {
    success: true,
    data: group
  };
};

/**
 * Abandona un grupo
 */
export const leaveGroup = async (groupId: string, userId: string): Promise<ApiResponse<null>> => {
  await delay();
  
  const groups = getGroups();
  const groupIndex = groups.findIndex(g => g.id === groupId);
  
  if (groupIndex === -1) {
    return {
      success: false,
      error: 'Grupo no encontrado'
    };
  }
  
  const group = groups[groupIndex];
  
  // Verificar si el usuario es el creador
  if (group.creatorId === userId) {
    return {
      success: false,
      error: 'Como creador del grupo, no puedes abandonarlo. Debes eliminarlo o transferir la propiedad primero.'
    };
  }
  
  // Verificar si el usuario es miembro
  if (!group.members.some(m => m.userId === userId)) {
    return {
      success: false,
      error: 'No eres miembro de este grupo'
    };
  }
  
  // Eliminar al usuario de la lista de miembros
  group.members = group.members.filter(m => m.userId !== userId);
  
  groups[groupIndex] = group;
  saveGroups(groups);
  
  return {
    success: true
  };
};

/**
 * Cambia el rol de un miembro en el grupo
 */
export const changeUserRole = async (
  groupId: string, 
  targetUserId: string, 
  newRole: 'admin' | 'moderator' | 'member',
  currentUserId: string
): Promise<ApiResponse<Group>> => {
  await delay();
  
  const groups = getGroups();
  const groupIndex = groups.findIndex(g => g.id === groupId);
  
  if (groupIndex === -1) {
    return {
      success: false,
      error: 'Grupo no encontrado'
    };
  }
  
  const group = groups[groupIndex];
  
  // Verificar que el usuario actual es administrador
  const isAdmin = group.members.some(m => m.userId === currentUserId && m.role === 'admin');
  
  if (!isAdmin) {
    return {
      success: false,
      error: 'No tienes permisos para cambiar roles en este grupo'
    };
  }
  
  // Verificar que el usuario objetivo existe en el grupo
  const memberIndex = group.members.findIndex(m => m.userId === targetUserId);
  
  if (memberIndex === -1) {
    return {
      success: false,
      error: 'El usuario no es miembro de este grupo'
    };
  }
  
  // Cambiar el rol del usuario
  group.members[memberIndex].role = newRole;
  
  groups[groupIndex] = group;
  saveGroups(groups);
  
  return {
    success: true,
    data: group
  };
};

/**
 * Crea un evento en un grupo
 */
export const createEvent = async (
  groupId: string,
  eventData: {
    title: string;
    description: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    startDate: number;
    endDate?: number;
    imageUrl?: string;
  },
  userId: string
): Promise<ApiResponse<Event>> => {
  await delay();
  
  const groups = getGroups();
  const groupIndex = groups.findIndex(g => g.id === groupId);
  
  if (groupIndex === -1) {
    return {
      success: false,
      error: 'Grupo no encontrado'
    };
  }
  
  const group = groups[groupIndex];
  
  // Verificar que el usuario es miembro del grupo
  const isMember = group.members.some(m => m.userId === userId);
  
  if (!isMember) {
    return {
      success: false,
      error: 'No eres miembro de este grupo'
    };
  }
  
  // Crear el evento
  const newEvent: Event = {
    id: generateId(),
    groupId,
    title: eventData.title,
    description: eventData.description,
    location: eventData.location,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    imageUrl: eventData.imageUrl,
    attendees: [userId], // El creador automáticamente asiste
    createdBy: userId,
    createdAt: Date.now()
  };
  
  group.events.push(newEvent);
  groups[groupIndex] = group;
  saveGroups(groups);
  
  return {
    success: true,
    data: newEvent
  };
};

// Inicializar datos de prueba para grupos
export const initializeMockGroupsData = (): void => {
  const existingGroups = getGroups();
  
  if (existingGroups.length === 0) {
    const groups: Group[] = [
      {
        id: '1',
        name: 'Amigos del Parque Arví',
        description: 'Grupo para organizar actividades, caminatas y conservación del Parque Arví.',
        category: 'Naturaleza',
        theme: 'Conservación ambiental y recreación sostenible',
        participationRules: 'Respeto por la naturaleza. Prohibido dejar basura. Participación activa en al menos una actividad mensual.',
        location: {
          latitude: 6.2807,
          longitude: -75.4975,
          address: 'Parque Arví, Medellín'
        },
        imageUrl: 'https://images.unsplash.com/photo-1586092468847-a155de775523?q=80&w=500&auto=format&fit=crop',
        creatorId: '1', // Usuario Demo
        createdAt: Date.now() - 86400000 * 10, // 10 días atrás
        members: [
          {
            userId: '1',
            role: 'admin',
            joinedAt: Date.now() - 86400000 * 10
          },
          {
            userId: '2',
            role: 'member',
            joinedAt: Date.now() - 86400000 * 8
          }
        ],
        events: [
          {
            id: '101',
            groupId: '1',
            title: 'Caminata ecológica',
            description: 'Recorrido guiado por los senderos del Parque Arví con explicaciones sobre la flora y fauna local.',
            location: {
              latitude: 6.2807,
              longitude: -75.4975,
              address: 'Entrada principal Parque Arví'
            },
            startDate: Date.now() + 86400000 * 5, // 5 días en el futuro
            endDate: Date.now() + 86400000 * 5 + 10800000, // 3 horas después
            attendees: ['1', '2'],
            createdBy: '1',
            createdAt: Date.now() - 86400000 * 7
          }
        ],
        isPublic: true
      },
      {
        id: '2',
        name: 'Voluntarios El Poblado',
        description: 'Red de voluntarios para proyectos comunitarios en El Poblado.',
        category: 'Comunidad',
        location: {
          latitude: 6.2086,
          longitude: -75.5696,
          address: 'El Poblado, Medellín'
        },
        imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=500&auto=format&fit=crop',
        creatorId: '2', // Administrador
        createdAt: Date.now() - 86400000 * 15, // 15 días atrás
        members: [
          {
            userId: '2',
            role: 'admin',
            joinedAt: Date.now() - 86400000 * 15
          }
        ],
        events: [],
        isPublic: true
      },
      {
        id: '3',
        name: 'Club de Lectura Medellín',
        description: 'Compartimos y discutimos nuestras lecturas favoritas mensualmente.',
        category: 'Cultura',
        location: {
          latitude: 6.2476,
          longitude: -75.5658,
          address: 'Biblioteca Pública Piloto, Medellín'
        },
        imageUrl: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?q=80&w=500&auto=format&fit=crop',
        creatorId: '1', // Usuario Demo
        createdAt: Date.now() - 86400000 * 20, // 20 días atrás
        members: [
          {
            userId: '1',
            role: 'admin',
            joinedAt: Date.now() - 86400000 * 20
          }
        ],
        events: [],
        isPublic: false // Este es un grupo privado
      }
    ];
    
    saveGroups(groups);
    console.log('[API] Datos de prueba de grupos inicializados');
  }
};

// Inicializar datos de prueba
initializeMockGroupsData();