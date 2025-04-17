import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import { userFormSchema } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface UserFormProps {
  defaultValues?: {
    id?: number;
    username: string;
    password?: string;
    fullName: string;
    email: string;
    role: 'admin' | 'manager' | 'designer' | 'viewer';
    active?: boolean;
  };
  isEdit?: boolean;
  onSubmitSuccess: () => void;
}

export default function UserForm({ defaultValues, isEdit = false, onSubmitSuccess }: UserFormProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(!isEdit);

  // Add password requirement for new users
  const formSchema = isEdit
    ? userFormSchema.extend({
        password: z.string().optional(),
      })
    : userFormSchema.extend({
        password: z.string().min(6, 'Password must be at least 6 characters'),
      });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: defaultValues?.username || '',
      password: '',
      fullName: defaultValues?.fullName || '',
      email: defaultValues?.email || '',
      role: defaultValues?.role || 'designer',
      active: defaultValues?.active !== undefined ? defaultValues.active : true,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest('POST', '/api/users', values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'User created',
        description: 'The user has been created successfully.',
      });
      form.reset();
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create user: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!defaultValues?.id) return null;
      
      // If password is empty, don't send it (keep the existing one)
      const dataToSend = values.password ? values : {
        username: values.username,
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        active: values.active,
      };
      
      const response = await apiRequest('PUT', `/api/users/${defaultValues.id}`, dataToSend);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'User updated',
        description: 'The user has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update user: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEdit) {
      updateUserMutation.mutate(values);
    } else {
      createUserMutation.mutate(values);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {(showPassword || !isEdit) && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Password</FormLabel>
                  {isEdit && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs"
                    >
                      {showPassword ? 'Cancel' : 'Change Password'}
                    </Button>
                  )}
                </div>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                {isEdit && showPassword && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank to keep the current password
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Disable to revoke user access without deleting the account
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          disabled={createUserMutation.isPending || updateUserMutation.isPending}
        >
          {isEdit ? 'Update User' : 'Create User'}
        </Button>
      </form>
    </Form>
  );
}