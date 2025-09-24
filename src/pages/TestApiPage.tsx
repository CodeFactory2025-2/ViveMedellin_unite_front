import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import * as api from '@/lib/api';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const TestApiPage: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para el formulario de registro
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  
  // Estados para el formulario de login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Estado para mostrar los usuarios registrados
  const [users, setUsers] = useState<any[]>([]);
  
  // Estado para verificar manualmente un usuario
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  // Función para obtener y mostrar todos los usuarios (solo para propósitos de prueba)
  const fetchUsers = () => {
    const storedUsers = localStorage.getItem('vive-medellin-users');
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      setUsers(parsedUsers);
    } else {
      setUsers([]);
    }
  };
  
  // Función para registrar un nuevo usuario
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validaciones básicas
      if (!registerEmail || !registerPassword) {
        toast({
          title: "Error",
          description: "El correo y la contraseña son obligatorios",
          variant: "destructive"
        });
        return;
      }
      
      // Llamar a la API de registro
      const response = await api.register({
        email: registerEmail,
        password: registerPassword,
        name: registerName
      });
      
      if (response.success) {
        toast({
          title: "¡Registro exitoso!",
          description: "Se ha enviado un correo de verificación a tu dirección de correo electrónico.",
        });
        
        // Limpiar el formulario
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterName('');
        
        // Actualizar la lista de usuarios
        fetchUsers();
        
        // Simular verificación automática (solo para pruebas)
        const users = JSON.parse(localStorage.getItem('vive-medellin-users') || '[]');
        const user = users.find((u: any) => u.email === registerEmail);
        if (user && user.verificationToken) {
          console.log(`Token de verificación para ${registerEmail}: ${user.verificationToken}`);
          await api.verifyEmail(registerEmail, user.verificationToken);
          toast({
            title: "¡Correo verificado!",
            description: "Tu correo ha sido verificado automáticamente (solo para pruebas)",
          });
          fetchUsers();
        }
      } else {
        toast({
          title: "Error de registro",
          description: response.error || "No se pudo completar el registro",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive"
      });
      console.error("Error en el registro:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para iniciar sesión
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validaciones básicas
      if (!loginEmail || !loginPassword) {
        toast({
          title: "Error",
          description: "El correo y la contraseña son obligatorios",
          variant: "destructive"
        });
        return;
      }
      
      // Llamar a la API de login
      const response = await api.login({
        email: loginEmail,
        password: loginPassword
      });
      
      if (response.success && response.data) {
        toast({
          title: "¡Inicio de sesión exitoso!",
          description: `Bienvenido ${response.data.user.name || response.data.user.email}`,
        });
        
        // Limpiar el formulario
        setLoginEmail('');
        setLoginPassword('');
      } else {
        toast({
          title: "Error de inicio de sesión",
          description: response.error || "Credenciales incorrectas",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive"
      });
      console.error("Error en el inicio de sesión:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar usuarios cuando se monta el componente
  React.useEffect(() => {
    fetchUsers();
    
    // Inicializar datos de prueba
    api.initializeMockData();
  }, []);
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Prueba de API de Autenticación</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Formulario de Registro */}
        <Card>
          <CardHeader>
            <CardTitle>Registrar Usuario</CardTitle>
            <CardDescription>Crea una nueva cuenta con correo y contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="register-email" className="text-sm font-medium">
                  Correo electrónico
                </label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-password" className="text-sm font-medium">
                  Contraseña
                </label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="******"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-name" className="text-sm font-medium">
                  Nombre (opcional)
                </label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Tu nombre"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  "Registrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Formulario de Login */}
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>Accede a tu cuenta existente</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium">
                  Correo electrónico
                </label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium">
                  Contraseña
                </label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="******"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Verificación Manual de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Verificación Manual de Usuario</CardTitle>
          <CardDescription>Marca un usuario como verificado para que pueda iniciar sesión</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Correo a verificar"
              value={verifyEmail}
              onChange={(e) => setVerifyEmail(e.target.value)}
            />
            <Button 
              onClick={async () => {
                if (!verifyEmail) return;
                setVerifying(true);
                try {
                  const result = await api.verifyUserManually(verifyEmail);
                  if (result.success) {
                    toast({
                      title: "Usuario verificado",
                      description: `El usuario ${verifyEmail} ha sido verificado correctamente`,
                    });
                    fetchUsers();
                    setVerifyEmail('');
                  } else {
                    toast({
                      title: "Error",
                      description: result.error || "No se pudo verificar el usuario",
                      variant: "destructive"
                    });
                  }
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Ha ocurrido un error al verificar el usuario",
                    variant: "destructive"
                  });
                } finally {
                  setVerifying(false);
                }
              }} 
              disabled={verifying || !verifyEmail}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span>Verificar</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuarios Registrados */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>Lista de usuarios registrados en el sistema (solo para pruebas)</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Nombre</th>
                    <th className="text-left py-2">Verificado</th>
                    <th className="text-left py-2">Fecha de registro</th>
                    <th className="text-left py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{user.email}</td>
                      <td className="py-2">{user.name || "-"}</td>
                      <td className="py-2">{user.verified ? "Sí" : "No"}</td>
                      <td className="py-2">{new Date(user.createdAt).toLocaleString()}</td>
                      <td className="py-2">
                        {!user.verified && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={async () => {
                              try {
                                const result = await api.verifyUserManually(user.email);
                                if (result.success) {
                                  toast({
                                    title: "Usuario verificado",
                                    description: `El usuario ${user.email} ha sido verificado correctamente`,
                                  });
                                  fetchUsers();
                                }
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Ha ocurrido un error al verificar el usuario",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            Verificar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay usuarios registrados</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={fetchUsers} variant="outline">
            Actualizar lista
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TestApiPage;