import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, Eye, Save, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AppSettings, Customer, quotationFormSchema } from "@shared/schema";
import ClientInfo from "@/components/quotations/ClientInfo";
import RoomTabs from "@/components/quotations/RoomTabs";
import QuotationSummary from "@/components/quotations/QuotationSummary";
import { ValidationDialog } from "@/components/quotations/ValidationDialog";
import { validateQuotation, markQuotationAsSaved, ValidationError, ValidationWarning } from "@/lib/quotationValidation";

export default function CreateQuotation() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [quotationId, setQuotationId] = useState<number | null>(null);
  const [installationHandling, setInstallationHandling] = useState<number>(0);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [gstPercentage, setGstPercentage] = useState<number>(18);
  
  // States for validation dialog
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);
  
  // Fetch app settings for default values
  const { data: appSettings } = useQuery<AppSettings>({
    queryKey: ["/api/settings/app"],
    retry: 1,
  });
  
  // Set default values from app settings
  useEffect(() => {
    if (appSettings) {
      setGlobalDiscount(appSettings.defaultGlobalDiscount);
      setGstPercentage(appSettings.defaultGstPercentage);
    }
  }, [appSettings]);

  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Create quotation mutation
  const createQuotationMutation = useMutation({
    mutationFn: async (data: typeof quotationFormSchema._type) => {
      const response = await apiRequest("POST", "/api/quotations", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setQuotationId(data.id);
      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create quotation",
        variant: "destructive",
      });
    }
  });

  // Save quotation
  const handleSaveQuotation = useCallback(async () => {
    if (!selectedCustomerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    // If quotation is not yet created, create it
    if (!quotationId) {
      createQuotationMutation.mutate({
        customerId: selectedCustomerId,
        installationHandling,
        globalDiscount,
        gstPercentage,
        title: "",
        status: "draft"
      });
    } else {
      // Update existing quotation
      try {
        await apiRequest("PUT", `/api/quotations/${quotationId}`, {
          customerId: selectedCustomerId,
          installationHandling,
          globalDiscount,
          gstPercentage
        });
        toast({
          title: "Success",
          description: "Quotation updated successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
        queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}`] });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update quotation",
          variant: "destructive",
        });
      }
    }
  }, [selectedCustomerId, quotationId, installationHandling, globalDiscount, gstPercentage, toast, createQuotationMutation]);

  // Start validation process for saving quotation as final (saved status)
  const handleValidateForFinalSave = useCallback(async () => {
    if (!quotationId) {
      // If no quotation exists yet, first create it
      if (!selectedCustomerId) {
        toast({
          title: "Error",
          description: "Please select a customer",
          variant: "destructive",
        });
        return;
      }
      
      // Create the quotation first
      createQuotationMutation.mutate({
        customerId: selectedCustomerId,
        installationHandling,
        globalDiscount,
        gstPercentage,
        title: "",
        status: "draft"
      });
      
      // Toast explaining they need to add content first
      toast({
        title: "Quotation created",
        description: "Please add rooms, products and installation charges before saving as final",
      });
      return;
    }
    
    try {
      // First save any current changes
      await handleSaveQuotation();
      
      // Run validation
      const validationResult = await validateQuotation(quotationId);
      
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
  }, [quotationId, selectedCustomerId, installationHandling, globalDiscount, gstPercentage, toast, createQuotationMutation, handleSaveQuotation]);

  // Mutation to save quotation as final
  const saveAsFinalMutation = useMutation({
    mutationFn: async () => {
      if (!quotationId) throw new Error("Quotation ID is missing");
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
      navigate(`/quotations/view/${quotationId}`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}/details`] });
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
                Create Quotation
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              {quotationId && (
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/quotations/view/${quotationId}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              )}
              <Button 
                onClick={handleSaveQuotation}
                disabled={!selectedCustomerId || createQuotationMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Quotation
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
          {quotationId && (
            <RoomTabs quotationId={quotationId} />
          )}

          {/* Quotation Summary */}
          {quotationId && (
            <QuotationSummary 
              quotationId={quotationId} 
              installationHandling={installationHandling}
              setInstallationHandling={setInstallationHandling}
              globalDiscount={globalDiscount}
              setGlobalDiscount={setGlobalDiscount}
              gstPercentage={gstPercentage}
              setGstPercentage={setGstPercentage}
              onSave={handleSaveQuotation}
            />
          )}

          {/* Initial message if no quotation yet */}
          {!quotationId && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Create Your Quotation</h3>
                <p className="text-gray-500 mb-4">
                  Select a customer above and save to start adding rooms and products to your quotation.
                </p>
                <div className="flex justify-center">
                  <Button 
                    onClick={handleSaveQuotation}
                    disabled={!selectedCustomerId || createQuotationMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {createQuotationMutation.isPending ? 'Creating...' : 'Create Quotation'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Validation Dialog */}
      <ValidationDialog
        open={isValidationDialogOpen}
        onOpenChange={setIsValidationDialogOpen}
        errors={validationErrors}
        warnings={validationWarnings}
        onProceed={validationErrors.length === 0 ? () => saveAsFinalMutation.mutate() : undefined}
        onCancel={() => setIsValidationDialogOpen(false)}
        quotationId={quotationId || 0}
      />
    </div>
  );
}