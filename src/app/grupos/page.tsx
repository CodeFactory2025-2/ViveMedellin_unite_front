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
import * as groupsApi from "@/lib/groups-api";
import type { Group } from "@/lib/groups-api";

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
                    <CardFooter className="flex justify-between items-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => router.push(`/grupos/${group.slug}`)}
                      >
                        Ver detalles
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        onClick={() => handleJoinGroup(group.id)}
                        disabled={alreadyMember || !group.isPublic}
                      >
                        {alreadyMember ? "Ya eres miembro" : "Unirse"}
                      </Button>
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
  );
}
