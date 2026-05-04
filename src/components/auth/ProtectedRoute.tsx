import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/src/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  console.log('[v0] ProtectedRoute check:', { user: user?.id, isLoading, requiredRoles });

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
          <p className="mt-4 text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    console.log('[v0] User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check role permissions if required
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    console.log('[v0] User role not authorized:', { userRole: user.role, requiredRoles });
    return (
      <Navigate to="/login" replace />
    );
  }

  return <>{children}</>;
}
