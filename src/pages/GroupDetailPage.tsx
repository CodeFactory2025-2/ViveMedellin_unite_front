import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Users, ArrowLeft, MapPin, Calendar, User, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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
} from '@/components/ui/alert-dialog';
import SkipToContent from '@/components/SkipToContent';
import * as groupsApi from '@/lib/groups-api';
import type { Group } from '@/lib/groups-api';

const DEFAULT_LOCATION = 'Medellín, Colombia';

const GroupDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { logout, user } = useAuth();
  const userId = user?.id;

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const fallbackGroup = location.state?.newGroupData as
    | {
        id: string;
        slug?: string;
        name: string;
        description?: string;
        memberCount?: number;
        createdAt?: string;
        creator?: { id?: string; name?: string; email?: string };
        location?: string;
        category?: string;
        topic?: string;
        otherTopic?: string;
        isPublic?: boolean;
      }
    | undefined;

  useEffect(() => {
    if (!slug || !userId) {
      return;
    }

    let isActive = true;

    const fetchGroup = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await groupsApi.getGroupBySlug(slug, userId);
        if (!isActive) return;

        if (response.success && response.data) {
          const hydratedGroup: Group = {
            ...response.data,
            members: [...response.data.members],
            events: [...response.data.events],
          };
          setGroup(hydratedGroup);
          setIsMember(hydratedGroup.members.some((member) => member.userId === userId));
        } else {
          setError(response.error || 'No fue posible cargar el grupo.');
        }
      } catch (fetchError) {
        if (!isActive) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Ocurrió un error al cargar la información del grupo.'
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
  }, [slug, userId]);

  useEffect(() => {
    if (group && userId) {
      setIsMember(group.members.some((member) => member.userId === userId));
    }
  }, [group, userId]);

  const handleJoinGroup = async () => {
    if (!group || !userId) {
      toast({
        title: 'No fue posible unirse al grupo',
        description: 'Debes iniciar sesión nuevamente para completar esta acción.',
        variant: 'destructive',
      });
      return;
    }

    setIsJoining(true);

    try {
      const response = await groupsApi.joinGroup(group.id, userId);

      if (response.success && response.data) {
        const hydratedGroup: Group = {
          ...response.data,
          members: [...response.data.members],
          events: [...response.data.events],
        };
        setGroup(hydratedGroup);
        setIsMember(true);
        toast({
          title: '¡Bienvenida al grupo! 🎉',
          description: `Te has unido a "${hydratedGroup.name}" exitosamente.`,
        });
      } else {
        toast({
          title: 'No fue posible unirse al grupo',
          description: response.error || 'Inténtalo de nuevo más tarde.',
          variant: 'destructive',
        });
      }
    } catch (joinError) {
      toast({
        title: 'No fue posible unirse al grupo',
        description:
          joinError instanceof Error
            ? joinError.message
            : 'Hubo un error técnico. Inténtalo nuevamente más tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const display = useMemo(() => {
    const source = group ?? fallbackGroup;
    const createdAt = group?.createdAt
      ? new Date(group.createdAt).toLocaleDateString()
      : fallbackGroup?.createdAt
      ? new Date(fallbackGroup.createdAt).toLocaleDateString()
      : undefined;

    const isAdmin = Boolean(
      userId && (group?.creatorId === userId || fallbackGroup?.creator?.id === userId)
    );

    return {
      name: source?.name ?? 'Grupo',
      description:
        source?.description ??
        'Aún no tenemos una descripción disponible para este grupo.',
      location:
        (group?.location && group.location.address) || fallbackGroup?.location || DEFAULT_LOCATION,
      category:
        group?.category ||
        fallbackGroup?.category ||
        fallbackGroup?.topic ||
        'General',
      memberCount: group?.members.length ?? fallbackGroup?.memberCount ?? 0,
      createdAt,
      isPublic: group?.isPublic ?? fallbackGroup?.isPublic ?? true,
      isAdmin,
      creatorLabel:
        fallbackGroup?.creator?.name ||
        (group?.creatorId === userId ? user?.name || user?.email || 'Tú' : 'Administrador'),
    };
  }, [fallbackGroup, group, userId, user?.email, user?.name]);

  const canJoin = Boolean(group) && display.isPublic && !display.isAdmin && !isMember;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SkipToContent />
      {/* Navigation Bar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              ViveMedellín
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver al Inicio
            </Link>
            <Button variant="outline" onClick={logout} size="sm">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </nav>

      <main id="main-content" className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="sr-only">Cargando información del grupo…</span>
            </div>
          ) : error ? (
            <Card className="shadow-primary">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">No se pudo cargar el grupo</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link to="/grupos">Volver a grupos</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-primary">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl font-bold mb-2">
                      {display.name}
                    </CardTitle>
                    <CardDescription className="text-lg">
                      Grupo: <span className="font-medium">{slug}</span>
                    </CardDescription>
                    <p className="mt-4 text-muted-foreground leading-relaxed">{display.description}</p>
                  </div>
                  <Badge className="bg-gradient-primary text-white">
                    {display.isPublic ? 'Público' : 'Privado'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Group Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Miembros</p>
                        <p className="text-muted-foreground">{display.memberCount} {display.memberCount === 1 ? 'persona' : 'personas'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Ubicación</p>
                        <p className="text-muted-foreground">{display.location}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Creado</p>
                        <p className="text-muted-foreground">{display.createdAt ?? 'Fecha no disponible'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Administrador</p>
                        <p className="text-muted-foreground">{display.creatorLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                  {display.isAdmin ? (
                    <Badge variant="secondary" className="h-10 px-4 flex items-center justify-center">
                      <User className="mr-2 h-4 w-4" />
                      Eres el Administrador
                    </Badge>
                  ) : isMember ? (
                    <Button size="lg" disabled>
                      Ya eres miembro
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="lg" className="mt-4" disabled={!canJoin}>
                          Unirse al Grupo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Confirmas que quieres unirte al grupo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Pasarás a ser miembro de "{display.name}" y podrías recibir notificaciones.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleJoinGroup} disabled={isJoining}>
                            {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isJoining ? 'Uniéndote…' : 'Aceptar y Unirse'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button variant="outline">
                    <User className="mr-2 h-4 w-4" />
                    Contactar Administrador
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default GroupDetailPage;
