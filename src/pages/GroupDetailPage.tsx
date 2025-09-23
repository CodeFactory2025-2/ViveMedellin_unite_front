import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Users, ArrowLeft, MapPin, Calendar, User } from 'lucide-react';

const GroupDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-subtle">
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
              to="/grupos/crear" 
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Volver
            </Link>
            <Button variant="outline" onClick={logout} size="sm">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl font-bold mb-2">
                    Detalle del Grupo
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Grupo: <span className="font-medium">{slug}</span>
                  </CardDescription>
                </div>
                <Badge className="bg-gradient-primary text-white">
                  Activo
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
                      <p className="text-muted-foreground">25 personas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-muted-foreground">Medellín, Antioquia</p>
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
                      <p className="text-muted-foreground">Marzo 2024</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Administrador</p>
                      <p className="text-muted-foreground">Usuario Demo</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
                  <Users className="mr-2 h-4 w-4" />
                  Unirse al Grupo
                </Button>
                <Button variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  Contactar Administrador
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;