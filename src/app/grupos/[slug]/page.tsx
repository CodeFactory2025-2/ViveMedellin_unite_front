"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Loader2,
  Trash2,
  Image as ImageIcon,
  Link2,
  Paperclip,
  Download,
  X,
  Search,
} from "lucide-react";

import SkipToContent from "@/components/SkipToContent";
import { RequireAuth } from "@/components/require-auth";
import { NotificationsBell } from "@/components/notifications-bell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import * as groupsApi from "@/lib/groups-api";
import type { Group, GroupPost, GroupPostMedia } from "@/lib/groups-api";

const DEFAULT_LOCATION = "Medellín, Colombia";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg"] as const;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const formatPostDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const formattedDate = date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${formattedDate} ${formattedTime}`;
};

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const units = ["bytes", "KB", "MB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  if (unitIndex === 0) {
    return `${Math.round(size)} ${units[unitIndex]}`;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const randomId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("No fue posible leer el archivo."));
    reader.readAsDataURL(file);
  });
};

const buildMediaPayload = async (file: File): Promise<GroupPostMedia> => {
  const url = await readFileAsDataUrl(file);
  return {
    id: randomId(),
    name: file.name,
    url,
    mimeType: file.type,
    size: file.size,
  };
};

export default function GroupDetailPage() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const router = useRouter();
  const { logout, user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [postLink, setPostLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isConfirmingPost, setIsConfirmingPost] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GroupPost[] | null>(null);
  const [isSearchingPosts, setIsSearchingPosts] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [commentDeleting, setCommentDeleting] = useState<Record<string, boolean>>({});
  const [postDeleting, setPostDeleting] = useState<Record<string, boolean>>({});
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [activeImagePreview, setActiveImagePreview] = useState<{ url: string; name: string } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const trimmedPostText = useMemo(() => newPostContent.trim(), [newPostContent]);
  const trimmedPostLink = useMemo(() => postLink.trim(), [postLink]);
  const hasAnyPostContent = useMemo(
    () =>
      trimmedPostText.length > 0 ||
      trimmedPostLink.length > 0 ||
      Boolean(imageFile) ||
      Boolean(documentFile),
    [trimmedPostText, trimmedPostLink, imageFile, documentFile],
  );
  const isPublishDisabled = !hasAnyPostContent || isPosting;
  const emptyPostWarning = hasAnyPostContent ? null : "No puedes publicar contenido vacío.";
  const characterCount = trimmedPostText.length;
  const normalizedSearchQuery = useMemo(() => searchQuery.trim(), [searchQuery]);
  const hasActiveSearch = searchResults !== null;
  const canSubmitSearch = normalizedSearchQuery.length >= 3;
  const postsToDisplay = searchResults ?? posts;
  const canClearSearch = hasActiveSearch || normalizedSearchQuery.length > 0;

  useEffect(() => {
    if (!slug || !user?.id) {
      return;
    }

    let isActive = true;

    const fetchGroup = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await groupsApi.getGroupBySlug(slug, user.id);
        if (!isActive) {
          return;
        }

        if (response.success && response.data) {
          const hydratedGroup: Group = {
            ...response.data,
            members: [...response.data.members],
            events: [...response.data.events],
            posts: [...response.data.posts],
          };

          setGroup(hydratedGroup);
          setIsMember(hydratedGroup.members.some((member) => member.userId === user.id));
          setPosts(hydratedGroup.posts ?? []);
        } else {
          setError(response.error || "No fue posible cargar el grupo.");
        }
      } catch (fetchError) {
        if (!isActive) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Ocurrió un error al cargar la información del grupo.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void fetchGroup();

    return () => {
      isActive = false;
    };
  }, [slug, user?.id]);

  useEffect(() => {
    if (group && user?.id) {
      setIsMember(group.members.some((member) => member.userId === user.id));
    }
  }, [group, user?.id]);

  useEffect(() => {
    setCommentDrafts((previous) => {
      const draft = { ...previous };
      posts.forEach((post) => {
        if (!(post.id in draft)) {
          draft[post.id] = "";
        }
      });
      return draft;
    });

    setExpandedPosts((previous) => {
      const expanded = { ...previous };
      posts.forEach((post) => {
        if (!(post.id in expanded)) {
          expanded[post.id] = false;
        }
      });
      return expanded;
    });
  }, [posts]);

  useEffect(() => {
    if (formError && hasAnyPostContent) {
      setFormError(null);
    }
  }, [formError, hasAnyPostContent]);

  useEffect(() => {
    if (isSearchVisible) {
      searchInputRef.current?.focus();
    }
  }, [isSearchVisible]);

  const handleImageChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number]) || file.size > MAX_IMAGE_SIZE) {
      setFormError("Formato o tamaño no permitido.");
      event.target.value = "";
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    try {
      const preview = await readFileAsDataUrl(file);
      setImageFile(file);
      setImagePreview(preview);
      setFormError(null);
    } catch (previewError) {
      console.error("No fue posible previsualizar la imagen:", previewError);
      setFormError("Hubo un problema al previsualizar la imagen seleccionada.");
      event.target.value = "";
      setImageFile(null);
      setImagePreview(null);
    }
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setDocumentFile(null);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number]) || file.size > MAX_FILE_SIZE) {
      setFormError("Formato o tamaño no permitido.");
      event.target.value = "";
      setDocumentFile(null);
      return;
    }

    setDocumentFile(file);
    setFormError(null);
  }, []);

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setFormError(null);
  }, []);

  const clearDocument = useCallback(() => {
    setDocumentFile(null);
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
    setFormError(null);
  }, []);

  const togglePostExpansion = useCallback((postId: string) => {
    setExpandedPosts((previous) => ({
      ...previous,
      [postId]: !previous[postId],
    }));
  }, []);

  const openImagePreview = useCallback((media: GroupPostMedia | null | undefined) => {
    if (!media) {
      return;
    }

    setActiveImagePreview({
      url: media.url,
      name: media.name,
    });
  }, []);

  const closeImagePreview = useCallback(() => {
    setActiveImagePreview(null);
  }, []);

  const handlePostDialogChange = useCallback(
    (open: boolean) => {
      if (!open && isPosting) {
        return;
      }
      setIsConfirmingPost(open);
    },
    [isPosting],
  );

  const handleToggleSearchVisibility = useCallback(() => {
    setIsSearchVisible((previous) => !previous);
    setSearchError(null);
  }, []);

  const handleSearchPosts = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!group || !user?.id) {
        toast({
          title: "Acción no disponible",
          description: "Debes iniciar sesión para buscar en el grupo.",
          variant: "destructive",
        });
        return;
      }

      if (normalizedSearchQuery.length < 3) {
        setSearchError("Ingresa al menos 3 caracteres para buscar.");
        return;
      }

      setSearchError(null);
      setIsSearchingPosts(true);

      try {
        const response = await groupsApi.searchGroupPosts(group.id, normalizedSearchQuery, user.id);

        if (response.success && response.data) {
          setSearchResults(response.data);
          if (!response.data.length) {
            toast({
              title: "No se encontraron publicaciones que coincidan con tu búsqueda.",
            });
          } else {
            toast({
              title: `Se encontraron ${response.data.length} ${response.data.length === 1 ? "publicación" : "publicaciones"}.`,
            });
          }
        } else {
          const errorMessage =
            response.error ||
            "No fue posible realizar la búsqueda. Por favor, inténtalo nuevamente más tarde.";
          setSearchResults(null);
          setSearchError(errorMessage);
          toast({
            title: "No fue posible realizar la búsqueda",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } catch (searchException) {
        const fallback =
          searchException instanceof Error
            ? searchException.message
            : "No fue posible realizar la búsqueda. Por favor, inténtalo nuevamente más tarde.";
        setSearchResults(null);
        setSearchError(fallback);
        toast({
          title: "Error al buscar publicaciones",
          description: fallback,
          variant: "destructive",
        });
      } finally {
        setIsSearchingPosts(false);
      }
    },
    [group, user, normalizedSearchQuery],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
    setSearchError(null);
    searchInputRef.current?.focus();
  }, []);


  const handleJoinGroup = async () => {
    if (!group || !user?.id) {
      toast({
        title: "No fue posible unirse al grupo",
        description: "Debes iniciar sesión nuevamente para completar esta acción.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);

    try {
      const response = await groupsApi.joinGroup(group.id, user.id);

      if (response.success && response.data) {
        const hydratedGroup: Group = {
          ...response.data,
          members: [...response.data.members],
          events: [...response.data.events],
          posts: [...response.data.posts],
        };
        setGroup(hydratedGroup);
        setIsMember(true);
        setPosts(hydratedGroup.posts ?? []);
        toast({
          title: "¡Bienvenida al grupo! 🎉",
          description: `Te has unido a "${hydratedGroup.name}" exitosamente.`,
        });
      } else {
        toast({
          title: "No fue posible unirse al grupo",
          description: response.error || "Inténtalo de nuevo más tarde.",
          variant: "destructive",
        });
      }
    } catch (joinError) {
      toast({
        title: "No fue posible unirse al grupo",
        description:
          joinError instanceof Error
            ? joinError.message
            : "Hubo un error técnico. Inténtalo nuevamente más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !user?.id) {
      toast({
        title: "No fue posible abandonar el grupo",
        description: "Debes iniciar sesión nuevamente para completar esta acción.",
        variant: "destructive",
      });
      return;
    }

    setIsLeaving(true);

    try {
      const response = await groupsApi.leaveGroup(group.id, user.id);

      if (response.success && response.data) {
        const hydratedGroup: Group = {
          ...response.data,
          members: [...response.data.members],
          events: [...response.data.events],
          posts: [...response.data.posts],
        };

        setGroup(hydratedGroup);
        setIsMember(false);
        setPosts(hydratedGroup.posts ?? []);

        toast({
          title: "Has abandonado el grupo",
          description: `Has salido de "${hydratedGroup.name}" correctamente.`,
        });
      } else {
        toast({
          title: "No fue posible abandonar el grupo",
          description: response.error || "Inténtalo de nuevo más tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "No fue posible abandonar el grupo",
        description:
          error instanceof Error
            ? error.message
            : "Hubo un error técnico. Inténtalo nuevamente más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const handleCreatePost = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!group || !user?.id) {
      toast({
        title: "Acción no disponible",
        description: "Debes iniciar sesión para publicar en el grupo.",
        variant: "destructive",
      });
      return;
    }

    if (!hasAnyPostContent) {
      setFormError("No puedes publicar contenido vacío.");
      return;
    }

    if (trimmedPostLink.length) {
      try {
        const parsedUrl = new URL(trimmedPostLink);
        if (!parsedUrl.protocol.startsWith("http")) {
          throw new Error("Protocolo inválido");
        }
      } catch {
        setFormError("El enlace proporcionado no es válido.");
        return;
      }
    }

    setFormError(null);
    setIsConfirmingPost(true);
  };

  const handleConfirmCreatePost = useCallback(async () => {
    if (!group || !user?.id) {
      toast({
        title: "Acción no disponible",
        description: "Debes iniciar sesión para publicar en el grupo.",
        variant: "destructive",
      });
      return;
    }

    const content = trimmedPostText.length ? trimmedPostText : undefined;
    const link = trimmedPostLink.length ? trimmedPostLink : undefined;

    setIsPosting(true);

    try {
      const imagePayload = imageFile ? await buildMediaPayload(imageFile) : null;
      const filePayload = documentFile ? await buildMediaPayload(documentFile) : null;

      const response = await groupsApi.createGroupPost(
        group.id,
        {
          content,
          authorId: user.id,
          authorName: user.name || user.email || "Miembro del grupo",
          link,
          image: imagePayload,
          file: filePayload,
        },
        user.id,
      );

      if (response.success && response.data) {
        const createdPost = response.data;
        setPosts((previous) => [createdPost, ...previous]);
        setGroup((prev) =>
          prev
            ? {
                ...prev,
                posts: [createdPost, ...(prev.posts ?? [])],
              }
            : prev,
        );
        setNewPostContent("");
        setPostLink("");
        clearImage();
        clearDocument();
        setIsConfirmingPost(false);
        toast({
          title: "Tu publicación se ha compartido correctamente",
          description: "El contenido ya es visible para todas las personas del grupo.",
        });
      } else {
        toast({
          title: "Error al publicar",
          description: response.error || "No se pudo publicar en el grupo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al publicar",
        description:
          error instanceof Error
            ? error.message
            : "Hubo un error técnico al crear la publicación. Inténtalo nuevamente más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  }, [group, user, trimmedPostText, trimmedPostLink, imageFile, documentFile, clearImage, clearDocument]);

  const handleCommentSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    postId: string,
  ) => {
    event.preventDefault();

    if (!group || !user?.id) {
      toast({
        title: "Acción no disponible",
        description: "Debes iniciar sesión para comentar en el grupo.",
        variant: "destructive",
      });
      return;
    }

    const draft = commentDrafts[postId]?.trim() ?? "";
    if (!draft) {
      toast({
        title: "Comentario vacío",
        description: "Escribe un mensaje antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setCommentLoading((previous) => ({ ...previous, [postId]: true }));

    try {
      const response = await groupsApi.addCommentToPost(
        group.id,
        {
          postId,
          content: draft,
          authorId: user.id,
          authorName: user.name || user.email || "Miembro del grupo",
        },
        user.id,
      );

      if (response.success && response.data) {
        const newComment = response.data;
        setPosts((previous) =>
          previous.map((post) =>
            post.id === postId
              ? { ...post, comments: [...post.comments, newComment] }
              : post,
          ),
        );
        setGroup((prev) =>
          prev
            ? {
                ...prev,
                posts: prev.posts.map((post) =>
                  post.id === postId
                    ? { ...post, comments: [...post.comments, newComment] }
                    : post,
                ),
              }
            : prev,
        );
        setSearchResults((previous) =>
          previous
            ? previous.map((post) =>
                post.id === postId
                  ? { ...post, comments: [...post.comments, newComment] }
                  : post,
              )
            : previous,
        );
        setCommentDrafts((previous) => ({ ...previous, [postId]: "" }));
        toast({
          title: "Comentario enviado",
          description: "Tu mensaje se publicó correctamente.",
        });
      } else {
        toast({
          title: "Error al comentar",
          description: response.error || "No se pudo enviar el comentario.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al comentar",
        description:
          error instanceof Error ? error.message : "Hubo un error técnico. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setCommentLoading((previous) => ({ ...previous, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!group || !user?.id) {
      toast({
        title: "Acción no disponible",
        description: "Debes iniciar sesión para gestionar las publicaciones.",
        variant: "destructive",
      });
      return;
    }

    setPostDeleting((previous) => ({ ...previous, [postId]: true }));

    try {
      const response = await groupsApi.deleteGroupPost(group.id, postId, user.id);
      if (response.success) {
        setPosts((previous) => previous.filter((post) => post.id !== postId));
        setGroup((prev) =>
          prev
            ? {
                ...prev,
                posts: prev.posts.filter((post) => post.id !== postId),
              }
            : prev,
        );
        setCommentDrafts((previous) => {
          const rest = { ...previous };
          delete rest[postId];
          return rest;
        });
        setExpandedPosts((previous) => {
          const rest = { ...previous };
          delete rest[postId];
          return rest;
        });
        setSearchResults((previous) =>
          previous ? previous.filter((post) => post.id !== postId) : previous,
        );
        toast({
          title: "Publicación eliminada",
          description: "El contenido se eliminó correctamente.",
        });
      } else {
        toast({
          title: "No se pudo eliminar",
          description: response.error || "Inténtalo nuevamente más tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description:
          error instanceof Error ? error.message : "Hubo un error técnico. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setPostDeleting((previous) => ({ ...previous, [postId]: false }));
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !user?.id) {
      toast({
        title: "Acción no disponible",
        description: "Debes iniciar sesión nuevamente.",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingGroup(true);

    try {
      const response = await groupsApi.deleteGroup(group.id, user.id);
      if (response.success) {
        toast({
          title: "Grupo eliminado",
          description: `"${group.name}" se ha eliminado exitosamente.`,
        });
        router.replace("/grupos");
      } else {
        toast({
          title: "No se pudo eliminar",
          description: response.error || "Inténtalo nuevamente más tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description:
          error instanceof Error ? error.message : "Hubo un error técnico. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!group || !user?.id) {
      toast({
        title: "Acción no disponible",
        description: "Debes iniciar sesión para gestionar los comentarios.",
        variant: "destructive",
      });
      return;
    }

    setCommentDeleting((previous) => ({ ...previous, [commentId]: true }));

    try {
      const response = await groupsApi.deletePostComment(group.id, postId, commentId, user.id);
      if (response.success) {
        setPosts((previous) =>
          previous.map((post) =>
            post.id === postId
              ? { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) }
              : post,
          ),
        );
        setGroup((prev) =>
          prev
            ? {
                ...prev,
                posts: prev.posts.map((post) =>
                  post.id === postId
                    ? { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) }
                    : post,
                ),
              }
            : prev,
        );
        setSearchResults((previous) =>
          previous
            ? previous.map((post) =>
                post.id === postId
                  ? { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) }
                  : post,
              )
            : previous,
        );
        toast({
          title: "Comentario eliminado",
          description: "El comentario se eliminó correctamente.",
        });
      } else {
        toast({
          title: "No se pudo eliminar el comentario",
          description: response.error || "Inténtalo nuevamente más tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description:
          error instanceof Error ? error.message : "Hubo un error técnico. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setCommentDeleting((previous) => ({ ...previous, [commentId]: false }));
    }
  };

  const display = useMemo(() => {
    if (!group) {
      return null;
    }

    const createdAt = group.createdAt
      ? new Date(group.createdAt).toLocaleDateString()
      : undefined;

    const isAdmin = Boolean(
      user?.id &&
      (
        group.creatorId === user.id ||
        group.members.some((member) => member.userId === user.id && member.role === "admin")
      )
    );

    return {
      name: group.name ?? "Grupo",
      description:
        group.description ?? "Aún no tenemos una descripción disponible para este grupo.",
      location: group.location?.address ?? DEFAULT_LOCATION,
      category: group.category ?? "General",
      memberCount: group.members.length,
      createdAt,
      isPublic: group.isPublic,
      isAdmin,
      creatorLabel:
        group.creatorId === user?.id
          ? user?.name || user?.email || "Tú"
          : "Administrador",
    };
  }, [group, user?.email, user?.id, user?.name]);

  const canJoin = Boolean(group) && Boolean(display?.isPublic) && !display?.isAdmin && !isMember;
  const canCreatePost = Boolean(group) && (display?.isAdmin || isMember);

  const renderHeader = () => (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            ViveMedellín
          </span>
        </Link>
        <div className="flex items-center space-x-4">
          <NotificationsBell />
          <Button
            variant="ghost"
            onClick={() => router.push("/grupos")}
            className="inline-flex items-center"
          >
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Volver a grupos
          </Button>
          <Button variant="outline" onClick={logout} size="sm">
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </nav>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          <p className="mt-3">Cargando información del grupo…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="max-w-xl mx-auto text-center py-16">
          <Card>
            <CardHeader>
              <CardTitle>Error al cargar el grupo</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Verifica tu conexión o intenta nuevamente más tarde.
              </p>
            </CardContent>
            <CardContent className="flex justify-center pt-0">
              <Button onClick={() => router.push("/grupos")}>Volver a grupos</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!group || !display) {
      return null;
    }

    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="shadow-primary max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" aria-hidden="true" />
                  {display.name}
                </CardTitle>
                <CardDescription className="mt-2">
                  {display.description}
                </CardDescription>
              </div>
              <Badge variant={display.isPublic ? "default" : "secondary"} className="self-start">
                {display.isPublic ? "Grupo público" : "Grupo privado"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <section className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                  Ubicación
                </h2>
                <p className="text-muted-foreground">{display.location}</p>
              </div>
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                  Creado
                </h2>
                <p className="text-muted-foreground">
                  {display.createdAt ? display.createdAt : "Fecha no disponible"}
                </p>
              </div>
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" aria-hidden="true" />
                  Administrador
                </h2>
                <p className="text-muted-foreground">{display.creatorLabel}</p>
              </div>
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                  Miembros
                </h2>
                <p className="text-muted-foreground">{display.memberCount}</p>
              </div>
            </section>

            <div className="pt-6 border-t">
              <h2 className="text-lg font-semibold">Acerca del grupo</h2>
              <p className="text-muted-foreground mt-2">
                {group.participationRules || "El administrador aún no ha definido reglas de participación."}
              </p>
            </div>

            <div className="pt-6 border-t space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <h2 className="text-lg font-semibold">Publicaciones del grupo</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleToggleSearchVisibility}
                    aria-expanded={isSearchVisible}
                    aria-controls="group-posts-search"
                    className="inline-flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" aria-hidden="true" />
                    Publicaciones del grupo
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {hasActiveSearch ? (
                    <span>
                      {postsToDisplay.length} {postsToDisplay.length === 1 ? "resultado" : "resultados"}
                    </span>
                  ) : posts.length ? (
                    <span>
                      {posts.length} {posts.length === 1 ? "publicación" : "publicaciones"}
                    </span>
                  ) : null}
                </div>
              </div>

              {isSearchVisible ? (
                <form
                  id="group-posts-search"
                  onSubmit={handleSearchPosts}
                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                >
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Buscar por texto, autor o archivo adjunto"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      if (searchError) {
                        setSearchError(null);
                      }
                    }}
                    disabled={isSearchingPosts}
                    aria-label="Buscar publicaciones del grupo"
                  />
                  <Button type="submit" size="sm" disabled={isSearchingPosts || !canSubmitSearch}>
                    {isSearchingPosts ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Buscando...
                      </>
                    ) : (
                      "Buscar"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    disabled={!canClearSearch || isSearchingPosts}
                  >
                    Limpiar filtros
                  </Button>
                  {searchError ? (
                    <p className="text-xs font-medium text-destructive sm:col-span-3">{searchError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground sm:col-span-3">
                      {canSubmitSearch
                        ? "La búsqueda ignora mayúsculas, minúsculas y acentos."
                        : "Ingresa al menos 3 caracteres para activar la búsqueda."}
                    </p>
                  )}
                </form>
              ) : null}

              {canCreatePost ? (
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="group-post" className="sr-only">
                      Escribe una publicación para el grupo
                    </label>
                    <Textarea
                      id="group-post"
                      placeholder="Comparte noticias, actividades o preguntas para tu comunidad..."
                      value={newPostContent}
                      onChange={(event) => setNewPostContent(event.target.value)}
                      maxLength={1000}
                      disabled={isPosting}
                      aria-describedby="group-post-helper"
                    />
                    <div
                      className="flex items-center justify-between text-xs text-muted-foreground"
                      id="group-post-helper"
                    >
                      <span>Máximo 1000 caracteres.</span>
                      <span>{characterCount}/1000</span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="group-post-image"
                        className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
                      >
                        <ImageIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                        Añadir imagen
                      </label>
                      <Input
                        id="group-post-image"
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleImageChange}
                        disabled={isPosting}
                        ref={imageInputRef}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Formatos permitidos: JPG, JPEG o PNG. Tamaño máximo 5&nbsp;MB.
                      </p>
                      {imagePreview && imageFile ? (
                        <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-3">
                          <button
                            type="button"
                            onClick={() =>
                              openImagePreview({
                                id: "preview-image",
                                name: imageFile.name,
                                url: imagePreview,
                                mimeType: imageFile.type,
                                size: imageFile.size,
                              })
                            }
                            className="inline-flex overflow-hidden rounded-md border"
                            aria-label="Ampliar imagen seleccionada"
                          >
                            <img
                              src={imagePreview}
                              alt={imageFile.name}
                              className="h-20 w-20 object-cover"
                            />
                          </button>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{imageFile.name}</p>
                            <p className="text-xs text-muted-foreground">{formatBytes(imageFile.size)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearImage}
                            aria-label="Quitar imagen adjunta"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Quitar
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="group-post-file"
                        className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
                      >
                        <Paperclip className="h-4 w-4 text-primary" aria-hidden="true" />
                        Adjuntar archivo
                      </label>
                      <Input
                        id="group-post-file"
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        disabled={isPosting}
                        ref={documentInputRef}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Se permiten archivos PDF o DOCX con un tamaño máximo de 10&nbsp;MB.
                      </p>
                      {documentFile ? (
                        <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-3">
                          <Paperclip className="h-4 w-4 text-primary" aria-hidden="true" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{documentFile.name}</p>
                            <p className="text-xs text-muted-foreground">{formatBytes(documentFile.size)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearDocument}
                            aria-label="Quitar archivo adjunto"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Quitar
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="group-post-link"
                      className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
                    >
                      <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
                      Añadir enlace externo
                    </label>
                    <Input
                      id="group-post-link"
                      type="url"
                      placeholder="https://ejemplo.com/contenido"
                      value={postLink}
                      onChange={(event) => setPostLink(event.target.value)}
                      disabled={isPosting}
                      aria-describedby="group-post-link-helper"
                    />
                    <p id="group-post-link-helper" className="text-[11px] text-muted-foreground">
                      El enlace se mostrará como hipervínculo dentro de la publicación.
                    </p>
                  </div>

                  {formError ? (
                    <p className="text-sm font-medium text-destructive">{formError}</p>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    {emptyPostWarning ? (
                      <span className="text-xs font-medium text-destructive">{emptyPostWarning}</span>
                    ) : null}
                    <div className="flex justify-end">
                      <Button type="submit" size="sm" disabled={isPublishDisabled}>
                        {isPosting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            Publicando...
                          </>
                        ) : (
                          "Publicar"
                        )}
                      </Button>
                    </div>
                  </div>

                  <AlertDialog open={isConfirmingPost} onOpenChange={handlePostDialogChange}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Desea hacer esta publicación?</AlertDialogTitle>
                        <AlertDialogDescription>
                          El contenido que compartas será visible para todos los miembros del grupo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPosting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            void handleConfirmCreatePost();
                          }}
                          disabled={isPosting}
                        >
                          {isPosting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                              Publicando...
                            </>
                          ) : (
                            "Aceptar"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Debes ser miembro del grupo para crear publicaciones.
                </p>
              )}

              <div className="space-y-3">
                {hasActiveSearch && postsToDisplay.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No se encontraron publicaciones que coincidan con tu búsqueda.
                  </p>
                ) : null}

                {!hasActiveSearch && postsToDisplay.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aún no hay publicaciones. Sé la primera en iniciar la conversación.
                  </p>
                ) : null}

                {postsToDisplay.map((post) => {
                  const textContent = post.content ?? "";
                  const isLongContent = textContent.length > 300;
                  const isExpanded = expandedPosts[post.id] ?? false;
                  const displayContent = isLongContent && !isExpanded
                    ? `${textContent.slice(0, 300)}…`
                    : textContent;

                  return (
                    <div key={post.id} className="rounded-lg border bg-card p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{post.authorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPostDateTime(post.createdAt)}
                          </p>
                        </div>
                        {(display.isAdmin || post.authorId === user?.id) ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Eliminar publicación"
                                disabled={postDeleting[post.id]}
                              >
                                {postDeleting[post.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. La publicación se eliminará para todas las personas del grupo.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePost(post.id)} disabled={postDeleting[post.id]}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-3">
                        {textContent ? (
                          <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
                            <p className="whitespace-pre-wrap">{displayContent}</p>
                            {isLongContent ? (
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="h-auto px-0 text-xs"
                                onClick={() => togglePostExpansion(post.id)}
                              >
                                {isExpanded ? "Ver menos" : "Ver más"}
                              </Button>
                            ) : null}
                          </div>
                        ) : null}

                        {post.link ? (
                          <a
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <Link2 className="h-4 w-4" aria-hidden="true" />
                            {post.link}
                          </a>
                        ) : null}

                        {post.image ? (
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => openImagePreview(post.image)}
                              className="inline-flex overflow-hidden rounded-md border"
                              aria-label="Ampliar imagen de la publicación"
                            >
                              <img
                                src={post.image.url}
                                alt={post.image.name}
                                className="max-h-[300px] max-w-[300px] object-cover"
                              />
                            </button>
                            <p className="text-xs text-muted-foreground">{post.image.name}</p>
                          </div>
                        ) : null}

                        {post.file ? (
                          <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-3">
                            <Paperclip className="h-4 w-4 text-primary" aria-hidden="true" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{post.file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatBytes(post.file.size)}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={post.file.url}
                                download={post.file.name}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4" aria-hidden="true" />
                                Descargar
                              </a>
                            </Button>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 space-y-2 border-t pt-3">
                        <h3 className="text-sm font-semibold">Comentarios</h3>
                        {post.comments.length ? (
                          <ul className="space-y-2">
                            {post.comments.map((comment) => (
                              <li key={comment.id} className="rounded-md bg-muted/40 p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{comment.authorName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(comment.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  {(display.isAdmin || comment.authorId === user?.id) ? (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label="Eliminar comentario"
                                          disabled={commentDeleting[comment.id]}
                                        >
                                          {commentDeleting[comment.id] ? (
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                          ) : (
                                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>¿Eliminar comentario?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta acción eliminará el comentario para todas las personas del grupo.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteComment(post.id, comment.id)}
                                            disabled={commentDeleting[comment.id]}
                                          >
                                            Eliminar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  ) : null}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sé la primera persona en comentar.</p>
                        )}

                        {canCreatePost ? (
                          <form
                            onSubmit={(event) => handleCommentSubmit(event, post.id)}
                            className="space-y-2"
                          >
                            <label htmlFor={`comment-${post.id}`} className="sr-only">
                              Escribe un comentario para este grupo
                            </label>
                            <Textarea
                              id={`comment-${post.id}`}
                              placeholder="Comparte tu aporte..."
                              value={commentDrafts[post.id] ?? ""}
                              onChange={(event) =>
                                setCommentDrafts((previous) => ({
                                  ...previous,
                                  [post.id]: event.target.value,
                                }))
                              }
                              maxLength={500}
                              rows={2}
                              disabled={commentLoading[post.id]}
                            />
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>Máximo 500 caracteres.</span>
                              <span>{(commentDrafts[post.id] ?? "").trim().length}/500</span>
                            </div>
                            <div className="flex justify-end">
                              <Button type="submit" size="sm" disabled={commentLoading[post.id]}>
                                {commentLoading[post.id] ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                                    Enviando...
                                  </>
                                ) : (
                                  "Comentar"
                                )}
                              </Button>
                            </div>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-6 border-t">
              <div className="flex flex-col sm:flex-row gap-4">
                {isMember ? (
                  <>
                    <Button size="lg" className="sm:w-auto" disabled>
                      Ya eres miembro
                    </Button>
                    {!display?.isAdmin ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="lg"
                            variant="outline"
                            className="sm:w-auto"
                            disabled={isLeaving}
                          >
                            {isLeaving ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : null}
                            {isLeaving ? "Saliendo..." : "Abandonar grupo"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Quieres abandonar el grupo?
                            </AlertDialogTitle>
                          <AlertDialogDescription>
                              Dejarás de recibir actualizaciones de &quot;{display?.name}&quot; y necesitarás volver a unirte para participar.
                          </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLeaveGroup} disabled={isLeaving}>
                              {isLeaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : null}
                              {isLeaving ? "Saliendo..." : "Confirmar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button size="lg" variant="outline" className="sm:w-auto" disabled>
                        Eres administradora
                      </Button>
                    )}
                  </>
                ) : canJoin ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="lg" className="sm:w-auto">
                        Unirse al grupo
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          ¿Confirmas que quieres unirte al grupo?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Pasarás a ser miembro de &quot;{display?.name}&quot; y podrías recibir notificaciones.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleJoinGroup} disabled={isJoining}>
                          {isJoining ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : null}
                          {isJoining ? "Uniéndote..." : "Aceptar y unirse"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button size="lg" variant="outline" className="sm:w-auto" disabled>
                    {display?.isAdmin ? "Eres administradora" : "Unión no disponible"}
                  </Button>
                )}
              </div>
              <Button variant="outline" size="lg" className="sm:w-auto">
                Contactar Administrador
              </Button>
              {display.isAdmin ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="lg"
                      className="sm:w-auto"
                      disabled={isDeletingGroup}
                    >
                      {isDeletingGroup ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : null}
                      {isDeletingGroup ? "Eliminando..." : "Eliminar grupo"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar el grupo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará &quot;{display.name}&quot; y todas sus publicaciones. No se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteGroup} disabled={isDeletingGroup}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-subtle text-muted-foreground">
          Cargando grupo...
        </div>
      }
    >
      <RequireAuth>
        <div className="min-h-screen bg-gradient-subtle">
          <SkipToContent />
          {renderHeader()}
          {activeImagePreview ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
              role="dialog"
              aria-modal="true"
              onClick={closeImagePreview}
            >
              <div
                className="w-full max-w-3xl space-y-4 rounded-lg bg-background p-4 shadow-lg"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="flex-1 truncate text-sm font-medium text-foreground">
                    {activeImagePreview.name}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeImagePreview}
                    aria-label="Cerrar vista previa"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <div className="max-h-[70vh] overflow-auto rounded-md border bg-muted/40 p-2">
                  <img
                    src={activeImagePreview.url}
                    alt={activeImagePreview.name}
                    className="mx-auto max-h-[65vh] w-full object-contain"
                  />
                </div>
              </div>
            </div>
          ) : null}
          <main id="main-content">{renderContent()}</main>
        </div>
      </RequireAuth>
    </Suspense>
  );
}
