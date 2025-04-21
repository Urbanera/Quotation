import { useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, FileOutput, Printer, Download, Edit, CalendarRange, CheckSquare, ShoppingCart } from "lucide-react";
import { QuotationWithDetails } from "@shared/schema";
import BasicQuote from "@/components/PDFQuotes/BasicQuote";
import PresentationQuote from "@/components/PDFQuotes/PresentationQuote";
import { ProjectTimeline } from "@/components/quotations/timeline/ProjectTimeline";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

export default function ViewQuotation() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const basicQuoteRef = useRef<any>(null);
  const presentationQuoteRef = useRef<any>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date>(
    addWeeks(new Date(), 4)
  );
  const [orderNotes, setOrderNotes] = useState("");

  const { data: quotation, isLoading } = useQuery<QuotationWithDetails>({
    queryKey: [`/api/quotations/${id}`],
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
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${id}`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${id}`] });
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

  const handlePrint = () => {
    if (window.print) {
      window.print();
    } else {
      toast({
        title: "Print not supported",
        description: "Printing is not supported in your browser",
        variant: "destructive",
      });
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
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button 
                variant="outline"
                onClick={() => toast({
                  title: "Download",
                  description: "Download functionality will be implemented soon."
                })}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
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
              
              {/* Show this button only if quotation is approved */}
              {quotation.status === "approved" && (
                <Button
                  onClick={() => setIsConvertDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Convert to Sales Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quote Tabs */}
      <div className="mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Basic Quote
              </TabsTrigger>
              <TabsTrigger value="presentation" className="flex items-center">
                <FileOutput className="mr-2 h-4 w-4" />
                Presentation Quote
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
            
            <TabsContent value="timeline" className="mt-6">
              <div className="bg-white shadow rounded-lg p-6">
                <ProjectTimeline quotationId={parseInt(id || "0")} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
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
    </div>
  );
}
