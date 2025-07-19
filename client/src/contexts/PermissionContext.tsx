import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";

interface UserPermission {
  id: number;
  role: 'admin' | 'manager' | 'designer' | 'viewer';
  module: 'customers' | 'quotations' | 'sales_orders' | 'invoices' | 'payments' | 'reports' | 'settings' | 'users';
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface PermissionContextType {
  permissions: UserPermission[];
  hasPermission: (module: string, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
  canAccessModule: (module: string) => boolean;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

interface PermissionProviderProps {
  children: ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);

  const { data: userPermissions, isLoading } = useQuery({
    queryKey: ['/api/user-permissions'],
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (userPermissions && user) {
      // Admin has full access to everything
      if (user.role === 'admin') {
        const adminPermissions: UserPermission[] = [
          'customers', 'quotations', 'sales_orders', 'invoices', 'payments', 'reports', 'settings', 'users'
        ].map(module => ({
          id: 0,
          role: 'admin' as const,
          module: module as any,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        }));
        setPermissions(adminPermissions);
      } else {
        // Filter permissions for the current user's role
        const rolePermissions = userPermissions.filter((perm: UserPermission) => perm.role === user.role);
        setPermissions(rolePermissions);
      }
    }
  }, [userPermissions, user]);

  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    const permission = permissions.find(p => p.module === module);
    if (!permission) return false;
    
    switch (action) {
      case 'view': return permission.canView;
      case 'create': return permission.canCreate;
      case 'edit': return permission.canEdit;
      case 'delete': return permission.canDelete;
      default: return false;
    }
  };

  const canAccessModule = (module: string): boolean => {
    return hasPermission(module, 'view');
  };

  const value = {
    permissions,
    hasPermission,
    canAccessModule,
    isLoading: isLoading && !!user,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}