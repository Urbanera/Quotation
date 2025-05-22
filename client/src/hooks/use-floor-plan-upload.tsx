import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useFloorPlanUpload() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const floorPlanMutation = useMutation({
    mutationFn: async ({ customerId, file }: { customerId: number; file: File }) => {
      const formData = new FormData();
      formData.append('floorPlan', file);

      const response = await fetch(`/api/customers/${customerId}/floor-plan`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload floor plan');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate the customer query
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${data.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      
      toast({
        title: "Floor plan uploaded",
        description: "Floor plan has been successfully uploaded",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading the floor plan",
        variant: "destructive",
      });
    },
  });

  return floorPlanMutation;
}