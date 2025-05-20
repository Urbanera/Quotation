import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Room } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define schema for room form
const roomFormSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  description: z.string().optional(),
});

interface RoomFormProps {
  onSubmit: (data: z.infer<typeof roomFormSchema>) => void;
  isSubmitting: boolean;
  defaultValues?: Room;
  isEdit?: boolean;
  error?: string;
}

export default function RoomForm({ 
  onSubmit, 
  isSubmitting, 
  defaultValues,
  isEdit = false,
  error
}: RoomFormProps) {
  const [formError, setFormError] = useState<string | null>(error || null);
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof roomFormSchema>>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
    },
  });
  
  // Clear error when form values change
  const handleFormSubmit = (data: z.infer<typeof roomFormSchema>) => {
    setFormError(null);
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g. Kitchen, Master Bedroom" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    setFormError(null);
                  }}
                />
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
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter room description" 
                  className="resize-none min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update Room' : 'Add Room'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
