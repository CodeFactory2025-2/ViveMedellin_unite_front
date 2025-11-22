"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Loader2 } from "lucide-react";

import SkipToContent from "@/components/SkipToContent";
import { NotificationsBell } from "@/components/notifications-bell";
import { RequestCard } from "@/components/groups/RequestCard";
import { RequireAuth } from "@/components/require-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import * as groupsApi from "@/lib/groups-api";
import type { JoinRequestWithDetails } from "@/lib/groups-api";

const userLabel = (request: JoinRequestWithDetails) => {
  return request.userName || request.userEmail || "Usuario";
};

export default function JoinRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<JoinRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, "accept" | "reject" | null>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setRequests([]);
      setIsAdmin(false);
      return;
    }

    let isActive = true;

    const loadRequests = async (showSpinner: boolean = false) => {
      if (showSpinner) {
        setLoading(true);
      }

      try {
        const adminGroups = await groupsApi.getJoinRequestsForAdmin(user.id);
        const userIsAdmin = Boolean(
          adminGroups.success && adminGroups.data && adminGroups.data.managedGroups.length,
        );
        setIsAdmin(userIsAdmin);

        const response = await groupsApi.getAdminJoinRequests(user.id);
        if (!isActive) {
          return;
        }

        if (response.success && response.data) {
          setRequests(response.data);
        } else if (response.error) {
          toast({
            title: "No fue posible cargar las solicitudes",
            description: response.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }
        console.error("Error al cargar solicitudes:", error);
        toast({
          title: "No fue posible cargar las solicitudes",
          description: "Inténtalo nuevamente más tarde.",
          variant: "destructive",
        });
      } finally {
        if (showSpinner && isActive) {
          setLoading(false);
        }
      }
    };

    void loadRequests(true);

    if (typeof window !== "undefined") {
      const handler = () => {
        void loadRequests();
      };
      window.addEventListener("group-requests:updated", handler as EventListener);
      return () => {
        isActive = false;
        window.removeEventListener("group-requests:updated", handler as EventListener);
      };
    }

    return () => {
      isActive = false;
    };
  }, [toast, user?.id]);

  const handleAccept = async (request: JoinRequestWithDetails) => {
    if (!user?.id) {
      toast({
        title: "Acción no disponible",
        description: "Debes iniciar sesión nuevamente.",
        variant: "destructive",
      });
      return;
    }

    setProcessing((previous) => ({ ...previous, [request.id]: "accept" }));

    try {
      const response = await groupsApi.acceptJoinRequest(request.id, user.id);
      if (response.success && response.data) {
        setRequests((previous) => previous.filter((item) => item.id !== request.id));
        toast({
          title: "Solicitud aceptada correctamente",
          description: `${userLabel(request)} ahora es miembro de ${request.groupName}. Notificamos por correo su aceptación.`,
        });
      } else {
        toast({
          title: "No fue posible aceptar la solicitud",
          description:
            response.error ||
            "Hubo un error técnico al procesar tu solicitud. Por favor, inténtalo nuevamente más tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "No fue posible aceptar la solicitud",
        description:
          error instanceof Error
            ? error.message
            : "Hubo un error técnico al procesar tu solicitud. Por favor, inténtalo nuevamente más tarde.",
        variant: "destructive",
      });
    } finally {
      setProcessing((previous) => ({ ...previous, [request.id]: null }));
    }
  };

  const handleReject = async (request: JoinRequestWithDetails) => {
    if (!user?.id) {
      toast({
        title: "Acción no disponible",
        description: "Debes iniciar sesión nuevamente.",
        variant: "destructive",
      });
      return;
    }

    setProcessing((previous) => ({ ...previous, [request.id]: "reject" }));

    try {
      const response = await groupsApi.rejectJoinRequest(request.id, user.id);
      if (response.success) {
        setRequests((previous) => previous.filter((item) => item.id !== request.id));
        toast({
          title: "Solicitud rechazada correctamente",
          description: `${userLabel(request)} fue notificado por correo sobre el rechazo.`,
        });
      } else {
        toast({
          title: "No fue posible rechazar la solicitud",
          description:
            response.error ||
            "Hubo un error técnico al procesar tu solicitud. Por favor, inténtalo nuevamente más tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "No fue posible rechazar la solicitud",
        description:
          error instanceof Error
            ? error.message
            : "Hubo un error técnico al procesar tu solicitud. Por favor, inténtalo nuevamente más tarde.",
        variant: "destructive",
      });
    } finally {
      setProcessing((previous) => ({ ...previous, [request.id]: null }));
    }
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          <p>Buscando solicitudes pendientes...</p>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No tienes permisos</CardTitle>
            <CardDescription>No administras ningún grupo con solicitudes pendientes.</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Sin solicitudes pendientes</CardTitle>
          <CardDescription>
            Acepta nuevas solicitudes desde esta sección. Actualizaremos la lista automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 text-muted-foreground">
          <Inbox className="h-10 w-10" aria-hidden="true" />
          <p>No hay solicitudes nuevas por ahora.</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-subtle text-muted-foreground">
          Cargando solicitudes...
        </div>
      }
    >
      <RequireAuth>
        <div className="min-h-screen bg-gradient-subtle">
          <SkipToContent />
          <main id="main-content" className="container mx-auto px-4 py-10">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => router.push("/grupos")}
                  className="text-sm text-primary hover:underline"
                >
                  Volver a grupos
                </button>
                <h1 className="text-3xl font-bold mt-4">Solicitudes de ingreso a tus grupos</h1>
                <p className="text-muted-foreground">
                  Gestiona las solicitudes para unirse a tus grupos privados.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <NotificationsBell />
              </div>
            </header>

            <section className="mt-8 grid gap-6">
              {requests.length
                ? requests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      loading={processing[request.id]}
                    />
                  ))
                : renderEmptyState()}
            </section>
          </main>
        </div>
      </RequireAuth>
    </Suspense>
  );
}
