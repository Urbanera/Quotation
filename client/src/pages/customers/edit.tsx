import { useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import CustomerForm from "@/components/customers/CustomerForm";
import { Customer, customerFormSchema } from "@shared/schema";

export default function EditCustomer() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: customer, isLoading, error } = useQuery<Customer>({
    queryKey: [`/api/customers/${id}`],
    enabled: !!id,
  });

  const onSubmit = useCallback(async (data: typeof customerFormSchema._type) => {
    if (!id) return;
    
    try {
      const response = await apiRequest("PUT", `/api/customers/${id}`, data);
      
      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update customer");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${id}`] });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      navigate("/customers");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    }
  }, [id, navigate, toast]);

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading customer data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center py-8">
            <p className="text-red-500">Error loading customer data. Please try again.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/customers")}
              className="mt-4"
            >
              Back to Customers
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-semibold text-gray-900">Edit Customer</h1>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <CustomerForm 
              onSubmit={onSubmit} 
              defaultValues={customer} 
              isEdit 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
