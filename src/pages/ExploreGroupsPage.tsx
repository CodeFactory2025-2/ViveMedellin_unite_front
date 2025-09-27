import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as groupsApi from '@/lib/groups-api';
import { Group } from '@/lib/groups-api';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Users,
  Calendar,
  Globe,
  Lock,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ExploreGroupsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all', 'public', 'private'

  // Obtener todos los grupos cuando se monta el componente
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        if (!user?.id) {
          toast({
            title: "Error",
            description: "Debes iniciar sesión para ver grupos",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }

        const response = await groupsApi.getAllGroups(user.id);
        
        if (response.success && response.data) {
          setGroups(response.data);
          setFilteredGroups(response.data);
        } else {
          toast({
            title: "Error",
            description: "No se pudieron cargar los grupos",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error al cargar grupos:", error);
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los grupos",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user, navigate, toast]);

  // Filtrar grupos cuando cambian los criterios de búsqueda
  useEffect(() => {
    if (!groups.length) return;

    let filtered = [...groups];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(group => {
        const name = group.name?.toLowerCase?.() ?? '';
        const description = group.description?.toLowerCase?.() ?? '';
        const theme = group.theme?.toLowerCase?.() ?? '';

        return name.includes(term) || description.includes(term) || theme.includes(term);
      });
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(group => {
        if (typeof group.category !== 'string') {
          return false;
        }
        return group.category === selectedCategory;
      });
    }

    // Filtrar por visibilidad
    if (visibilityFilter !== 'all') {
      const isPublic = visibilityFilter === 'public';
      filtered = filtered.filter(group => group.isPublic === isPublic);
    }

    setFilteredGroups(filtered);
  }, [searchTerm, selectedCategory, visibilityFilter, groups]);

  // Extraer todas las categorías únicas de los grupos
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>();
    groups.forEach(group => {
      const category = typeof group.category === 'string' ? group.category.trim() : '';
      if (category) {
        uniqueCategories.add(category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [groups]);

  // Manejar unirse a un grupo
  const handleJoinGroup = async (groupId: string) => {
    try {
      if (!user?.id) return;
      
      const response = await groupsApi.joinGroup(groupId, user.id);
      
      if (response.success) {
        toast({
          title: "¡Te has unido al grupo!",
          description: `Ahora eres miembro de ${response.data?.name || 'este grupo'}.`,
        });
        
        // Actualizar la lista de grupos
        const updatedGroups = groups.map(group =>
          group.id === groupId && response.data ? response.data : group
        );
        
        setGroups(updatedGroups);
      } else {
        toast({
          title: "Error",
          description: response.error || "No se pudo unir al grupo",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al unirse al grupo:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al unirse al grupo",
        variant: "destructive"
      });
    }
  };

  // Comprobar si el usuario ya es miembro de un grupo
  const isMember = (group: Group) => {
    if (!user?.id) {
      return false;
    }

    if (!Array.isArray(group.members)) {
      return false;
    }

    return group.members.some(member => member.userId === user.id);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="ghost" onClick={() => navigate('/')}>Volver al inicio</Button>
          <h1 className="text-3xl font-bold">Explorar Grupos</h1>
        </div>
        <Button onClick={() => navigate('/grupos/crear')} className="bg-gradient-primary w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Crear Grupo
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Buscar grupos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Visibilidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los grupos</SelectItem>
            <SelectItem value="public">Grupos públicos</SelectItem>
            <SelectItem value="private">Grupos privados (miembro)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de grupos */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map(group => {
            const categoryLabel = typeof group.category === 'string' && group.category.trim().length > 0
              ? group.category
              : 'Sin categoría';
            const description = typeof group.description === 'string' && group.description.trim().length > 0
              ? group.description
              : 'Aún no hay una descripción para este grupo.';

            return (
            <Card key={group.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {group.imageUrl && (
                <div className="w-full h-48 overflow-hidden">
                  <img 
                    src={group.imageUrl} 
                    alt={group.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                    {group.isPublic ? (
                    <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <CardDescription>
                  <span className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
                    {categoryLabel}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-muted-foreground mb-4">
                  {description}
                </p>
                {group.theme && (
                  <p className="text-sm font-medium mb-2">
                    <span className="font-bold">Tema:</span> {group.theme}
                  </p>
                )}
                 <div className="flex items-center text-sm text-muted-foreground mt-4">
                  <Users className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span>{Array.isArray(group.members) ? group.members.length : 0} miembros</span>
                  {Array.isArray(group.events) && group.events.length > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      <Calendar className="h-4 w-4 mr-1" aria-hidden="true" />
                      <span>{group.events.length} eventos</span>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/grupos/${group.slug ?? group.id}`)}
                >
                  Ver detalles
                </Button>
                {!isMember(group) ? (
                  <Button 
                    onClick={() => handleJoinGroup(group.id)}
                    disabled={!group.isPublic}
                  >
                    {group.isPublic ? "Unirse" : "Grupo privado"}
                  </Button>
                ) : (
                  <Button variant="secondary">
                    Ya eres miembro
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
          })}
        </div>
      ) : (
        <div className="text-center p-10 border rounded-lg">
          <h3 className="text-xl font-medium mb-2">No se encontraron grupos</h3>
          <p className="text-muted-foreground mb-4">
            No hay grupos que coincidan con tus criterios de búsqueda o aún no te has unido a ningún grupo.
          </p>
          <Button onClick={() => navigate('/grupos/crear')}>
            Crear tu primer grupo
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExploreGroupsPage;
