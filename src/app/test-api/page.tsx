"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import * as api from "@/lib/api";
import type { User } from "@/lib/api";

export default function TestApiPage() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifying, setVerifying] = useState(false);

  const fetchUsers = useCallback(() => {
    if (typeof window === "undefined") {
      setUsers([]);
      return;
    }

    const storedUsers = window.localStorage.getItem("vive-medellin-users");
    if (!storedUsers) {
      setUsers([]);
      return;
    }

    try {
      const parsed = JSON.parse(storedUsers) as User[];
      setUsers(parsed);
    } catch (error) {
      console.error("No se pudo parsear la lista de usuarios", error);
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    api.initializeMockData();
    fetchUsers();
  }, [fetchUsers]);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (!registerEmail || !registerPassword) {
        toast({
          title: "Error",
          description: "El correo y la contraseña son obligatorios",
          variant: "destructive",
        });
        return;
      }

      const response = await api.register({
        email: registerEmail,
        password: registerPassword,
        name: registerName,
      });

      if (!response.success) {
        toast({
          title: "Error de registro",
          description: response.error || "No se pudo completar el registro.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "¡Registro exitoso!",
        description: "Se ha enviado un correo de verificación al email registrado.",
      });

      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterName("");

      if (typeof window !== "undefined") {
        const stored = JSON.parse(window.localStorage.getItem("vive-medellin-users") || "[]") as User[];
        const newUser = stored.find((user) => user.email === registerEmail);
        if (newUser?.verificationToken) {
          console.log(`Token de verificación para ${registerEmail}: ${newUser.verificationToken}`);
          await api.verifyEmail(registerEmail, newUser.verificationToken);
          toast({
            title: "Correo verificado",
            description: "El correo se verificó automáticamente para la demo.",
          });
        }
      }

      fetchUsers();
    } catch (error) {
      console.error("Error en el registro", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (!loginEmail || !loginPassword) {
        toast({
          title: "Error",
          description: "El correo y la contraseña son obligatorios",
          variant: "destructive",
        });
        return;
      }

      const response = await api.login({
        email: loginEmail,
        password: loginPassword,
      });

      if (response.success && response.data) {
        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido ${response.data.user.name || response.data.user.email}`,
        });
        setLoginEmail("");
        setLoginPassword("");
      } else {
        toast({
          title: "Error de inicio de sesión",
          description: response.error || "Credenciales incorrectas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al iniciar sesión", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualVerify = async (email: string) => {
    if (!email) {
      return;
    }

    setVerifying(true);
    try {
      const result = await api.verifyUserManually(email);
      if (result.success) {
        toast({
          title: "Usuario verificado",
          description: `El usuario ${email} ha sido verificado correctamente`,
        });
        fetchUsers();
        setVerifyEmail("");
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo verificar el usuario",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verificando usuario", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al verificar el usuario",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Demo de API (usuarios mock)</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registrar usuario</CardTitle>
            <CardDescription>Crea cuentas de prueba sobre el almacenamiento local.</CardDescription>
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
                  onChange={(event) => setRegisterEmail(event.target.value)}
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
                  onChange={(event) => setRegisterPassword(event.target.value)}
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
                  onChange={(event) => setRegisterName(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Prueba las credenciales guardadas en el mock.</CardDescription>
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
                  onChange={(event) => setLoginEmail(event.target.value)}
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
                  onChange={(event) => setLoginPassword(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verificación manual</CardTitle>
          <CardDescription>Marca un correo como verificado para poder iniciar sesión.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Correo a verificar"
              value={verifyEmail}
              onChange={(event) => setVerifyEmail(event.target.value)}
            />
            <Button onClick={() => handleManualVerify(verifyEmail)} disabled={verifying || !verifyEmail}>
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verificar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios registrados</CardTitle>
          <CardDescription>Datos almacenados en localStorage (solo para la demo).</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3">Email</th>
                    <th className="text-left py-2 px-3">Nombre</th>
                    <th className="text-left py-2 px-3">Verificado</th>
                    <th className="text-left py-2 px-3">Registro</th>
                    <th className="text-left py-2 px-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-none">
                      <td className="py-2 px-3">{user.email}</td>
                      <td className="py-2 px-3">{user.name || "-"}</td>
                      <td className="py-2 px-3">{user.verified ? "Sí" : "No"}</td>
                      <td className="py-2 px-3">{new Date(user.createdAt).toLocaleString()}</td>
                      <td className="py-2 px-3">
                        {!user.verified ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManualVerify(user.email)}
                          >
                            Verificar
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">Verificado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay usuarios registrados todavía.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={fetchUsers}>
            Actualizar lista
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

