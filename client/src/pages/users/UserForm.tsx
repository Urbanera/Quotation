import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { User, userFormSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Password validation schema (only required for new users)
const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Type for form without the password
type UserWithoutPassword = Omit<User, 'password'>;

interface UserFormProps {
  defaultValues?: UserWithoutPassword;
  isEdit?: boolean;
  onSubmitSuccess: () => void;
}

export default function UserForm({ defaultValues, isEdit = false, onSubmitSuccess }: UserFormProps) {
  const { toast } = useToast();

  // Create the form schema based on whether it's an edit form or not
  const formSchema = isEdit 
    ? userFormSchema.extend({
        password: z.string().min(8, "Password must be at least 8 characters long").optional(),
        confirmPassword: z.string().optional()
      }).refine(
        (data) => !data.password || (data.password === data.confirmPassword), 
        {
          message: "Passwords do not match",
          path: ["confirmPassword"],
        }
      )
    : userFormSchema.extend({
        password: z.string().min(8, "Password must be at least 8 characters long"),
        confirmPassword: z.string()
      }).refine(
        (data) => data.password === data.confirmPassword, 
        {
          message: "Passwords do not match",
          path: ["confirmPassword"],
        }
      );

  // Define form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit 
      ? { 
          ...defaultValues,
          password: '',
          confirmPassword: '',
        } 
      : {
          username: '',
          email: '',
          fullName: '',
          password: '',
          confirmPassword: '',
          role: 'viewer',
          active: true,
        },
  });

  // Create the mutation for handling the form submission
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Remove confirmPassword as it's not needed in the API
      const { confirmPassword, ...userData } = values;
      
      // If editing and no password provided, remove the password field
      if (isEdit && !userData.password) {
        delete userData.password;
      }
      
      if (isEdit && defaultValues) {
        return await apiRequest('PUT', `/api/users/${defaultValues.id}`, userData);
      } else {
        return await apiRequest('POST', '/api/users', userData);
      }
    },
    onSuccess: () => {
      toast({
        title: `User ${isEdit ? 'updated' : 'created'} successfully`,
        description: isEdit 
          ? "The user has been updated." 
          : "The user has been created and can now log in.",
      });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        title: `Failed to ${isEdit ? 'update' : 'create'} user`,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
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
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="johndoe" {...field} />
                </FormControl>
                <FormDescription>
                  Used for logging into the system
                </FormDescription>
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
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="designer">Designer</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Determines access permissions
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isEdit ? "New Password (optional)" : "Password"}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormDescription>
                  {isEdit ? "Leave blank to keep current password" : "Minimum 8 characters"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Inactive users cannot log into the system
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

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? `${isEdit ? 'Updating' : 'Creating'}...`
              : isEdit
              ? 'Update User'
              : 'Create User'}
          </Button>
        </div>
      </form>
    </Form>
  );
}