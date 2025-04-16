import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
}

export default function RoomForm({ 
  onSubmit, 
  isSubmitting, 
  defaultValues,
  isEdit = false 
}: RoomFormProps) {
  // Initialize form with default values
  const form = useForm<z.infer<typeof roomFormSchema>>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Kitchen, Master Bedroom" {...field} />
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
