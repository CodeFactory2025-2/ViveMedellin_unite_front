import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import * as authApi from '@/lib/api';

const TestApiPageNew = () => {
  // Estado para los formularios
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Estado para el loading
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Estado para la lista de usuarios
  const [users, setUsers] = useState<authApi.User[]>([]);
  
  // Función para registrar usuario
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    
    try {
      const result = await authApi.register({
        email: registerEmail,
        password: registerPassword,
        name: registerName || undefined
      });
      
      if (result.success) {
        toast({
          title: 'Registro exitoso',
          description: 'Se ha enviado un correo de verificación (simulado).',
        });
        
        // Resetear formulario
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterName('');
        
        // Refrescar lista de usuarios
        fetchUsers();
      } else {
        toast({
          title: 'Error de registro',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado',
        variant: 'destructive'
      });
    } finally {
      setRegisterLoading(false);
    }
  };
  
  // Función para iniciar sesión
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    try {
      const result = await authApi.login({
        email: loginEmail,
        password: loginPassword
      });
      
      if (result.success) {
        toast({
          title: '¡Inicio de sesión exitoso!',
          description: `Bienvenido ${result.data.user.email}`,
        });
        
        // Resetear formulario
        setLoginEmail('');
        setLoginPassword('');
      } else {
        toast({
          title: 'Error de inicio de sesión',
          description: result.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado',
        variant: 'destructive'
      });
    } finally {
      setLoginLoading(false);
    }
  };
  
  // Función para obtener la lista de usuarios
  const fetchUsers = async () => {
    // En un sistema real, esto sería una llamada administrativa protegida
    const storedUsers = localStorage.getItem('vive-medellin-users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Prueba de API de Autenticación (Nueva)</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Formulario de registro */}
        <Card>
          <CardHeader>
            <CardTitle>Registrar Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email-new">Correo electrónico</Label>
                <input
                  id="register-email-new"
                  type="email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  autoComplete="off"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-password-new">Contraseña</Label>
                <input
                  id="register-password-new"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Contraseña (mín. 6 caracteres)"
                  autoComplete="new-password"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-name-new">Nombre (opcional)</Label>
                <input
                  id="register-name-new"
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="off"
                />
              </div>
              
              <Button type="submit" disabled={registerLoading} className="w-full">
                {registerLoading ? 'Registrando...' : 'Registrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Formulario de inicio de sesión */}
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email-new">Correo electrónico</Label>
                <input
                  id="login-email-new"
                  type="email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  autoComplete="off"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password-new">Contraseña</Label>
                <input
                  id="login-password-new"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  required
                />
              </div>
              
              <Button type="submit" disabled={loginLoading} className="w-full">
                {loginLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Lista de usuarios */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Usuarios Registrados</span>
            <Button onClick={fetchUsers} variant="outline" size="sm">Actualizar lista</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b">ID</th>
                  <th className="text-left p-2 border-b">Email</th>
                  <th className="text-left p-2 border-b">Nombre</th>
                  <th className="text-left p-2 border-b">Verificado</th>
                  <th className="text-left p-2 border-b">Creado</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-4">
                      No hay usuarios registrados o haz clic en "Actualizar lista"
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}>
                      <td className="p-2 border-b">{user.id}</td>
                      <td className="p-2 border-b">{user.email}</td>
                      <td className="p-2 border-b">{user.name || '-'}</td>
                      <td className="p-2 border-b">{user.verified ? 'Sí' : 'No'}</td>
                      <td className="p-2 border-b">{new Date(user.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestApiPageNew;