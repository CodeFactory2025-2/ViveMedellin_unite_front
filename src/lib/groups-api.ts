// src/lib/groups-api.ts
// API simulada para la gestión de grupos

import { addNotification, createEmailNotification, type NotificationType } from "@/lib/notifications-api";

// Tipos
export interface GroupPostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
}

export interface GroupPostMedia {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  content?: string;
  link?: string;
  image?: GroupPostMedia | null;
  file?: GroupPostMedia | null;
  createdAt: number;
  comments: GroupPostComment[];
}

export interface Group {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  theme?: string; // Tema específico del grupo
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
  posts: GroupPost[];
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

export interface CreateGroupPostRequest {
  content?: string;
  authorId: string;
  authorName: string;
  link?: string | null;
  image?: GroupPostMedia | null;
  file?: GroupPostMedia | null;
}

export interface CreateGroupPostCommentRequest {
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  postCount: number;
  isPublic: boolean;
}

export interface GroupMemberActivity {
  groupId: string;
  userId: string;
  role: GroupMember["role"];
  joinedAt: number;
}

export interface GroupActivitySummary {
  topByMembers: GroupSummary[];
  topByPosts: GroupSummary[];
  recentPosts: Array<GroupPost & { groupName: string; groupSlug: string; isPublic: boolean }>;
  recentMembers: Array<GroupMemberActivity & { groupSlug: string; groupName: string; isPublic: boolean }>;
}

export type JoinRequestStatus = "pending" | "accepted" | "rejected";

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  groupSlug: string;
  groupName: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  message?: string;
  status: JoinRequestStatus;
  createdAt: number;
  respondedAt?: number;
  handledBy?: string;
  rejectedAt?: number;
}

export interface RequestJoinGroupOptions {
  message?: string;
  userName?: string;
  userEmail?: string;
}

export interface CreateJoinRequestPayload {
  id: string;
  groupId: string;
  userId: string;
  status: JoinRequestStatus;
  createdAt: number;
}

export interface AdminJoinRequestsPayload {
  requests: GroupJoinRequest[];
  managedGroups: Array<Pick<Group, "id" | "name" | "slug">>;
}

export interface JoinRequestWithDetails extends GroupJoinRequest {
  userAvatar?: string;
}

export interface Membership {
  groupId: string;
  userId: string;
  role: GroupMember["role"];
  joinedAt: number;
}

export const removeGroupMember = async (
  groupId: string,
  targetUserId: string,
  adminId: string,
): Promise<ApiResponse<Group>> => {
  await delay(300);

  const groups = getGroups();
  const groupIndex = groups.findIndex((group) => group.id === groupId);

  if (groupIndex === -1) {
    return {
      success: false,
      error: "Grupo no encontrado",
      status: 404,
    };
  }

  const group = groups[groupIndex];

  if (!isGroupAdmin(group, adminId)) {
    return {
      success: false,
      error: "No tienes permisos para gestionar miembros en este grupo",
      status: 403,
    };
  }

  if (group.creatorId === targetUserId) {
    return {
      success: false,
      error: "No puedes eliminar al creador del grupo",
      status: 409,
    };
  }

  const memberExists = group.members.some((member) => member.userId === targetUserId);
  if (!memberExists) {
    return {
      success: false,
      error: "El usuario no es miembro del grupo",
      status: 404,
    };
  }

  group.members = group.members.filter((member) => member.userId !== targetUserId);
  groups[groupIndex] = group;
  saveGroups(groups);

  pushNotification(
    "group:member-left",
    `Miembro removido de ${group.name}`,
    `${targetUserId} fue removido del grupo por una administradora.`,
    {
      groupId,
      removedBy: adminId,
      userId: targetUserId,
      memberCount: group.members.length,
    },
  );

  notifyJoinRequestsUpdate({ action: "member-removed", groupId, userId: targetUserId });

  return {
    success: true,
    data: group,
  };
};

export const canAccessGroupContent = (group: Group, userId: string): boolean => {
  if (group.isPublic) {
    return true;
  }

  if (group.creatorId === userId || group.members.some((member) => member.userId === userId)) {
    return true;
  }

  const requests = getJoinRequests();
  const hasRejected = requests.some(
    (request) => request.groupId === group.id && request.userId === userId && request.status === "rejected",
  );

  return !hasRejected;
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

// Simulación de base de datos
const GROUPS_KEY = "vive-medellin-groups";
const GROUP_JOIN_REQUESTS_KEY = "vive-medellin-group-requests";
const isBrowser = typeof window !== "undefined";

// Utilidades
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

type StoredGroup = Partial<Group> & {
  members?: unknown;
  events?: unknown;
  posts?: unknown;
};

const normalizeGroup = (group: StoredGroup): Group => {
  const members = Array.isArray(group?.members) ? group.members : [];
  const events = Array.isArray(group?.events) ? group.events : [];
  const sanitizeMedia = (media: unknown): GroupPostMedia | null => {
    if (
      media &&
      typeof media === "object" &&
      "id" in media &&
      typeof (media as { id: unknown }).id === "string" &&
      "name" in media &&
      typeof (media as { name: unknown }).name === "string" &&
      "url" in media &&
      typeof (media as { url: unknown }).url === "string" &&
      "mimeType" in media &&
      typeof (media as { mimeType: unknown }).mimeType === "string" &&
      "size" in media &&
      typeof (media as { size: unknown }).size === "number"
    ) {
      const typedMedia = media as GroupPostMedia;
      return {
        id: typedMedia.id,
        name: typedMedia.name,
        url: typedMedia.url,
        mimeType: typedMedia.mimeType,
        size: typedMedia.size,
      };
    }
    return null;
  };

  const posts = Array.isArray(group?.posts)
    ? (group.posts as GroupPost[]).map((post) => ({
        ...post,
        content: typeof post?.content === "string" ? post.content : undefined,
        link: typeof post?.link === "string" ? post.link : undefined,
        image: sanitizeMedia(post?.image) ?? null,
        file: sanitizeMedia(post?.file) ?? null,
        comments: Array.isArray(post?.comments) ? post.comments : [],
      }))
    : [];

  return {
    id: group?.id ?? generateId(),
    slug: group?.slug ?? slugify(group?.name ?? "grupo"),
    name: group?.name ?? "Grupo sin nombre",
    description: group?.description ?? "",
    category: group?.category ?? "general",
    theme: group?.theme ?? undefined,
    participationRules: group?.participationRules ?? undefined,
    location: group?.location,
    imageUrl: group?.imageUrl,
    creatorId: group?.creatorId ?? "",
    createdAt: typeof group?.createdAt === "number" ? group.createdAt : Date.now(),
    members,
    events,
    posts: posts.sort((a, b) => b.createdAt - a.createdAt),
    isPublic: typeof group?.isPublic === "boolean" ? group.isPublic : true,
  } as Group;
};

const pushNotification = (
  type: NotificationType | string,
  title: string,
  message: string,
  data?: Record<string, unknown>,
) => {
  if (!isBrowser) {
    return;
  }

  addNotification({
    id: generateId(),
    type: type as NotificationType,
    title,
    message,
    createdAt: Date.now(),
    read: false,
    data,
  });
};

const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const getGroups = (): Group[] => {
  if (!isBrowser) {
    return [];
  }

  const groups = window.localStorage.getItem(GROUPS_KEY);
  let parsed: unknown = [];

  if (groups) {
    try {
      parsed = JSON.parse(groups);
    } catch (error) {
      console.warn('No se pudo parsear la información de grupos almacenada. Se restablecerá la lista.', error);
      parsed = [];
    }
  }

  const array = Array.isArray(parsed) ? parsed : [];

  if (!Array.isArray(parsed)) {
    console.warn('El formato de la lista de grupos es inválido. Se restablecerá la lista.');
    saveGroups([]);
  }

  return ensureSlugs(array);
};

const saveGroups = (groups: Group[]): void => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
};

const slugify = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const makeUniqueSlug = (baseSlug: string, reserved: Set<string>): string => {
  const base = baseSlug || 'grupo';
  let candidate = base;
  let suffix = 1;

  while (reserved.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const ensureSlugs = (groups: StoredGroup[]): Group[] => {
  let updated = false;
  const reserved = new Set<string>();
  const withSlugs = groups.map((rawGroup) => {
    const normalized = normalizeGroup(rawGroup);

    let slug = normalized.slug || slugify(normalized.name) || 'grupo';
    if (reserved.has(slug)) {
      slug = makeUniqueSlug(slug, reserved);
    }
    reserved.add(slug);
    if (slug !== normalized.slug) {
      updated = true;
      return { ...normalized, slug };
    }
    return normalized;
  });

  if (updated) {
    saveGroups(withSlugs);
  }

  return withSlugs;
};

const notifyJoinRequestsUpdate = (detail: Record<string, unknown> = { action: "updated" }) => {
  if (!isBrowser) {
    return;
  }
  window.dispatchEvent(
    new CustomEvent("group-requests:updated", {
      detail,
    }),
  );
};

const getJoinRequests = (): GroupJoinRequest[] => {
  if (!isBrowser) {
    return [];
  }

  const requestsRaw = window.localStorage.getItem(GROUP_JOIN_REQUESTS_KEY);
  if (!requestsRaw) {
    return [];
  }

  try {
    const parsed = JSON.parse(requestsRaw);
    if (Array.isArray(parsed)) {
      return parsed as GroupJoinRequest[];
    }
  } catch (error) {
    console.warn("No se pudieron leer las solicitudes almacenadas", error);
  }

  return [];
};

const saveJoinRequests = (requests: GroupJoinRequest[], options: { silent?: boolean } = {}) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(GROUP_JOIN_REQUESTS_KEY, JSON.stringify(requests));
  if (!options.silent) {
    notifyJoinRequestsUpdate();
  }
};

export const checkPendingJoinRequest = (userId: string, groupId: string): boolean => {
  const requests = getJoinRequests();
  return requests.some(
    (request) =>
      request.userId === userId && request.groupId === groupId && request.status === "pending",
  );
};

export const createJoinRequest = async (
  groupId: string,
  userId: string,
  options: { userName?: string; userEmail?: string; message?: string } = {},
): Promise<ApiResponse<GroupJoinRequest>> => {
  await delay(500);

  if (!isBrowser) {
    return {
      success: false,
      error: "No se pudo procesar la solicitud en este entorno.",
      status: 500,
    };
  }

  // Deshabilitamos la falla aleatoria para evitar errores molestos en desarrollo
  if (Math.random() < 0.0) {
    console.warn("[Mock API] Error aleatorio al crear solicitud de ingreso");
    return {
      success: false,
      error:
        "Hubo un error técnico al procesar tu solicitud. No fue posible enviarla. Por favor, inténtalo nuevamente más tarde.",
      status: 500,
    };
  }

  const requests = getJoinRequests();
  const newRequest: GroupJoinRequest = {
    id: generateId(),
    groupId,
    groupSlug: "",
    groupName: "",
    userId,
    userName: options.userName,
    userEmail: options.userEmail,
    message: options.message?.trim() || undefined,
    status: "pending",
    createdAt: Date.now(),
  };

  requests.push(newRequest);
  saveJoinRequests(requests);
  window.dispatchEvent(
    new CustomEvent("group-requests:updated", {
      detail: { groupId, userId, action: "created", requestId: newRequest.id },
    }),
  );

  return {
    success: true,
    data: newRequest,
  };
};

const isGroupAdmin = (group: Group, userId: string): boolean => {
  return (
    group.creatorId === userId ||
    group.members.some((member) => member.userId === userId && member.role === "admin")
  );
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
  
  const allGroups = getGroups().map((group) => {
    const hasAccess = group.isPublic || group.members.some((member) => member.userId === userId);
    if (hasAccess) {
      return group;
    }

    return {
      ...group,
      posts: [],
      events: [],
    };
  });
  
  return {
    success: true,
    data: allGroups
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

export const getGroupBySlug = async (slug: string, userId: string): Promise<ApiResponse<Group>> => {
  await delay();

  const groups = getGroups();
  const group = groups.find((g) => g.slug === slug);

  if (!group) {
    return {
      success: false,
      error: 'Grupo no encontrado',
      status: 404,
    };
  }

  const hasAccess = group.isPublic || group.members.some((member) => member.userId === userId);

  const sanitizedGroup = hasAccess
    ? group
    : {
        ...group,
        posts: [],
        events: [],
      };

  return {
    success: true,
    data: sanitizedGroup,
  };
};

/**
 * Crea un nuevo grupo
 */
export const createGroup = async (request: CreateGroupRequest, userId: string): Promise<ApiResponse<Group>> => {
  await delay();
  
  const groups = getGroups();
  const normalizedName = request.name.trim();

  if (
    groups.some(
      (group) => group.name.trim().toLowerCase() === normalizedName.toLowerCase()
    )
  ) {
    return {
      success: false,
      error: 'Ya existe un grupo con ese nombre.',
      status: 409,
    };
  }

  const baseSlug = slugify(normalizedName) || 'grupo';
  const existingSlugs = new Set(groups.map((group) => group.slug));
  const slug = makeUniqueSlug(baseSlug, existingSlugs);
  
  // Crear el nuevo grupo
  const newGroup: Group = {
    id: generateId(),
    slug,
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
    posts: [],
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
      error: 'Grupo no encontrado',
      status: 404,
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
  
  const isCreator = group.creatorId === userId;
  const isAdmin = group.members.some((member) => member.userId === userId && member.role === 'admin');

  if (!isCreator && !isAdmin) {
    return {
      success: false,
      error: 'No tienes permisos para eliminar este grupo'
    };
  }
  
  const updatedGroups = groups.filter(g => g.id !== groupId);
  saveGroups(updatedGroups);

  pushNotification(
    "group:deleted",
    `Grupo eliminado: ${group.name}`,
    `El grupo "${group.name}" ha sido eliminado y ya no estará disponible en la plataforma.`,
    {
      groupId,
      deletedBy: userId,
      memberCount: group.members.length,
    },
  );
  
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
      error: 'Este es un grupo privado',
      status: 403,
    };
  }

  if (group.members.some(m => m.userId === userId)) {
    return {
      success: false,
      error: 'Ya eres miembro de este grupo',
      status: 409,
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

  pushNotification(
    "group:new-member",
    "Nuevo miembro en el grupo",
    `${userId} se ha unido a ${group.name}.`,
    {
      groupId,
      userId,
      memberCount: group.members.length,
    },
  );
  
  return {
    success: true,
    data: group
  };
};

/**
 * Solicita acceso a un grupo privado
 */
export const requestJoinGroup = async (
  groupId: string,
  userId: string,
  options: RequestJoinGroupOptions = {},
): Promise<ApiResponse<GroupJoinRequest>> => {
  await delay(300);

  const normalizedUserId = typeof userId === "string" ? userId.trim() : "";
  if (!normalizedUserId) {
    return {
      success: false,
      error: "Debes iniciar sesión para enviar una solicitud.",
      status: 401,
    };
  }

  const groups = getGroups();
  const group = groups.find((g) => g.id === groupId);

  if (!group) {
    return {
      success: false,
      error: "Grupo no encontrado",
      status: 404,
    };
  }

  if (group.isPublic) {
    return {
      success: false,
      error: "Este grupo es público, puedes unirte directamente.",
      status: 400,
    };
  }

  if (group.members.some((member) => member.userId === normalizedUserId)) {
    return {
      success: false,
      error: "Ya eres miembro de este grupo.",
      status: 409,
    };
  }

  const hasPendingRequest = checkPendingJoinRequest(normalizedUserId, groupId);

  if (hasPendingRequest) {
    return {
      success: false,
      error: "Ya tienes una solicitud pendiente para este grupo.",
      status: 409,
    };
  }

  const trimmedMessage = options.message?.trim();
  const createResult = await createJoinRequest(groupId, normalizedUserId, {
    userEmail: options.userEmail,
    userName: options.userName,
    message: trimmedMessage,
  });

  if (!createResult.success || !createResult.data) {
    return createResult;
  }

  const newRequest: GroupJoinRequest = {
    ...createResult.data,
    groupSlug: group.slug,
    groupName: group.name,
  };

  const requests = getJoinRequests().filter((request) => request.id !== newRequest.id);
  requests.push(newRequest);
  saveJoinRequests(requests);

  pushNotification(
    "group:join-request",
    "Nueva solicitud para unirse a tu grupo",
    `${options.userName ?? options.userEmail ?? "Una usuaria"} ha solicitado unirse a ${group.name}.`,
    {
      groupId,
      requestId: newRequest.id,
      groupSlug: group.slug,
      userId: normalizedUserId,
    },
  );

  return {
    success: true,
    data: newRequest,
  };
};

/**
 * Obtiene las solicitudes de ingreso del usuario
 */
export const getUserJoinRequests = async (userId: string): Promise<ApiResponse<GroupJoinRequest[]>> => {
  await delay(200);

  const requests = getJoinRequests()
    .filter((request) => request.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);

  return {
    success: true,
    data: requests,
  };
};

/**
 * Obtiene las solicitudes pendientes para los grupos donde el usuario es administrador
 */
export const getJoinRequestsForAdmin = async (
  adminId: string,
): Promise<ApiResponse<AdminJoinRequestsPayload>> => {
  const normalizedAdminId = typeof adminId === "string" ? adminId.trim() : "";

  if (!normalizedAdminId) {
    return {
      success: false,
      error: "Debes iniciar sesión para ver las solicitudes.",
      status: 401,
    };
  }

  await delay(200);

  const groups = getGroups();
  const managedGroups = groups
    .filter((group) => isGroupAdmin(group, normalizedAdminId))
    .map((group) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
    }));

  if (!managedGroups.length) {
    return {
      success: true,
      data: {
        requests: [],
        managedGroups: [],
      },
    };
  }

  const managedGroupIds = new Set(managedGroups.map((group) => group.id));
  const requests = getJoinRequests()
    .filter((request) => managedGroupIds.has(request.groupId) && request.status === "pending")
    .sort((a, b) => b.createdAt - a.createdAt);

  return {
    success: true,
    data: {
      requests,
      managedGroups,
    },
  };
};

export const getAdminJoinRequests = async (
  adminId: string,
): Promise<ApiResponse<JoinRequestWithDetails[]>> => {
  await delay(300);

  const normalizedAdminId = typeof adminId === "string" ? adminId.trim() : "";
  if (!normalizedAdminId) {
    return {
      success: false,
      error: "Debes iniciar sesión para ver las solicitudes.",
      status: 401,
    };
  }

  const groups = getGroups();
  const managedGroupIds = new Set(
    groups.filter((group) => isGroupAdmin(group, normalizedAdminId)).map((group) => group.id),
  );

  if (!managedGroupIds.size) {
    return {
      success: true,
      data: [],
    };
  }

  const requests = getJoinRequests()
    .filter((request) => managedGroupIds.has(request.groupId) && request.status === "pending")
    .sort((a, b) => b.createdAt - a.createdAt);

  const withDetails: JoinRequestWithDetails[] = requests.map((request) => {
    const group = groups.find((g) => g.id === request.groupId);
    return {
      ...request,
      groupName: group?.name ?? request.groupName,
      groupSlug: group?.slug ?? request.groupSlug,
    };
  });

  return {
    success: true,
    data: withDetails,
  };
};

/**
 * Acepta una solicitud pendiente y agrega al usuario como miembro
 */
export const acceptJoinRequest = async (
  requestId: string,
  adminId: string,
): Promise<ApiResponse<{ request: GroupJoinRequest; group: Group }>> => {
  const normalizedAdminId = typeof adminId === "string" ? adminId.trim() : "";

  if (!normalizedAdminId) {
    return {
      success: false,
      error: "Debes iniciar sesión para gestionar solicitudes.",
      status: 401,
    };
  }

  await delay(500);

  const requests = getJoinRequests();
  const requestIndex = requests.findIndex((request) => request.id === requestId);

  if (requestIndex === -1) {
    return {
      success: false,
      error: "Solicitud no encontrada",
      status: 404,
    };
  }

  const request = requests[requestIndex];

  if (request.status !== "pending") {
    return {
      success: false,
      error: "Esta solicitud ya fue procesada.",
      status: 409,
    };
  }

  const groups = getGroups();
  const groupIndex = groups.findIndex((group) => group.id === request.groupId);

  if (groupIndex === -1) {
    return {
      success: false,
      error: "El grupo asociado ya no está disponible.",
      status: 404,
    };
  }

  const group = groups[groupIndex];

  if (!isGroupAdmin(group, normalizedAdminId)) {
    return {
      success: false,
      error: "No tienes permisos para gestionar solicitudes en este grupo.",
      status: 403,
    };
  }

  if (!group.members.some((member) => member.userId === request.userId)) {
    group.members.push({
      userId: request.userId,
      role: "member",
      joinedAt: Date.now(),
    });
    groups[groupIndex] = group;
    saveGroups(groups);
  }

  const updatedRequest: GroupJoinRequest = {
    ...request,
    status: "accepted",
    respondedAt: Date.now(),
    handledBy: normalizedAdminId,
  };

  requests[requestIndex] = updatedRequest;
  saveJoinRequests(requests);

  const applicantLabel = request.userName ?? request.userEmail ?? "Una usuaria";

  pushNotification(
    "group:new-member",
    `Nueva solicitud aceptada en ${group.name}`,
    `${applicantLabel} ahora es miembro del grupo.`,
    {
      groupId: group.id,
      requestId,
      adminId: normalizedAdminId,
      status: "accepted",
    },
  );

  pushNotification(
    "group:join-response",
    `Tu solicitud para unirte a ${group.name} fue aceptada`,
    `Ahora eres miembro del grupo "${group.name}".`,
    {
      groupId: group.id,
      requestId,
      status: "accepted",
      userId: request.userId,
    },
  );

  createEmailNotification(request.userId, {
    type: "group:join-accepted",
    title: "Solicitud aceptada",
    message: `Tu solicitud para unirte al grupo ${group.name} fue aprobada. Ahora eres miembro.`,
    data: {
      groupId: group.id,
      requestId,
      status: "accepted",
    },
  });

  notifyJoinRequestsUpdate({
    action: "accepted",
    groupId: group.id,
    userId: request.userId,
    requestId,
  });

  console.info(`[Email simulado] ${applicantLabel} fue notificada: Tu solicitud para unirte al grupo ${group.name} fue aprobada. Ahora eres miembro.`);

  return {
    success: true,
    data: {
      request: updatedRequest,
      group,
    },
  };
};

/**
 * Rechaza una solicitud pendiente
 */
export const rejectJoinRequest = async (
  requestId: string,
  adminId: string,
): Promise<ApiResponse<GroupJoinRequest>> => {
  const normalizedAdminId = typeof adminId === "string" ? adminId.trim() : "";

  if (!normalizedAdminId) {
    return {
      success: false,
      error: "Debes iniciar sesión para gestionar solicitudes.",
      status: 401,
    };
  }

  await delay(400);

  const requests = getJoinRequests();
  const requestIndex = requests.findIndex((request) => request.id === requestId);

  if (requestIndex === -1) {
    return {
      success: false,
      error: "Solicitud no encontrada",
      status: 404,
    };
  }

  const request = requests[requestIndex];

  if (request.status !== "pending") {
    return {
      success: false,
      error: "Esta solicitud ya fue procesada.",
      status: 409,
    };
  }

  const groups = getGroups();
  const group = groups.find((g) => g.id === request.groupId);

  if (!group) {
    return {
      success: false,
      error: "El grupo asociado ya no está disponible.",
      status: 404,
    };
  }

  if (!isGroupAdmin(group, normalizedAdminId)) {
    return {
      success: false,
      error: "No tienes permisos para gestionar esta solicitud.",
      status: 403,
    };
  }

  const updatedRequest: GroupJoinRequest = {
    ...request,
    status: "rejected",
    respondedAt: Date.now(),
    handledBy: normalizedAdminId,
    rejectedAt: Date.now(),
  };

  requests[requestIndex] = updatedRequest;
  saveJoinRequests(requests);

  const applicantLabel = request.userName ?? request.userEmail ?? "Una usuaria";

  pushNotification(
    "group:join-response",
    `Tu solicitud para unirte a ${group.name} fue rechazada`,
    `No fue posible aprobar tu ingreso al grupo "${group.name}".`,
    {
      groupId: group.id,
      requestId,
      adminId: normalizedAdminId,
      status: "rejected",
      userId: request.userId,
    },
  );

  createEmailNotification(request.userId, {
    type: "group:join-rejected",
    title: "Solicitud rechazada",
    message: `Tu solicitud para unirte al grupo ${group.name} fue rechazada.`,
    data: {
      groupId: group.id,
      requestId,
      status: "rejected",
    },
  });

  console.info(
    `[Email simulado] ${applicantLabel} fue notificada: Tu solicitud para unirte al grupo ${group.name} fue rechazada.`,
  );

  notifyJoinRequestsUpdate({
    action: "rejected",
    groupId: group.id,
    userId: request.userId,
    requestId,
  });

  return {
    success: true,
    data: updatedRequest,
  };
};

/**
 * Abandona un grupo
 */
export const leaveGroup = async (groupId: string, userId: string): Promise<ApiResponse<Group>> => {
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

  pushNotification(
    "group:member-left",
    "Miembro ha salido del grupo",
    `${userId} ha salido de ${group.name}.`,
    {
      groupId,
      userId,
      memberCount: group.members.length,
    },
  );
  
  return {
    success: true,
    data: group
  };
};

/**
 * Obtiene las publicaciones de un grupo
 */
export const getGroupPosts = async (groupId: string, userId: string): Promise<ApiResponse<GroupPost[]>> => {
  await delay();

  const groups = getGroups();
  const group = groups.find((g) => g.id === groupId);

  if (!group) {
    return {
      success: false,
      error: 'Grupo no encontrado',
      status: 404,
    };
  }

  const hasAccess = group.isPublic || group.members.some((member) => member.userId === userId) || group.creatorId === userId;

  if (!hasAccess) {
    return {
      success: false,
      error: 'No tienes permiso para ver las publicaciones de este grupo',
      status: 403,
    };
  }

  return {
    success: true,
    data: [...group.posts]
      .map((post) => ({
        ...post,
        comments: [...post.comments].sort((a, b) => a.createdAt - b.createdAt),
      }))
      .sort((a, b) => b.createdAt - a.createdAt),
  };
};

/**
 * Busca publicaciones dentro de un grupo aplicando coincidencias parciales en texto, autor, archivos y enlaces
 */
export const searchGroupPosts = async (
  groupId: string,
  query: string,
  userId: string,
): Promise<ApiResponse<GroupPost[]>> => {
  await delay();

  const term = query?.trim() ?? "";

  if (term.length < 3) {
    return {
      success: false,
      error: 'Ingresa al menos 3 caracteres para buscar.',
      status: 422,
    };
  }

  const groups = getGroups();
  const group = groups.find((g) => g.id === groupId);

  if (!group) {
    return {
      success: false,
      error: 'Grupo no encontrado',
      status: 404,
    };
  }

  const hasAccess =
    group.isPublic ||
    group.creatorId === userId ||
    group.members.some((member) => member.userId === userId);

  if (!hasAccess) {
    return {
      success: false,
      error: 'No tienes permisos para buscar en este grupo.',
      status: 403,
    };
  }

  const normalizedTerm = normalizeText(term);

  const matches = group.posts.filter((post) => {
    const searchableFields = [
      post.content ?? "",
      post.authorName ?? "",
      post.link ?? "",
      post.image?.name ?? "",
      post.file?.name ?? "",
    ];

    return searchableFields.some((field) => normalizeText(field).includes(normalizedTerm));
  });

  return {
    success: true,
    data: matches
      .map((post) => ({
        ...post,
        comments: [...post.comments].sort((a, b) => a.createdAt - b.createdAt),
      }))
      .sort((a, b) => b.createdAt - a.createdAt),
  };
};

/**
 * Crea una nueva publicación dentro del grupo
 */
export const createGroupPost = async (
  groupId: string,
  request: CreateGroupPostRequest,
  userId: string,
): Promise<ApiResponse<GroupPost>> => {
  await delay();

  const groups = getGroups();
  const groupIndex = groups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    return {
      success: false,
      error: 'Grupo no encontrado',
      status: 404,
    };
  }

  const group = groups[groupIndex];
  const isMember =
    group.creatorId === userId || group.members.some((member) => member.userId === userId);

  if (!isMember) {
    return {
      success: false,
      error: 'Debes ser miembro del grupo para publicar.',
      status: 403,
    };
  }

  const rawContent = request.content?.trim() ?? "";
  const hasContent = rawContent.length > 0;
  const hasImage = Boolean(request.image);
  const hasFile = Boolean(request.file);
  const hasLink = Boolean(request.link && request.link.trim().length > 0);

  if (!hasContent && !hasImage && !hasFile && !hasLink) {
    return {
      success: false,
      error: 'El contenido de la publicación no puede estar vacío.',
      status: 422,
    };
  }

  if (rawContent.length > 1000) {
    return {
      success: false,
      error: 'El contenido de la publicación excede los 1000 caracteres.',
      status: 422,
    };
  }

  let sanitizedLink: string | undefined;
  if (hasLink) {
    try {
      const parsedUrl = new URL(request.link!.trim());
      sanitizedLink = parsedUrl.toString();
    } catch {
      return {
        success: false,
        error: 'El enlace proporcionado no es válido.',
        status: 422,
      };
    }
  }

  const validateMedia = (
    media: GroupPostMedia | null | undefined,
    allowedMimeTypes: string[],
    maxSizeInBytes: number,
    errorMessage: string,
  ): GroupPostMedia | undefined => {
    if (!media) {
      return undefined;
    }

    if (!allowedMimeTypes.includes(media.mimeType)) {
      throw new Error(errorMessage);
    }

    if (media.size > maxSizeInBytes) {
      throw new Error(errorMessage);
    }

    return media;
  };

  let image: GroupPostMedia | undefined;
  let file: GroupPostMedia | undefined;

  try {
    image = validateMedia(
      request.image,
      ["image/jpeg", "image/png", "image/jpg"],
      5 * 1024 * 1024,
      'Formato o tamaño de imagen no permitido.',
    );

    file = validateMedia(
      request.file,
      [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      10 * 1024 * 1024,
      'Formato o tamaño de archivo no permitido.',
    );
  } catch (validationError) {
    return {
      success: false,
      error:
        validationError instanceof Error
          ? validationError.message
          : 'Formato o tamaño no permitido.',
      status: 422,
    };
  }

  const newPost: GroupPost = {
    id: generateId(),
    groupId,
    authorId: request.authorId,
    authorName: request.authorName,
    content: hasContent ? rawContent : undefined,
    link: sanitizedLink,
    image: image ?? null,
    file: file ?? null,
    createdAt: Date.now(),
    comments: [],
  };

  group.posts = [newPost, ...group.posts];
  groups[groupIndex] = group;
  saveGroups(groups);

  const previewSource = rawContent || sanitizedLink || '';
  const preview =
    previewSource.length > 80 ? `${previewSource.slice(0, 77)}...` : previewSource;
  pushNotification(
    "group:new-post",
    `Nueva publicación en ${group.name}`,
    preview
      ? `${request.authorName} compartió: ${preview}`
      : `${request.authorName} ha compartido nuevo contenido en el grupo.`,
    {
      groupId,
      postId: newPost.id,
      authorId: request.authorId,
    },
  );

  return {
    success: true,
    data: newPost,
  };
};

export const addCommentToPost = async (
  groupId: string,
  request: CreateGroupPostCommentRequest,
  userId: string,
): Promise<ApiResponse<GroupPostComment>> => {
  await delay();

  const groups = getGroups();
  const groupIndex = groups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    return {
      success: false,
      error: 'Grupo no encontrado',
      status: 404,
    };
  }

  const group = groups[groupIndex];
  const isMember = group.creatorId === userId || group.members.some((member) => member.userId === userId);

  if (!isMember) {
    return {
      success: false,
      error: 'Debes ser miembro del grupo para comentar.',
      status: 403,
    };
  }

  const postIndex = group.posts.findIndex((post) => post.id === request.postId);
  if (postIndex === -1) {
    return {
      success: false,
      error: 'Publicación no encontrada',
      status: 404,
    };
  }

  const content = request.content.trim();
  if (!content) {
    return {
      success: false,
      error: 'El comentario no puede estar vacío.',
      status: 422,
    };
  }

  const newComment: GroupPostComment = {
    id: generateId(),
    postId: request.postId,
    authorId: request.authorId,
    authorName: request.authorName,
    content,
    createdAt: Date.now(),
  };

  const updatedPost: GroupPost = {
    ...group.posts[postIndex],
    comments: [...group.posts[postIndex].comments, newComment].sort((a, b) => a.createdAt - b.createdAt),
  };

  group.posts[postIndex] = updatedPost;
  groups[groupIndex] = group;
  saveGroups(groups);

  pushNotification(
    "group:new-comment",
    `Nuevo comentario en ${group.name}`,
    `${request.authorName} comentó una publicación`,
    {
      groupId,
      postId: request.postId,
      authorId: request.authorId,
      commentId: newComment.id,
    },
  );

  return {
    success: true,
    data: newComment,
  };
};

export const deleteGroupPost = async (
  groupId: string,
  postId: string,
  userId: string,
): Promise<ApiResponse<GroupPost>> => {
  await delay();

  const groups = getGroups();
  const groupIndex = groups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    return {
      success: false,
      error: 'Grupo no encontrado',
      status: 404,
    };
  }

  const group = groups[groupIndex];
  const postIndex = group.posts.findIndex((post) => post.id === postId);

  if (postIndex === -1) {
    return {
      success: false,
      error: 'Publicación no encontrada',
      status: 404,
    };
  }

  const post = group.posts[postIndex];
  const isAuthor = post.authorId === userId;
  const isAdmin = group.creatorId === userId || group.members.some((member) => member.userId === userId && member.role === 'admin');

  if (!isAuthor && !isAdmin) {
    return {
      success: false,
      error: 'No tienes permisos para eliminar esta publicación.',
      status: 403,
    };
  }

  group.posts.splice(postIndex, 1);
  groups[groupIndex] = group;
  saveGroups(groups);

  pushNotification(
    "system",
    `Publicación eliminada en ${group.name}`,
    `${post.authorName} retiró un mensaje del grupo.`,
    {
      groupId,
      postId,
      authorId: post.authorId,
    },
  );

  return {
    success: true,
    data: post,
  };
};

export const deletePostComment = async (
  groupId: string,
  postId: string,
  commentId: string,
  userId: string,
): Promise<ApiResponse<GroupPostComment>> => {
  await delay();

  const groups = getGroups();
  const groupIndex = groups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    return {
      success: false,
      error: 'Grupo no encontrado',
      status: 404,
    };
  }

  const group = groups[groupIndex];
  const postIndex = group.posts.findIndex((post) => post.id === postId);

  if (postIndex === -1) {
    return {
      success: false,
      error: 'Publicación no encontrada',
      status: 404,
    };
  }

  const commentIndex = group.posts[postIndex].comments.findIndex((comment) => comment.id === commentId);

  if (commentIndex === -1) {
    return {
      success: false,
      error: 'Comentario no encontrado',
      status: 404,
    };
  }

  const comment = group.posts[postIndex].comments[commentIndex];
  const isAuthor = comment.authorId === userId;
  const isAdmin = group.creatorId === userId || group.members.some((member) => member.userId === userId && member.role === 'admin');

  if (!isAuthor && !isAdmin) {
    return {
      success: false,
      error: 'No tienes permisos para eliminar este comentario.',
      status: 403,
    };
  }

  group.posts[postIndex].comments.splice(commentIndex, 1);
  groups[groupIndex] = group;
  saveGroups(groups);

  return {
    success: true,
    data: comment,
  };
};

/**
 * Marca métricas de actividad de grupos
 */
export const getGroupActivitySummary = async (userId?: string): Promise<ApiResponse<GroupActivitySummary>> => {
  await delay();

  const groups = getGroups();
  const accessibleGroups = typeof userId === 'string'
    ? groups.filter((group) => group.isPublic || group.creatorId === userId || group.members.some((member) => member.userId === userId))
    : groups;

  const summaries = accessibleGroups.map((group) => ({
    id: group.id,
    name: group.name,
    slug: group.slug,
    memberCount: group.members.length,
    postCount: group.posts.length,
    isPublic: group.isPublic,
  }));

  const topByMembers = [...summaries].sort((a, b) => b.memberCount - a.memberCount).slice(0, 5);
  const topByPosts = [...summaries].sort((a, b) => b.postCount - a.postCount).slice(0, 5);

  const recentPosts = accessibleGroups
    .flatMap((group) =>
      group.posts.map((post) => ({
        ...post,
        groupName: group.name,
        groupSlug: group.slug,
        isPublic: group.isPublic,
      })),
    )
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  const recentMembers = accessibleGroups
    .flatMap((group) =>
      group.members.map((member) => ({
        groupId: group.id,
        groupSlug: group.slug,
        groupName: group.name,
        isPublic: group.isPublic,
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
      })),
    )
    .sort((a, b) => b.joinedAt - a.joinedAt)
    .slice(0, 8);

  return {
    success: true,
    data: {
      topByMembers,
      topByPosts,
      recentPosts,
      recentMembers,
    },
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
  if (!isBrowser) {
    return;
  }

  const existingGroups = getGroups();
  
  if (existingGroups.length === 0) {
    const groups: Group[] = [
      {
        id: '1',
        slug: 'amigos-del-parque-arvi',
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
        imageUrl: 'https://images.unsplash.com/photo-1676642168640-b20591400950?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
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
        posts: [
          {
            id: 'p-101',
            groupId: '1',
            authorId: '1',
            authorName: 'Usuario Demo',
            content: '¡Bienvenidos! Este fin de semana haremos limpieza de senderos, confirmen asistencia en los comentarios.',
            createdAt: Date.now() - 86400000 * 6,
            comments: [
              {
                id: 'c-101',
                postId: 'p-101',
                authorId: '2',
                authorName: 'Administrador',
                content: '¡Me apunto! Llevaré bolsas reciclables y guantes extra.',
                createdAt: Date.now() - 86400000 * 5,
              },
            ],
          },
          {
            id: 'p-102',
            groupId: '1',
            authorId: '2',
            authorName: 'Administrador',
            content: 'Compartimos fotos de la última caminata. ¡Gracias por participar!',
            createdAt: Date.now() - 86400000 * 4,
            comments: [],
          },
        ],
        isPublic: true
      },
      {
        id: '2',
        slug: 'voluntarios-el-poblado',
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
        posts: [
          {
            id: 'p-201',
            groupId: '2',
            authorId: '2',
            authorName: 'Administrador',
            content: 'Este sábado entregaremos kits escolares en la vereda El Salado. Necesitamos voluntarios con transporte.',
            createdAt: Date.now() - 86400000 * 3,
            comments: [],
          },
        ],
        isPublic: true
      },
      {
        id: '3',
        slug: 'club-de-lectura-medellin',
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
        posts: [
          {
            id: 'p-301',
            groupId: '3',
            authorId: '1',
            authorName: 'Usuario Demo',
            content: 'Libro del mes: “El olvido que seremos”. Nos reunimos el próximo miércoles a las 7 p. m.',
            createdAt: Date.now() - 86400000 * 2,
            comments: [],
          },
        ],
        isPublic: false // Este es un grupo privado
      }
    ];
    
    saveGroups(groups);
    console.log('[API] Datos de prueba de grupos inicializados');
  }
};

export const initializeMockGroupJoinRequests = (): void => {
  if (!isBrowser) {
    return;
  }

  if (window.localStorage.getItem(GROUP_JOIN_REQUESTS_KEY)) {
    return;
  }

  const sampleRequests: GroupJoinRequest[] = [
    {
      id: generateId(),
      groupId: "3",
      groupSlug: "club-de-lectura-medellin",
      groupName: "Club de Lectura Medellín",
      userId: "2",
      userName: "Administrador",
      userEmail: "admin@example.com",
      message: "Me gustaría participar en las sesiones privadas del club.",
      status: "pending",
      createdAt: Date.now() - 1000 * 60 * 45,
    },
  ];

  saveJoinRequests(sampleRequests, { silent: true });
};

// Inicializar datos de prueba
if (typeof window !== "undefined") {
  initializeMockGroupsData();
  initializeMockGroupJoinRequests();
}
