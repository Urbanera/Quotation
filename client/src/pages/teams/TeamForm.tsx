import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Team, teamFormSchema } from '@shared/schema';
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
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TeamFormProps {
  defaultValues?: Team;
  isEdit?: boolean;
  onSubmitSuccess: () => void;
}

export default function TeamForm({ defaultValues, isEdit = false, onSubmitSuccess }: TeamFormProps) {
  const { toast } = useToast();

  // Define form with default values
  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: isEdit 
      ? defaultValues
      : {
          name: '',
          description: '',
        },
  });

  // Create the mutation for handling the form submission
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof teamFormSchema>) => {
      if (isEdit && defaultValues) {
        return await apiRequest('PUT', `/api/teams/${defaultValues.id}`, values);
      } else {
        return await apiRequest('POST', '/api/teams', values);
      }
    },
    onSuccess: () => {
      toast({
        title: `Team ${isEdit ? 'updated' : 'created'} successfully`,
        description: isEdit 
          ? "The team has been updated." 
          : "The team has been created. You can now add members to it.",
      });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast({
        title: `Failed to ${isEdit ? 'update' : 'create'} team`,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof teamFormSchema>) {
    mutation.mutate(values);
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
                <Input placeholder="Design Team" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for the team
              </FormDescription>
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
                  placeholder="Team responsibilities and purpose..." 
                  {...field} 
                  value={field.value || ''} // Handle null value
                />
              </FormControl>
              <FormDescription>
                Optional description of the team's purpose and responsibilities
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? `${isEdit ? 'Updating' : 'Creating'}...`
              : isEdit
              ? 'Update Team'
              : 'Create Team'}
          </Button>
        </div>
      </form>
    </Form>
  );
}