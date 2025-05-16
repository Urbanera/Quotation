import { useCallback } from "react";
import { useLocation } from "wouter";
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

  const onSubmit = useCallback(async (data: typeof customerFormSchema._type) => {
    try {
      const response = await apiRequest("POST", "/api/customers", data);
      
      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create customer");
      }
      
      // Get the created customer data
      const customerData = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      // Display success toast
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      
      // Redirect to the customer detail page with the proper URL
      navigate(`/customers/view/${customerData.id}`);
      
      // Show follow-up reminder toast after a short delay
      setTimeout(() => {
        toast({
          title: "Reminder",
          description: "Don't forget to create a follow-up for this customer",
          variant: "destructive",
          duration: 6000, // Show for 6 seconds
        });
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    }
  }, [navigate, toast]);

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
