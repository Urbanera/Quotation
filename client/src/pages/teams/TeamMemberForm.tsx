import { useMutation, useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { teamMemberFormSchema, User } from '@shared/schema';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Type for user without password
type UserWithoutPassword = Omit<User, 'password'>;

interface TeamMemberFormProps {
  teamId: number;
  existingMemberIds: number[];
  onSubmitSuccess: () => void;
}

export default function TeamMemberForm({ 
  teamId, 
  existingMemberIds,
  onSubmitSuccess 
}: TeamMemberFormProps) {
  const { toast } = useToast();

  // Load all users for selection
  const { data: users, isLoading: isLoadingUsers } = useQuery<UserWithoutPassword[]>({
    queryKey: ['/api/users'],
  });

  // Filter out users that are already members of the team
  const availableUsers = users?.filter(user => !existingMemberIds.includes(user.id)) || [];

  // Define form
  const form = useForm<z.infer<typeof teamMemberFormSchema>>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      userId: 0,
    },
  });

  // Create the mutation for handling form submission
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof teamMemberFormSchema>) => {
      return await apiRequest('POST', `/api/teams/${teamId}/members`, values);
    },
    onSuccess: () => {
      toast({
        title: 'Member added to team',
        description: 'The user has been added to the team successfully.',
      });
      onSubmitSuccess();
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId, 'members'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add member to team: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof teamMemberFormSchema>) {
    mutation.mutate(values);
  }

  if (isLoadingUsers) {
    return <div className="text-center py-4">Loading users...</div>;
  }

  if (availableUsers.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="mb-2">All users are already members of this team.</p>
        <p className="text-muted-foreground">Create new users first to add them to this team.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select User</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))} 
                defaultValue={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user to add" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.fullName} ({user.username}) - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose from available users that aren't already in this team
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding...' : 'Add to Team'}
          </Button>
        </div>
      </form>
    </Form>
  );
}