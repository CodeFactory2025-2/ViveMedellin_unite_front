"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Users,
  Calendar,
  Globe,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";

import SkipToContent from "@/components/SkipToContent";
import { RequireAuth } from "@/components/require-auth";
import { NotificationsBell } from "@/components/notifications-bell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRequestStatus } from "@/hooks/use-request-status";
import * as groupsApi from "@/lib/groups-api";
import type { Group, GroupJoinRequest } from "@/lib/groups-api";

const visibilityOptions = [
  { value: "all", label: "Todos" },
  { value: "public", label: "Solo públicos" },
  { value: "private", label: "Solo privados" },
];

export default function ExploreGroupsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestTargetGroup, setRequestTargetGroup] = useState<Group | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const { rejectedGroups, markRejected, clearRejected } = useRequestStatus(joinRequests, user?.id);

  useEffect(() => {
    let isMounted = true;

    const fetchGroups = async () => {
      if (!user?.id) {
        return;
      }

      setLoading(true);
      try {
        const response = await groupsApi.getAllGroups(user.id);
        if (!isMounted) return;

        if (response.success && response.data) {
          setGroups(response.data);
          setFilteredGroups(response.data);
        } else {
          toast({
            title: "Error",
            description: response.error || "No se pudieron cargar los grupos.",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error al cargar grupos:", error);
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los grupos.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchGroups();

    return () => {
      isMounted = false;
    };
  }, [toast, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setJoinRequests([]);
      return;
    }

    let isMounted = true;

    const loadRequests = async () => {
      try {
        const response = await groupsApi.getUserJoinRequests(user.id);
        if (isMounted && response.success && response.data) {
          setJoinRequests(response.data);
        }
      } catch (error) {
        console.error("Error al cargar solicitudes de ingreso:", error);
      }
    };

    void loadRequests();

    if (typeof window !== "undefined") {
      const handleUpdate = (event: Event) => {
        const custom = event as CustomEvent;
        const detail = (custom.detail ?? {}) as { action?: string; groupId?: string; userId?: string };
        if (detail?.action === "accepted" && detail.userId === user?.id && detail.groupId) {
          setGroups((previous) =>
            previous.map((group) =>
              group.id === detail.groupId
                ? {
                    ...group,
                    members: group.members.some((member) => member.userId === user.id)
                      ? group.members
                      : [
                          ...group.members,
                          { userId: user.id, role: "member", joinedAt: Date.now() },
                        ],
                  }
                : group,
            ),
          );
          setJoinRequests((prev) => prev.filter((request) => request.groupId !== detail.groupId));
          clearRejected(detail.groupId);
        }
        if (detail?.action === "rejected" && detail.userId === user?.id && detail.groupId) {
          markRejected(detail.groupId);
        }
        void loadRequests();
      };

      window.addEventListener("group-requests:updated", handleUpdate as EventListener);
      return () => {
        isMounted = false;
        window.removeEventListener("group-requests:updated", handleUpdate as EventListener);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!groups.length) {
      setFilteredGroups([]);
      return;
    }

    let result = [...groups];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((group) => {
        const name = group.name?.toLowerCase?.() ?? "";
        const description = group.description?.toLowerCase?.() ?? "";
        const theme = group.theme?.toLowerCase?.() ?? "";

        return name.includes(term) || description.includes(term) || theme.includes(term);
      });
    }

    if (selectedCategory !== "all") {
      result = result.filter((group) => group.category === selectedCategory);
    }

    if (visibilityFilter !== "all") {
      const isPublic = visibilityFilter === "public";
      result = result.filter((group) => group.isPublic === isPublic);
    }

    setFilteredGroups(result);
  }, [groups, searchTerm, selectedCategory, visibilityFilter]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    groups.forEach((group) => {
      const category = typeof group.category === "string" ? group.category.trim() : "";
      if (category) {
        uniqueCategories.add(category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [groups]);

  const handleOpenRequestDialog = (group: Group) => {
    if (!user?.id) {
      toast({
        title: "Acción no permitida",
        description: "Debes iniciar sesión para enviar una solicitud.",
        variant: "destructive",
      });
      return;
    }

    if (groupsApi.checkPendingJoinRequest(user.id, group.id)) {
      toast({
        title: "Solicitud pendiente",
        description: "Ya tienes una solicitud pendiente para este grupo.",
        variant: "destructive",
      });
      setJoinRequests((previous) => {
        if (previous.some((request) => request.groupId === group.id && request.status === "pending")) {
          return previous;
        }
        const optimistic = {
          id: `pending-${Date.now()}`,
          groupId: group.id,
          groupSlug: group.slug,
          groupName: group.name,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          status: "pending" as const,
          createdAt: Date.now(),
        };
        return [optimistic, ...previous];
      });
      return;
    }

    setRequestTargetGroup(group);
    setRequestDialogOpen(true);
  };

  const handleRequestDialogChange = (open: boolean) => {
    if (!open && isSubmittingRequest) {
      return;
    }

    setRequestDialogOpen(open);
    if (!open) {
      setRequestTargetGroup(null);
    }
  };

  const handleConfirmJoinRequest = async () => {
    if (!user?.id || !requestTargetGroup) {
      toast({
        title: "Acción no disponible",
        description: "Debes iniciar sesión nuevamente para enviar la solicitud.",
        variant: "destructive",
      });
      return;
    }

    if (joinRequests.some((request) => request.groupId === requestTargetGroup.id && request.status === "pending")) {
      toast({
        title: "Solicitud pendiente",
        description: "Ya tienes una solicitud pendiente para este grupo.",
        variant: "destructive",
      });
      setRequestDialogOpen(false);
      setRequestTargetGroup(null);
      return;
    }

    const optimisticRequestId = `pending-${Date.now()}`;
    const optimisticRequest: GroupJoinRequest = {
      id: optimisticRequestId,
      groupId: requestTargetGroup.id,
      groupSlug: requestTargetGroup.slug,
      groupName: requestTargetGroup.name,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      status: "pending",
      createdAt: Date.now(),
    };

    setJoinRequests((previous) => [optimisticRequest, ...previous]);
    setIsSubmittingRequest(true);

    try {
      const response = await groupsApi.requestJoinGroup(requestTargetGroup.id, user.id, {
        userName: user.name,
        userEmail: user.email,
      });

      if (response.success && response.data) {
        setJoinRequests((previous) => [
          response.data!,
          ...previous.filter(
            (request) => request.id !== optimisticRequestId && request.id !== response.data?.id,
          ),
        ]);
        toast({
          title: "Tu solicitud ha sido enviada exitosamente",
          description: `Notificamos al equipo administrador de "${requestTargetGroup.name}".`,
        });
        setRequestDialogOpen(false);
        setRequestTargetGroup(null);
      } else {
        setJoinRequests((previous) => previous.filter((request) => request.id !== optimisticRequestId));
        toast({
          title: "No pudimos enviar la solicitud",
          description:
            response.error ||
            "Hubo un error técnico al procesar tu solicitud. No fue posible enviarla. Por favor, inténtalo nuevamente más tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setJoinRequests((previous) => previous.filter((request) => request.id !== optimisticRequestId));
      toast({
        title: "No pudimos enviar la solicitud",
        description:
          error instanceof Error
            ? error.message
            : "Hubo un error técnico al procesar tu solicitud. No fue posible enviarla. Por favor, inténtalo nuevamente más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user?.id) {
      toast({
        title: "Acción no permitida",
        description: "Debes iniciar sesión para unirte a un grupo.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await groupsApi.joinGroup(groupId, user.id);

      if (response.success && response.data) {
        toast({
          title: "¡Te has unido al grupo!",
          description: `Ahora eres miembro de ${response.data.name}.`,
        });

        setGroups((prev) =>
          prev.map((group) => (group.id === groupId ? response.data ?? group : group)),
        );
      } else {
        toast({
          title: "Error",
          description: response.error || "No se pudo unir al grupo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al unirse al grupo:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al unirse al grupo.",
        variant: "destructive",
      });
    }
  };

  const isMember = (group: Group) => {
    if (!user?.id || !Array.isArray(group.members)) {
      return false;
    }

    return group.members.some((member) => member.userId === user.id);
  };

  const renderStatusIcon = (group: Group) =>
    group.isPublic ? (
      <div className="flex items-center gap-1 text-sm text-primary">
        <Globe className="h-4 w-4" aria-hidden="true" /> Público
      </div>
    ) : (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" aria-hidden="true" /> Privado
      </div>
    );

  return (
    <>
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-subtle text-muted-foreground">
          Cargando...
        </div>
      }
    >
      <RequireAuth>
        <div className="min-h-screen bg-gradient-subtle">
          <SkipToContent />
        <main id="main-content" className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button variant="ghost" onClick={() => router.push("/")}>
                Volver al inicio
              </Button>
              <h1 className="text-3xl font-bold">Explorar Grupos</h1>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2 justify-end">
              <NotificationsBell />
              <Button
                onClick={() => router.push("/grupos/crear")}
                className="bg-gradient-primary w-full md:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Crear Grupo
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="md:col-span-1">
              <label htmlFor="search" className="sr-only">
                Buscar grupos
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por nombre o tema"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-1">
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Categorías</SelectLabel>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1">
              <Select
                value={visibilityFilter}
                onValueChange={(value) => setVisibilityFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Visibilidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Visibilidad</SelectLabel>
                    {visibilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              <span className="ml-2">Cargando grupos...</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg font-medium">No encontramos grupos que coincidan con tu búsqueda.</p>
              <p className="text-muted-foreground">
                Ajusta los filtros o crea un nuevo grupo para tu comunidad.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredGroups.map((group) => {
                const memberCount = group.members?.length ?? 0;
                const alreadyMember = isMember(group);
                const hasPendingRequest = joinRequests.some(
                  (request) => request.groupId === group.id && request.status === "pending",
                );
                const isRejectedTemp = !alreadyMember && rejectedGroups[group.id];
                const privateButtonVariant: "default" | "secondary" | "ghost" | "destructive" = alreadyMember
                  ? "ghost"
                  : isRejectedTemp
                    ? "destructive"
                    : hasPendingRequest
                    ? "secondary"
                    : "default";

                return (
                  <Card key={group.id} className="flex flex-col justify-between">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-2xl flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                            {group.name}
                          </CardTitle>
                          <CardDescription className="mt-2 line-clamp-2">
                            {group.description || "Este grupo aún no tiene descripción."}
                          </CardDescription>
                        </div>
                        {renderStatusIcon(group)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        Creado el {new Date(group.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Tema:</span> {group.theme || "General"}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        variant="secondary"
                        onClick={() => router.push(`/grupos/${group.slug}`)}
                        className="w-full sm:w-auto"
                      >
                        Ver detalles
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Button>
                      {group.isPublic ? (
                        <Button
                          onClick={() => handleJoinGroup(group.id)}
                          disabled={alreadyMember}
                          className="w-full sm:w-auto"
                        >
                          {alreadyMember ? "Ya eres miembro" : "Unirse"}
                        </Button>
                      ) : (
                        <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
                          <Button
                            onClick={() => handleOpenRequestDialog(group)}
                            disabled={alreadyMember || hasPendingRequest || isRejectedTemp}
                            className="w-full sm:w-auto"
                            variant={privateButtonVariant as any}
                          >
                            {alreadyMember
                              ? "Ya eres miembro"
                              : isRejectedTemp
                                ? "Solicitud rechazada"
                              : hasPendingRequest
                                ? "Solicitud enviada"
                                : "Solicitar unirse"}
                          </Button>
                          {!alreadyMember &&
                          hasPendingRequest ? (
                            <p className="text-center text-xs text-muted-foreground sm:text-right">
                              Ya tienes una solicitud pendiente para este grupo.
                            </p>
                          ) : isRejectedTemp ? (
                            <p className="text-center text-xs text-destructive sm:text-right">
                              Tu solicitud fue rechazada. Puedes volver a intentarlo en unos momentos.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
        </div>
      </RequireAuth>
    </Suspense>

      <AlertDialog open={requestDialogOpen} onOpenChange={handleRequestDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmar solicitud
            </AlertDialogTitle>
            <AlertDialogDescription>
              {requestTargetGroup
                ? `¿Desea enviar una solicitud al grupo "${requestTargetGroup.name}"?`
                : "¿Desea enviar una solicitud al grupo?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingRequest}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmJoinRequest} disabled={isSubmittingRequest}>
              {isSubmittingRequest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Enviando...
                </>
              ) : (
                "Enviar solicitud"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
