import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
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
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const navigate = useNavigate();

  // Simulate checking for existing auth state on mount
  useEffect(() => {
    const authState = localStorage.getItem('vive-medellin-auth');
    if (authState === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('vive-medellin-auth', 'true');
    
    toast({
      title: "¡Bienvenido a ViveMedellín!",
      description: "Has iniciado sesión correctamente.",
    });

    // Redirect to pending path or home
    const redirectPath = pendingRedirect || '/';
    setPendingRedirect(null);
    navigate(redirectPath);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('vive-medellin-auth');
    
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
    });
    
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        pendingRedirect,
        setPendingRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};