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
      const targetPath = `${location.pathname}${location.search}${location.hash}` || '/';
      setPendingRedirect(targetPath);
    }
  }, [isAuthenticated, location.hash, location.pathname, location.search, setPendingRedirect]);

  if (!isAuthenticated) {
    const targetPath = `${location.pathname}${location.search}${location.hash}` || '/';
    const search = new URLSearchParams({ from: targetPath }).toString();
    return <Navigate to={{ pathname: '/login', search: `?${search}` }} replace />;
  }

  return <>{children}</>;
};
