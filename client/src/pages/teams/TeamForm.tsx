import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { teamFormSchema } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface TeamFormProps {
  defaultValues?: {
    id?: number;
    name: string;
    description?: string;
  };
  isEdit?: boolean;
  onSubmitSuccess: () => void;
}

export default function TeamForm({ defaultValues, isEdit = false, onSubmitSuccess }: TeamFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (values: z.infer<typeof teamFormSchema>) => {
      const response = await apiRequest('POST', '/api/teams', values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Team created',
        description: 'The team has been created successfully.',
      });
      form.reset();
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create team: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (values: z.infer<typeof teamFormSchema>) => {
      if (!defaultValues?.id) return null;
      
      const response = await apiRequest('PUT', `/api/teams/${defaultValues.id}`, values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Team updated',
        description: 'The team has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update team: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: z.infer<typeof teamFormSchema>) {
    if (isEdit) {
      updateTeamMutation.mutate(values);
    } else {
      createTeamMutation.mutate(values);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter a brief description of this team's purpose"
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          disabled={createTeamMutation.isPending || updateTeamMutation.isPending}
        >
          {isEdit ? 'Update Team' : 'Create Team'}
        </Button>
      </form>
    </Form>
  );
}