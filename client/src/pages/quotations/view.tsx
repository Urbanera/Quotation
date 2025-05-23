import { useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, FileOutput, Printer, Download, Edit, CalendarRange, CheckSquare, ShoppingCart, FileText as FileInvoice, Mail, Layout } from "lucide-react";
import { QuotationWithDetails, CompanySettings, AppSettings } from "@shared/schema";
import BasicQuote from "@/components/PDFQuotes/BasicQuote";
import PresentationQuote from "@/components/PDFQuotes/PresentationQuote";
import LandscapeQuote from "@/components/PDFQuotes/LandscapeQuote";
import { ProjectTimeline } from "@/components/quotations/timeline/ProjectTimeline";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { exportToPdf } from "@/lib/pdfExport";
import { exportReactPdf } from "@/lib/reactPdfExport";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { format, addWeeks } from "date-fns";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import ConvertToInvoiceForm from "@/components/invoices/ConvertToInvoiceForm";

export default function ViewQuotation() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const basicQuoteRef = useRef<any>(null);
  const presentationQuoteRef = useRef<any>(null);
  const landscapeQuoteRef = useRef<any>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isConvertToInvoiceDialogOpen, setIsConvertToInvoiceDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date>(
    addWeeks(new Date(), 4)
  );
  const [orderNotes, setOrderNotes] = useState("");

  // Get company settings
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ['/api/settings/company'],
  });

  // Get app settings
  const { data: appSettings } = useQuery<AppSettings>({
    queryKey: ['/api/settings/app'],
  });

  const { data: quotation, isLoading } = useQuery<QuotationWithDetails>({
    queryKey: [`/api/quotations/${id}/details`],
    enabled: !!id,
  });
  
  // Approve quotation mutation
  const approveQuotationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "PUT",
        `/api/quotations/${id}/status`,
        { status: "approved" }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quotation Approved",
        description: "The quotation has been marked as approved.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${id}/details`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      setIsApproveDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve quotation. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to approve quotation:", error);
    },
  });
  
  // Convert to sales order mutation
  const convertToSalesOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/quotations/${id}/convert-to-order`,
        { 
          expectedDeliveryDate: expectedDeliveryDate.toISOString(),
          notes: orderNotes 
        }
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sales Order Created",
        description: "The quotation has been converted to a sales order.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${id}/details`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      setIsConvertDialogOpen(false);
      // Navigate to the new sales order
      navigate(`/sales-orders/view/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to convert quotation to sales order. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to convert quotation:", error);
    },
  });

  const [activeTab, setActiveTab] = useState<string>("basic");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  

  
  const handlePrint = () => {
    if (window.print) {
      // Simply trigger the print dialog - our CSS will handle the styling
      window.print();
    } else {
      toast({
        title: "Print not supported",
        description: "Printing is not supported in your browser",
        variant: "destructive",
      });
    }
  };
  
  // Email quotation mutation
  const emailQuotationMutation = useMutation({
    mutationFn: async (email: string) => {
      setSendingEmail(true);
      
      // Generate PDF for attachment
      let pdfBase64 = null;
      let filename = `Quotation-${quotation?.quotationNumber || id}`;
      
      if (activeTab === "basic" && basicQuoteRef.current) {
        try {
          // Convert the current PDF to base64
          const blob = await exportToPdf(basicQuoteRef.current, filename, false, true) as Blob;
          pdfBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error("Error generating PDF:", error);
        }
      } else if (activeTab === "presentation" && presentationQuoteRef.current) {
        try {
          // Convert the current PDF to base64
          filename = `Presentation-${quotation?.quotationNumber || id}`;
          const blob = await exportToPdf(presentationQuoteRef.current, filename, true, true) as Blob;
          pdfBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error("Error generating PDF:", error);
        }
      } else if (activeTab === "landscape") {
        try {
          // For landscape format
          if (!quotation || !companySettings || !appSettings) {
            throw new Error('Required data not loaded');
          }
          
          filename = `Landscape-${quotation?.quotationNumber || id}`;
          const LandscapeDocument = (
            <LandscapeQuote 
              quotation={quotation} 
              companySettings={companySettings}
              appSettings={appSettings}
            />
          );
          
          // Use the React-PDF export function instead
          const blob = await exportReactPdf(LandscapeDocument, filename, true) as Blob;
          pdfBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error("Error generating landscape PDF:", error);
        }
      }
      
      // Send email request to server
      const response = await apiRequest(
        "POST",
        `/api/quotations/${id}/email`,
        { 
          emailTo: email,
          pdfBase64: pdfBase64
        }
      );
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "The quotation has been sent via email successfully.",
      });
      setIsEmailDialogOpen(false);
      setSendingEmail(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to send email: ${error.message}`,
        variant: "destructive",
      });
      console.error("Failed to send quotation via email:", error);
      setSendingEmail(false);
    },
  });
  
  const handleSendEmail = () => {
    if (!emailTo) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }
    
    emailQuotationMutation.mutate(emailTo);
  };
  
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      
      // Generate the filename based on active tab
      let filename = `Quotation-${quotation?.quotationNumber || id}`;
      if (activeTab === 'presentation') {
        filename = `Presentation-${quotation?.quotationNumber || id}`;
      } else if (activeTab === 'landscape') {
        filename = `Landscape-${quotation?.quotationNumber || id}`;
      }
      
      if (activeTab === 'landscape') {
        // For landscape quotations, we need to create the document first
        if (!quotation || !companySettings || !appSettings) {
          throw new Error('Required data not loaded');
        }
        
        // Create landscape document
        const LandscapeDocument = (
          <LandscapeQuote 
            quotation={quotation} 
            companySettings={companySettings}
            appSettings={appSettings}
          />
        );
        
        // Export the landscape format using React-PDF
        await exportReactPdf(LandscapeDocument, filename);
      } else {
        // For basic and presentation formats
        const quoteElement = activeTab === 'basic' 
          ? basicQuoteRef.current
          : presentationQuoteRef.current;
        
        if (!quoteElement) {
          throw new Error('Quote element not found');
        }
        
        // Export to PDF with type information
        await exportToPdf(quoteElement, filename, activeTab === 'presentation', false);
      }
      
      toast({
        title: "PDF Generated",
        description: "Your quotation has been downloaded as a PDF"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  


  if (isLoading) {
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

  if (!quotation) {
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
                Quotation #{id}
              </h2>
            </div>
            <div className="mt-4 flex flex-wrap md:mt-0 md:ml-4 gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  const printUrl = activeTab === 'basic' 
                    ? `/quotations/print/${id}`
                    : `/quotations/print/presentation/${id}`;
                  window.open(printUrl, '_blank');
                }}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print {activeTab === 'basic' ? 'Basic' : 'Presentation'} Quote
              </Button>
              <Button 
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
              >
                <Download className="mr-2 h-4 w-4" />
                {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  // Pre-fill with customer email if available
                  if (quotation && quotation.customer) {
                    setEmailTo(quotation.customer.email);
                  }
                  setIsEmailDialogOpen(true);
                }}
                disabled={isGeneratingPdf || sendingEmail}
                className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300"
              >
                <Mail className="mr-2 h-4 w-4" />
                {sendingEmail ? "Sending..." : "Email Quote"}
              </Button>
              
              {/* Show these buttons only if quotation is not approved */}
              {quotation.status !== "approved" && (
                <>
                  <Button 
                    onClick={() => navigate(`/quotations/edit/${id}`)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Quotation
                  </Button>
                  <Button
                    onClick={() => setIsApproveDialogOpen(true)}
                    variant="outline"
                    className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300"
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
              
              {/* Show these buttons only if quotation is approved */}
              {quotation.status === "approved" && (
                <>
                  <Button
                    onClick={() => setIsConvertDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Convert to Sales Order
                  </Button>
                  <Button
                    onClick={() => setIsConvertToInvoiceDialogOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <FileInvoice className="mr-2 h-4 w-4" />
                    Convert to Invoice
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quote Tabs */}
      <div className="mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="basic" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-4 print:hidden">
              <TabsTrigger value="basic" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Basic Quote
              </TabsTrigger>
              <TabsTrigger value="presentation" className="flex items-center">
                <FileOutput className="mr-2 h-4 w-4" />
                Presentation Quote
              </TabsTrigger>
              <TabsTrigger value="landscape" className="flex items-center">
                <Layout className="mr-2 h-4 w-4" />
                Landscape
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center">
                <CalendarRange className="mr-2 h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="mt-6">
              <div className="bg-white shadow rounded-lg p-6">
                <BasicQuote ref={basicQuoteRef} quotation={quotation} />
              </div>
            </TabsContent>
            
            <TabsContent value="presentation" className="mt-6">
              <div className="bg-white shadow rounded-lg p-6">
                <PresentationQuote ref={presentationQuoteRef} quotation={quotation} />
              </div>
            </TabsContent>
            
            <TabsContent value="landscape" className="mt-6">
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-center mb-4 text-gray-600">
                  Landscape format is available for direct download using the button below.
                </p>
                
                <div className="flex items-center justify-center">
                  {quotation && companySettings && appSettings ? (
                    <div className="flex flex-col items-center">
                      <PDFDownloadLink 
                        document={
                          <LandscapeQuote 
                            quotation={quotation} 
                            companySettings={companySettings}
                            appSettings={appSettings}
                          />
                        } 
                        fileName={`Landscape-${quotation?.quotationNumber || id}.pdf`}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                      >
                        {({ blob, url, loading, error }) => 
                          loading ? 
                            <>
                              <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Preparing PDF...
                            </> : 
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Download Landscape PDF
                            </>
                        }
                      </PDFDownloadLink>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        (This might take a few seconds to prepare)
                      </p>
                    </div>
                  ) : (
                    <div className="text-gray-500">Loading data...</div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-6">
              <div className="bg-white shadow rounded-lg p-6">
                <ProjectTimeline quotationId={parseInt(id || "0")} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* No extra printable area needed - CSS will handle printing directly */}
      
      {/* Approval Dialog */}
      <Dialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this quotation? This action will mark the quotation as approved and allow it to be converted to a sales order.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => approveQuotationMutation.mutate()}
              className="bg-green-600 hover:bg-green-700"
              disabled={approveQuotationMutation.isPending}
            >
              {approveQuotationMutation.isPending ? "Approving..." : "Approve Quotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Convert to Sales Order Dialog */}
      <Dialog
        open={isConvertDialogOpen}
        onOpenChange={setIsConvertDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Convert to Sales Order</DialogTitle>
            <DialogDescription>
              Create a sales order based on this approved quotation. You can set the expected delivery date and add any special notes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="expected-delivery">Expected Delivery Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="expected-delivery"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expectedDeliveryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {expectedDeliveryDate ? format(expectedDeliveryDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expectedDeliveryDate}
                    onSelect={(date) => date && setExpectedDeliveryDate(date)}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="order-notes">Notes (Optional)</Label>
              <Textarea
                id="order-notes"
                placeholder="Add any special instructions or notes for this order"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConvertDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => convertToSalesOrderMutation.mutate()}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={convertToSalesOrderMutation.isPending}
            >
              {convertToSalesOrderMutation.isPending ? "Converting..." : "Create Sales Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Convert to Invoice Dialog */}
      <Dialog
        open={isConvertToInvoiceDialogOpen}
        onOpenChange={setIsConvertToInvoiceDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Convert to Invoice</DialogTitle>
            <DialogDescription>
              Create an invoice based on this approved quotation. You can set the due date and add any special notes.
            </DialogDescription>
          </DialogHeader>
          
          <ConvertToInvoiceForm 
            quotationId={parseInt(id || "0")} 
            onClose={() => setIsConvertToInvoiceDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Email Dialog */}
      <Dialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Email Quotation</DialogTitle>
            <DialogDescription>
              Send this quotation via email. The PDF will be attached to the email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emailTo" className="text-right">
                Email To
              </Label>
              <Input
                id="emailTo"
                placeholder="recipient@example.com"
                className="col-span-3"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
              disabled={emailQuotationMutation.isPending || sendingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={emailQuotationMutation.isPending || sendingEmail}
            >
              {(emailQuotationMutation.isPending || sendingEmail) 
                ? "Sending..." 
                : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
