import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { teamMemberFormSchema } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';

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
  const [availableUsers, setAvailableUsers] = useState<UserWithoutPassword[]>([]);

  const { data: users, isLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: ['/api/users'],
  });
  
  useEffect(() => {
    if (users) {
      // Filter out users that are already team members
      const filteredUsers = users.filter(user => 
        !existingMemberIds.includes(user.id)
      );
      setAvailableUsers(filteredUsers);
    }
  }, [users, existingMemberIds]);

  const form = useForm<z.infer<typeof teamMemberFormSchema>>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      teamId,
      userId: 0,
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (values: z.infer<typeof teamMemberFormSchema>) => {
      const response = await apiRequest('POST', `/api/teams/${teamId}/members`, values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Team member added',
        description: 'The member has been added to the team successfully.',
      });
      form.reset({ teamId, userId: 0 });
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/members`] });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add team member: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: z.infer<typeof teamMemberFormSchema>) {
    addMemberMutation.mutate(values);
  }

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (availableUsers.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mt-4">
        <p>All available users are already members of this team.</p>
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
              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user to add" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.fullName} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          disabled={addMemberMutation.isPending}
        >
          Add Member to Team
        </Button>
      </form>
    </Form>
  );
}