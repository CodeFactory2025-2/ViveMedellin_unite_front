"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Loader2,
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import * as groupsApi from "@/lib/groups-api";
import type { Group, GroupPost } from "@/lib/groups-api";

const DEFAULT_LOCATION = "Medellín, Colombia";

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
  const [isPosting, setIsPosting] = useState(false);

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

  const handleCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!group || !user?.id) {
      toast({
        title: "Acción no disponible",
        description: "Debes iniciar sesión para publicar en el grupo.",
        variant: "destructive",
      });
      return;
    }

    const content = newPostContent.trim();
    if (!content) {
      toast({
        title: "Publicación vacía",
        description: "Escribe un mensaje antes de publicar.",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);

    try {
      const response = await groupsApi.createGroupPost(
        group.id,
        {
          content,
          authorId: user.id,
          authorName: user.name || user.email || "Miembro del grupo",
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
        toast({
          title: "Publicación creada",
          description: "Tu mensaje ahora es visible para el grupo.",
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
          error instanceof Error ? error.message : "Hubo un error técnico. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const display = useMemo(() => {
    if (!group) {
      return null;
    }

    const createdAt = group.createdAt
      ? new Date(group.createdAt).toLocaleDateString()
      : undefined;

    const isAdmin = Boolean(user?.id && group.creatorId === user.id);

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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-lg font-semibold">Publicaciones del grupo</h2>
                {posts.length ? (
                  <span className="text-xs text-muted-foreground">
                    {posts.length} {posts.length === 1 ? "publicación" : "publicaciones"}
                  </span>
                ) : null}
              </div>

              {canCreatePost ? (
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <label htmlFor="group-post" className="sr-only">
                    Escribe una publicación para el grupo
                  </label>
                  <Textarea
                    id="group-post"
                    placeholder="Comparte noticias, actividades o preguntas para tu comunidad..."
                    value={newPostContent}
                    onChange={(event) => setNewPostContent(event.target.value)}
                    minLength={1}
                    maxLength={1000}
                    disabled={isPosting}
                    aria-describedby="group-post-helper"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground" id="group-post-helper">
                    <span>Máximo 1000 caracteres.</span>
                    <span>{newPostContent.trim().length}/1000</span>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isPosting}>
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
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Debes ser miembro del grupo para crear publicaciones.
                </p>
              )}

              <div className="space-y-3">
                {posts.length ? (
                  posts.map((post) => (
                    <div key={post.id} className="rounded-lg border bg-card p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{post.authorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground mt-3 whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aún no hay publicaciones. Sé la primera en iniciar la conversación.
                  </p>
                )}
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
          <main id="main-content">{renderContent()}</main>
        </div>
      </RequireAuth>
    </Suspense>
  );
}
