import React from 'react';
import { useAuth } from '@/src/lib/auth';
import { hasPermission, PERMISSIONS } from '@/src/lib/permissions';

interface PermissionGateProps {
  permission: keyof typeof PERMISSIONS;
  children: React.ReactNode;
}

export function PermissionGate({ permission, children }: PermissionGateProps) {
  const { user } = useAuth();

  if (!user || !hasPermission(user, permission)) {
    return null;
  }

  return <>{children}</>;
}
