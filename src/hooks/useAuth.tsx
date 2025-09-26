/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import * as api from '@/lib/api';

interface UserCredentials {
  email: string;
  password: string;
  name?: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  verified: boolean;
  createdAt: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: UserCredentials, rememberMe?: boolean) => Promise<boolean>;
  register: (credentials: UserCredentials) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  pendingRedirect: string | null;
  setPendingRedirect: (path: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const navigate = useNavigate();

  // Verificación de sesión al montar el componente
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.checkAuth();
        
        if (response.success && response.data) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        localStorage.removeItem('vive-medellin-user');
        sessionStorage.removeItem('vive-medellin-user');
        localStorage.removeItem('vive-medellin-auth-token');
        sessionStorage.removeItem('vive-medellin-auth-token');
      }
    };
    
    checkAuthStatus();
  }, []);

  // La base de datos de usuarios ahora está gestionada por el API simulado
  useEffect(() => {
    // Aseguramos que los datos de ejemplo estén inicializados
    api.initializeMockData();
  }, []);

  const login = async (credentials: UserCredentials, rememberMe = false): Promise<boolean> => {
    try {
      const response = await api.login({
        email: credentials.email,
        password: credentials.password
      });
      
      if (response.success && response.data) {
        setIsAuthenticated(true);
        setUser(response.data.user);
        
        // Guardar el token y los datos del usuario
        const userData = JSON.stringify(response.data.user);
        const token = response.data.token;
        
        // Si seleccionó 'recordarme', almacenamos en localStorage para persistencia
        // De lo contrario, usamos sessionStorage que se borra al cerrar el navegador
        if (rememberMe) {
          localStorage.setItem('vive-medellin-user', userData);
          localStorage.setItem('vive-medellin-auth-token', token);
        } else {
          sessionStorage.setItem('vive-medellin-user', userData);
          sessionStorage.setItem('vive-medellin-auth-token', token);
        }
        
        toast({
          title: "¡Bienvenido a ViveMedellín!",
          description: "Has iniciado sesión correctamente.",
        });

        // Redirect to pending path or home
        const redirectPath = pendingRedirect || '/';
        setPendingRedirect(null);
        
        // Pequeña pausa para permitir que el toast se muestre correctamente
        setTimeout(() => {
          navigate(redirectPath);
        }, 300);
        
        return true;
      } else {
        toast({
          title: "Error de inicio de sesión",
          description: response.error || "Correo o contraseña incorrectos.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error en inicio de sesión:", error);
      toast({
        title: "Error de inicio de sesión",
        description: "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (credentials: UserCredentials): Promise<boolean> => {
    try {
      const response = await api.register({
        email: credentials.email,
        password: credentials.password,
        name: credentials.name
      });
      
      if (response.success) {
        toast({
          title: "¡Registro exitoso!",
          description: "Se ha enviado un correo de verificación a tu dirección de correo electrónico.",
        });
        return true;
      } else {
        toast({
          title: "Error de registro",
          description: response.error || "No se pudo completar el registro.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error en registro:", error);
      toast({
        title: "Error de registro",
        description: "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      
      setIsAuthenticated(false);
      setUser(null);
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
      
      navigate('/');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      
      // Incluso si hay error, cerramos la sesión localmente
      setIsAuthenticated(false);
      setUser(null);
      navigate('/');
    }
  };
  
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await api.requestPasswordReset(email);
      
      // Siempre mostramos un mensaje de éxito por razones de seguridad
      // (no queremos revelar qué correos están registrados)
      toast({
        title: "Correo enviado",
        description: "Si existe una cuenta con ese correo, recibirás instrucciones para restablecer tu contraseña.",
      });
      
      return true;
    } catch (error) {
      console.error("Error al solicitar restablecimiento de contraseña:", error);
      
      toast({
        title: "Error",
        description: "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        register,
        resetPassword,
        logout,
        pendingRedirect,
        setPendingRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
