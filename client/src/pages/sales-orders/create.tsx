import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Quotation, Customer } from "@shared/schema";

export default function CreateSalesOrder() {
  const [, navigate] = useLocation();
  const params = useParams<{ quotationId: string }>();
  const quotationId = params.quotationId ? parseInt(params.quotationId) : undefined;
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [newOrderId, setNewOrderId] = useState<number | null>(null);

  // Fetch quotation data
  const { data: quotation, isLoading: quotationLoading } = useQuery<Quotation>({
    queryKey: [`/api/quotations/${quotationId}`],
    enabled: !!quotationId,
    onError: () => {
      setError("Failed to load quotation data. The quotation may not exist.");
    }
  });

  // Fetch customer data if we have a quotation
  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: [`/api/customers/${quotation?.customerId}`],
    enabled: !!quotation?.customerId,
    onError: () => {
      setError("Failed to load customer data.");
    }
  });

  // Mutation to convert quotation to sales order
  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!quotationId) throw new Error("Quotation ID is required");
      const res = await apiRequest("POST", `/api/quotations/${quotationId}/convert-to-order`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      setCreated(true);
      setNewOrderId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      toast({
        title: "Sales order created successfully",
        description: `Sales order #${data.id} has been created.`,
      });
      // Navigate after a brief delay to show success message
      setTimeout(() => {
        navigate(`/sales-orders/view/${data.id}`);
      }, 1500);
    },
    onError: (error: Error) => {
      setError(error.message || "Failed to create sales order.");
      toast({
        title: "Error",
        description: error.message || "Failed to create sales order.",
        variant: "destructive",
      });
    }
  });

  const handleCreateSalesOrder = async () => {
    setIsCreating(true);
    setError(null);
    try {
      await convertMutation.mutateAsync();
    } catch (err) {
      // Error will be handled by mutation's onError
    } finally {
      setIsCreating(false);
    }
  };

  const isLoading = quotationLoading || customerLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Loading quotation information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>
              An error occurred while trying to create the sales order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => navigate("/quotations")}>Back to Quotations</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Quotation Not Found</CardTitle>
            <CardDescription>
              The quotation you're trying to convert doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/quotations")}>Back to Quotations</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quotation.status !== "approved") {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Quotation Not Approved</CardTitle>
            <CardDescription>
              This quotation must be approved before converting to a sales order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Current status: <span className="font-semibold">{quotation.status || "draft"}</span>
            </p>
            <Button onClick={() => navigate(`/quotations/view/${quotationId}`)}>View Quotation</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            {created 
              ? "Sales Order Created Successfully" 
              : "Convert Quotation to Sales Order"}
          </CardTitle>
          <CardDescription>
            {created 
              ? `Sales order #${newOrderId} has been created from quotation #${quotation.id}` 
              : `Create a new sales order from quotation #${quotation.id}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {created ? (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <p className="text-xl font-semibold mb-6">Sales Order Created Successfully!</p>
              <Button onClick={() => navigate(`/sales-orders/view/${newOrderId}`)}>
                View Sales Order
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quotation Information</h3>
                  <p><span className="font-medium">Quotation #:</span> {quotation.id}</p>
                  <p><span className="font-medium">Status:</span> {quotation.status || "N/A"}</p>
                  <p><span className="font-medium">Date:</span> {new Date(quotation.createdAt).toLocaleDateString()}</p>
                  <p><span className="font-medium">Total Amount:</span> ₹{quotation.finalPrice?.toLocaleString('en-IN') || "0"}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                  <p><span className="font-medium">Name:</span> {customer?.name || "N/A"}</p>
                  <p><span className="font-medium">Email:</span> {customer?.email || "N/A"}</p>
                  <p><span className="font-medium">Phone:</span> {customer?.phone || "N/A"}</p>
                  <p><span className="font-medium">Address:</span> {customer?.address || "N/A"}</p>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <p className="mb-6">
                  Creating a sales order will mark this quotation as converted and initiate the order fulfillment process.
                </p>
                <div className="flex space-x-4">
                  <Button 
                    onClick={() => navigate(`/quotations/view/${quotationId}`)} 
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateSalesOrder} 
                    disabled={isCreating}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : "Create Sales Order"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}