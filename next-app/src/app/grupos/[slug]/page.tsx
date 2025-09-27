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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import * as groupsApi from "@/lib/groups-api";
import type { Group } from "@/lib/groups-api";

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
          };

          setGroup(hydratedGroup);
          setIsMember(hydratedGroup.members.some((member) => member.userId === user.id));
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
        };
        setGroup(hydratedGroup);
        setIsMember(true);
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

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              {isMember ? (
                <Button size="lg" disabled>
                  Ya eres miembro
                </Button>
              ) : canJoin ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="lg" className="mt-4 sm:mt-0">
                      Unirse al Grupo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        ¿Confirmas que quieres unirte al grupo?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Pasarás a ser miembro de &quot;{display.name}&quot; y podrías recibir notificaciones.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleJoinGroup} disabled={isJoining}>
                        {isJoining ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : null}
                        {isJoining ? "Uniéndote..." : "Aceptar y Unirse"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button size="lg" disabled>
                  {display.isAdmin ? "Eres administradora" : "Unión no disponible"}
                </Button>
              )}
              <Button variant="outline" size="lg">
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
