"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Users, Activity, ClipboardList } from "lucide-react";

import SkipToContent from "@/components/SkipToContent";
import { NotificationsBell } from "@/components/notifications-bell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import * as groupsApi from "@/lib/groups-api";
import type { GroupActivitySummary } from "@/lib/groups-api";

export default function GroupDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-subtle text-muted-foreground">
          Cargando tablero de actividad...
        </div>
      }
    >
      <RequireAuth>
        <DashboardContent />
      </RequireAuth>
    </Suspense>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<GroupActivitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setIsRefreshing(true);
    if (!summary) {
      setIsLoading(true);
    }

    try {
      const response = await groupsApi.getGroupActivitySummary(user.id);
      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        toast({
          title: "No se pudo cargar el tablero",
          description: response.error || "Inténtalo nuevamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error obteniendo métricas", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al consultar el tablero.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [summary, user?.id]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  const loadingState = isLoading && !summary;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SkipToContent />
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">Tablero de Grupos</h1>
            <p className="text-sm text-muted-foreground">Actividad reciente y tendencias de tus comunidades.</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchSummary} disabled={isRefreshing}>
                {isRefreshing ? "Actualizando..." : "Actualizar"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                Volver
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-10 space-y-8">
        {loadingState ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader />
            <p>Consultando actividad reciente...</p>
          </div>
        ) : summary ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Grupos con más miembros</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {summary.topByMembers.length ? (
                    summary.topByMembers.map((group) => (
                      <div key={group.id} className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{group.name}</span>
                        <span className="text-muted-foreground">{group.memberCount} miembros</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Todavía no hay datos suficientes.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Grupos con más publicaciones</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {summary.topByPosts.length ? (
                    summary.topByPosts.map((group) => (
                      <div key={group.id} className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">{group.name}</span>
                        <span className="text-muted-foreground">{group.postCount} publicaciones</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Aún no se han registrado publicaciones.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resumen</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold text-foreground">{summary.topByMembers.reduce((acc, group) => acc + group.memberCount, 0)}</span> integrantes en los grupos destacados.
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">{summary.recentPosts.length}</span> publicaciones en los últimos días.
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">{summary.recentMembers.length}</span> nuevos miembros se sumaron recientemente.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Publicaciones recientes</CardTitle>
                  <CardDescription>Actividad más nueva en tus grupos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {summary.recentPosts.length ? (
                    summary.recentPosts.map((post) => (
                      <div key={post.id} className="rounded-md border p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{post.authorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleString()} · {post.groupName}
                            </p>
                          </div>
                          <Badge variant={post.isPublic ? "default" : "secondary"}>
                            {post.isPublic ? "Público" : "Privado"}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {post.content ?? post.link ?? (post.image ? "Publicación con imagen" : post.file ? "Publicación con archivo adjunto" : "Publicación sin texto")}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 inline-flex items-center gap-2"
                          onClick={() => router.push(`/grupos/${post.groupSlug}`)}
                        >
                          Ir al grupo
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay publicaciones recientes.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Nuevos miembros</CardTitle>
                  <CardDescription>Quiénes se unieron recientemente a tus comunidades.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {summary.recentMembers.length ? (
                    summary.recentMembers.map((member) => (
                      <div key={`${member.groupId}-${member.userId}-${member.joinedAt}`} className="rounded-md border p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{member.userId}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(member.joinedAt).toLocaleString()} · {member.groupName}
                            </p>
                          </div>
                          <Badge variant={member.isPublic ? "default" : "secondary"}>
                            {member.isPublic ? "Público" : "Privado"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Rol: {member.role}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 inline-flex items-center gap-2"
                          onClick={() => router.push(`/grupos/${member.groupSlug}`)}
                        >
                          Ver grupo
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin nuevos miembros registrados aún.</p>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Sin datos disponibles</CardTitle>
              <CardDescription>
                Crea o únete a grupos para empezar a recibir estadísticas.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>
    </div>
  );
}

function Loader() {
  return (
    <svg className="h-6 w-6 animate-spin text-muted-foreground" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
