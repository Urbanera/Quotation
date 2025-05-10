import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft, Eye, Save, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Customer, QuotationWithDetails } from "@shared/schema";
import ClientInfo from "@/components/quotations/ClientInfo";
import RoomTabs from "@/components/quotations/RoomTabs";
import QuotationSummary from "@/components/quotations/QuotationSummary";
import { ValidationDialog } from "@/components/quotations/ValidationDialog";
import { validateQuotation, markQuotationAsSaved, ValidationError, ValidationWarning } from "@/lib/quotationValidation";

export default function EditQuotation() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [installationHandling, setInstallationHandling] = useState<number>(0);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [gstPercentage, setGstPercentage] = useState<number>(18);
  
  // States for validation dialog
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);

  // Fetch quotation details
  const { data: quotation, isLoading: quotationLoading } = useQuery<QuotationWithDetails>({
    queryKey: [`/api/quotations/${id}`],
    enabled: !!id,
  });

  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Initialize form with quotation data when loaded
  useEffect(() => {
    if (quotation) {
      setSelectedCustomerId(quotation.customerId);
      setInstallationHandling(quotation.installationHandling);
      setGlobalDiscount(quotation.globalDiscount || 0);
      setGstPercentage(quotation.gstPercentage);
    }
  }, [quotation]);

  // Save quotation (as draft)
  const handleSaveQuotation = useCallback(async () => {
    if (!id || !selectedCustomerId) return;

    try {
      await apiRequest("PUT", `/api/quotations/${id}`, {
        customerId: selectedCustomerId,
        installationHandling,
        globalDiscount,
        gstPercentage
      });
      
      toast({
        title: "Success",
        description: "Draft quotation updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${id}/details`] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quotation",
        variant: "destructive",
      });
    }
  }, [id, selectedCustomerId, installationHandling, globalDiscount, gstPercentage, toast]);
  
  // Start validation process for saving quotation as final (saved status)
  const handleValidateForFinalSave = useCallback(async () => {
    if (!id) return;
    
    try {
      // First save any current changes as draft
      await handleSaveQuotation();
      
      // Run validation
      const validationResult = await validateQuotation(parseInt(id));
      
      setValidationErrors(validationResult.errors);
      setValidationWarnings(validationResult.warnings);
      
      // Show dialog with errors or warnings
      setIsValidationDialogOpen(true);
      
    } catch (error) {
      console.error("Validation failed:", error);
      toast({
        title: "Error",
        description: "Failed to validate quotation. Please try again.",
        variant: "destructive"
      });
    }
  }, [id, handleSaveQuotation, toast]);

  // Mutation to save quotation as final
  const saveAsFinalMutation = useMutation({
    mutationFn: async () => {
      const quotationId = parseInt(id as string);
      return await markQuotationAsSaved(quotationId);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation has been saved as final and can now be approved."
      });
      
      // Close the dialog
      setIsValidationDialogOpen(false);
      
      // Navigate to view page
      navigate(`/quotations/view/${id}`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${id}/details`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
    },
    onError: (error: any) => {
      // Handle validation errors specially
      if (error.response && error.response.data && error.response.data.errorType === "validation") {
        setValidationErrors(error.response.data.validationErrors || []);
        setIsValidationDialogOpen(true);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to save quotation as final. Please fix any issues and try again.",
        variant: "destructive"
      });
    }
  });

  if (quotationLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading quotation data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quotation && !quotationLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center py-8">
            <p className="text-red-500">Quotation not found. Please check the URL and try again.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/quotations")}
              className="mt-4"
            >
              Back to Quotations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-7xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0 flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/quotations")}
                className="mr-4"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Edit Quotation #{id}
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <Button 
                variant="outline"
                onClick={() => navigate(`/quotations/view/${id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button 
                onClick={handleSaveQuotation}
                disabled={!selectedCustomerId}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button 
                onClick={handleValidateForFinalSave}
                disabled={!selectedCustomerId || quotation?.status === "saved"}
                className="bg-green-600 hover:bg-green-700"
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Save as Final
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Client Information */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <ClientInfo 
                customers={customers || []} 
                isLoading={customersLoading}
                selectedCustomerId={selectedCustomerId}
                onCustomerSelect={setSelectedCustomerId}
              />
            </div>
          </div>

          {/* Room Tabs */}
          {id && (
            <RoomTabs quotationId={parseInt(id)} />
          )}

          {/* Quotation Summary */}
          {id && (
            <QuotationSummary 
              quotationId={parseInt(id)} 
              installationHandling={installationHandling}
              setInstallationHandling={setInstallationHandling}
              globalDiscount={globalDiscount}
              setGlobalDiscount={setGlobalDiscount}
              gstPercentage={gstPercentage}
              setGstPercentage={setGstPercentage}
              onSave={handleSaveQuotation}
            />
          )}
        </div>
      </div>
    </div>
  );
}
