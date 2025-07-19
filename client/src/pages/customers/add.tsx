import { useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import CustomerForm from "@/components/customers/CustomerForm";
import { customerFormSchema } from "@shared/schema";

export default function AddCustomer() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const createCustomerMutation = useMutation({
    mutationFn: async (data: typeof customerFormSchema._type) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: (customerData) => {
      // Immediately invalidate and refetch customers
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.refetchQueries({ queryKey: ["/api/customers"] });
      
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      
      // Navigate to customer list to show the new customer
      navigate("/customers");
      
      // Show follow-up reminder toast after a short delay
      setTimeout(() => {
        toast({
          title: "Reminder",
          description: "Don't forget to create a follow-up for this customer",
          variant: "destructive",
          duration: 6000,
        });
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = useCallback((data: typeof customerFormSchema._type) => {
    createCustomerMutation.mutate(data);
  }, [createCustomerMutation]);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/customers")}
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">Add New Customer</h1>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <CustomerForm onSubmit={onSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}
