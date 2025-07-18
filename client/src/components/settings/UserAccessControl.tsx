import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Save, Users, Shield, UserCheck } from 'lucide-react';

interface UserPermission {
  id: number;
  role: 'admin' | 'manager' | 'designer' | 'viewer';
  module: 'customers' | 'quotations' | 'sales_orders' | 'invoices' | 'payments' | 'reports' | 'settings' | 'users';
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PermissionSettings {
  [key: string]: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

interface RolePermissions {
  manager: PermissionSettings;
  designer: PermissionSettings;
}

export default function UserAccessControl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [permissions, setPermissions] = useState<RolePermissions>({
    manager: {},
    designer: {}
  });

  const modules = [
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'quotations', name: 'Quotations', icon: Shield },
    { id: 'sales_orders', name: 'Sales Orders', icon: UserCheck },
    { id: 'invoices', name: 'Invoices', icon: Shield },
    { id: 'payments', name: 'Payments', icon: Shield },
    { id: 'reports', name: 'Reports', icon: Shield },
    { id: 'settings', name: 'Settings', icon: Shield },
    { id: 'users', name: 'Users', icon: Users }
  ];

  const { data: allPermissions, isLoading } = useQuery({
    queryKey: ['/api/user-permissions'],
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { permissions: Array<{role: string, module: string, permissions: PermissionSettings[string]}> }) => {
      return await apiRequest('/api/user-permissions/bulk-update', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User permissions updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user-permissions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (allPermissions) {
      const rolePermissions: RolePermissions = {
        manager: {},
        designer: {}
      };

      // Initialize with default permissions for all modules
      modules.forEach(module => {
        rolePermissions.manager[module.id] = {
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false
        };
        rolePermissions.designer[module.id] = {
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false
        };
      });

      // Update with existing permissions
      allPermissions.forEach((perm: UserPermission) => {
        if (perm.role === 'manager' || perm.role === 'designer') {
          rolePermissions[perm.role][perm.module] = {
            canView: perm.canView,
            canCreate: perm.canCreate,
            canEdit: perm.canEdit,
            canDelete: perm.canDelete
          };
        }
      });

      setPermissions(rolePermissions);
    }
  }, [allPermissions]);

  const handlePermissionChange = (
    role: 'manager' | 'designer',
    module: string,
    permission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete',
    checked: boolean
  ) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [module]: {
          ...prev[role][module],
          [permission]: checked
        }
      }
    }));
  };

  const handleSavePermissions = () => {
    const permissionsArray = [];
    
    ['manager', 'designer'].forEach(role => {
      modules.forEach(module => {
        permissionsArray.push({
          role,
          module: module.id,
          permissions: permissions[role as keyof RolePermissions][module.id] || {
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false
          }
        });
      });
    });

    saveMutation.mutate({ permissions: permissionsArray });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Access Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          User Access Control
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure what each user role can access in the system. Admin has full access to all modules.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Module</th>
                <th className="text-center p-4 font-medium">Manager</th>
                <th className="text-center p-4 font-medium">Designer</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <tr key={module.id} className="border-b">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{module.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`manager-${module.id}-view`}
                            checked={permissions.manager[module.id]?.canView || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('manager', module.id, 'canView', checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`manager-${module.id}-view`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            View
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`manager-${module.id}-create`}
                            checked={permissions.manager[module.id]?.canCreate || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('manager', module.id, 'canCreate', checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`manager-${module.id}-create`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Create
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`manager-${module.id}-edit`}
                            checked={permissions.manager[module.id]?.canEdit || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('manager', module.id, 'canEdit', checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`manager-${module.id}-edit`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Edit
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`manager-${module.id}-delete`}
                            checked={permissions.manager[module.id]?.canDelete || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('manager', module.id, 'canDelete', checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`manager-${module.id}-delete`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Delete
                          </label>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`designer-${module.id}-view`}
                            checked={permissions.designer[module.id]?.canView || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('designer', module.id, 'canView', checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`designer-${module.id}-view`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            View
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`designer-${module.id}-create`}
                            checked={permissions.designer[module.id]?.canCreate || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('designer', module.id, 'canCreate', checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`designer-${module.id}-create`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Create
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`designer-${module.id}-edit`}
                            checked={permissions.designer[module.id]?.canEdit || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('designer', module.id, 'canEdit', checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`designer-${module.id}-edit`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Edit
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`designer-${module.id}-delete`}
                            checked={permissions.designer[module.id]?.canDelete || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('designer', module.id, 'canDelete', checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`designer-${module.id}-delete`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Delete
                          </label>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSavePermissions}
            disabled={saveMutation.isPending}
            className="gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Permissions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}