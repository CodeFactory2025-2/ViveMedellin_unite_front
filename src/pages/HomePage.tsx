import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Heart, MapPin } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="bg-gradient-hero bg-clip-text text-transparent mb-6">
            <h1 className="text-6xl md:text-7xl font-bold mb-4">
              ViveMedellín
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Conecta con tu ciudad, descubre experiencias únicas y vive Medellín como nunca antes
          </p>
          
          <Link to="/grupos/crear">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-8 py-6 h-auto"
            >
              <Users className="mr-2 h-5 w-5" />
              Crear Grupo
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 text-center hover:shadow-primary transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Crea Grupos</h3>
            <p className="text-muted-foreground">
              Forma comunidades con personas que comparten tus intereses
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-primary transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Conecta</h3>
            <p className="text-muted-foreground">
              Conoce paisas auténticos y comparte experiencias inolvidables
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-primary transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Explora</h3>
            <p className="text-muted-foreground">
              Descubre los rincones más hermosos de la ciudad de la eterna primavera
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;