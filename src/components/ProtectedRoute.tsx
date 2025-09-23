import React, { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, setPendingRedirect } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingRedirect(location.pathname + location.search);
    }
  }, [isAuthenticated, location.pathname, location.search, setPendingRedirect]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};