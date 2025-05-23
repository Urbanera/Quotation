import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Edit, Trash2, ArrowUpDown, SortAsc, SortDesc, Copy, Check, MoreVertical } from "lucide-react";
import { Quotation, Customer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type SortField = "quotationNumber" | "createdAt" | "updatedAt" | "totalAmount";
type SortOrder = "asc" | "desc";

export default function QuotationsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [quotationToDuplicate, setQuotationToDuplicate] = useState<Quotation | null>(null);
  const [quotationToApprove, setQuotationToApprove] = useState<Quotation | null>(null);
  const [quotationToConvert, setQuotationToConvert] = useState<Quotation | null>(null);
  const [quotationToConvertToInvoice, setQuotationToConvertToInvoice] = useState<Quotation | null>(null);
  const [duplicateForSameCustomer, setDuplicateForSameCustomer] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc"); // Newest first by default
  const { toast } = useToast();

  const { data: quotations, isLoading: quotationsLoading } = useQuery<Quotation[]>({
    queryKey: ["/api/quotations"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const isLoading = quotationsLoading || customersLoading;
  
  const handleDeleteQuotation = async () => {
    if (!quotationToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/quotations/${quotationToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "Quotation deleted",
        description: `Quotation #${quotationToDelete.id} has been removed.`,
      });
      setQuotationToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete quotation.",
        variant: "destructive",
      });
    }
  };
  
  const duplicateMutation = useMutation({
    mutationFn: async ({ id, customerId }: { id: number, customerId?: number }) => {
      const res = await apiRequest("POST", `/api/quotations/${id}/duplicate`, { 
        customerId: customerId 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "Quotation duplicated",
        description: `Quotation has been duplicated successfully.`,
      });
      setQuotationToDuplicate(null);
      setSelectedCustomerId(null);
      setDuplicateForSameCustomer(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to duplicate quotation.",
        variant: "destructive",
      });
    }
  });
  
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/quotations/${id}/status`, { 
        status: "approved"
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "Quotation approved",
        description: `Quotation #${data.id} has been approved successfully.`,
      });
      setQuotationToApprove(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve quotation.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation to convert quotation to sales order
  const convertMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/quotations/${id}/convert-to-order`, {
        expectedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        notes: ""
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      
      // Also invalidate customer ledger data
      if (quotationToConvert?.customerId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/customers", quotationToConvert.customerId, "ledger"] 
        });
      }
      
      toast({
        title: "Sales order created",
        description: `Quotation #${quotationToConvert?.id} has been converted to sales order #${data.id}.`,
      });
      setQuotationToConvert(null);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to convert quotation to sales order.";
      
      // Check if the error contains more specific information
      let description = "Failed to convert quotation to sales order.";
      try {
        if (error.response && error.response.data) {
          description = error.response.data.message || description;
        } else if (typeof error === 'object' && 'message' in error) {
          description = error.message;
        }
      } catch (e) {
        // Fallback to default message if we can't parse the error
      }
      
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to convert quotation to invoice
  const convertToInvoiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/quotations/${id}/convert-to-invoice`, {
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        notes: ""
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      // Also invalidate customer ledger data
      if (quotationToConvertToInvoice?.customerId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/customers", quotationToConvertToInvoice.customerId, "ledger"] 
        });
      }
      
      toast({
        title: "Invoice created",
        description: `Quotation #${quotationToConvertToInvoice?.id} has been converted to invoice #${data.id}.`,
      });
      setQuotationToConvertToInvoice(null);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to convert quotation to invoice.";
      
      // Check if the error contains more specific information
      let description = "Failed to convert quotation to invoice.";
      try {
        if (error.response && error.response.data) {
          description = error.response.data.message || description;
        } else if (typeof error === 'object' && 'message' in error) {
          description = error.message;
        }
      } catch (e) {
        // Fallback to default message if we can't parse the error
      }
      
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    }
  });
  
  const handleDuplicateQuotation = () => {
    if (!quotationToDuplicate) return;
    
    const targetCustomerId = duplicateForSameCustomer 
      ? quotationToDuplicate.customerId 
      : selectedCustomerId;
      
    duplicateMutation.mutate({ 
      id: quotationToDuplicate.id,
      customerId: duplicateForSameCustomer ? undefined : (targetCustomerId || undefined)
    });
  };
  
  const handleApproveQuotation = () => {
    if (!quotationToApprove) return;
    approveMutation.mutate(quotationToApprove.id);
  };
  
  const handleConvertQuotation = () => {
    if (!quotationToConvert) return;
    convertMutation.mutate(quotationToConvert.id);
  };
  
  const handleConvertToInvoice = () => {
    if (!quotationToConvertToInvoice) return;
    convertToInvoiceMutation.mutate(quotationToConvertToInvoice.id);
  };
  
  // Get customer name by ID
  const getCustomerName = (customerId: number): string => {
    const customer = customers?.find(c => c.id === customerId);
    return customer ? customer.name : `Customer #${customerId}`;
  };

  // Sorted and filtered quotations
  const filteredQuotations = useMemo(() => {
    if (!quotations || !customers) return [];
    
    // First filter out quotations from lost customers and then by search term
    let result = quotations.filter(quotation => {
      const customer = customers.find(c => c.id === quotation.customerId);
      // Skip quotations for lost customers
      if (customer && customer.stage === "lost") return false;
      
      const customerName = getCustomerName(quotation.customerId);
      return (
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.id.toString().includes(searchTerm)
      );
    });
    
    // Then sort
    return [...result].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "quotationNumber":
          // Use ID since we don't have quotationNumber property
          comparison = a.id - b.id;
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case "totalAmount":
          comparison = (a.finalPrice || 0) - (b.finalPrice || 0);
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [quotations, customers, searchTerm, sortField, sortOrder]);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Quotations</h1>
          <Link href="/quotations/create">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Quotation
            </Button>
          </Link>
        </div>

        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="w-full sm:max-w-xs relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search quotations..."
                className="pl-10 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={sortField}
                onValueChange={(value) => setSortField(value as SortField)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quotationNumber">Quotation Number</SelectItem>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="updatedAt">Last Modified</SelectItem>
                  <SelectItem value="totalAmount">Amount</SelectItem>
                </SelectContent>
              </Select>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                    <SortAsc className="mr-2 h-4 w-4" />
                    <span>Ascending</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                    <SortDesc className="mr-2 h-4 w-4" />
                    <span>Descending</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading quotations...</p>
            </div>
          ) : !filteredQuotations?.length ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {quotations?.length ? "No matching quotations found." : "No quotations yet."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredQuotations.map((quotation) => (
                <li key={quotation.id}>
                  <div className="px-4 py-4 flex items-center sm:px-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-indigo-600 truncate">
                          Quotation #{quotation.id}
                        </h3>
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ₹{(quotation.finalPrice || 0).toLocaleString('en-IN')}
                        </span>
                        {quotation.status && (
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${quotation.status === 'approved' ? 'bg-blue-100 text-blue-800' : 
                              quotation.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                              quotation.status === 'converted' ? 'bg-purple-100 text-purple-800' : 
                              quotation.status === 'expired' ? 'bg-gray-100 text-gray-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="truncate">{getCustomerName(quotation.customerId)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span>Created: {new Date(quotation.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span>Modified: {new Date(quotation.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0 flex space-x-2">
                      <Link href={`/quotations/view/${quotation.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      </Link>
                      <Link href={`/quotations/edit/${quotation.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuotationToDuplicate(quotation)}
                        className="text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300"
                      >
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Duplicate</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuotationToDelete(quotation)}
                        className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">More</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {quotation.status !== 'approved' && quotation.status !== 'converted' && (
                            <DropdownMenuItem onClick={() => setQuotationToApprove(quotation)}>
                              <Check className="mr-2 h-4 w-4 text-green-500" />
                              <span>Approve Quotation</span>
                            </DropdownMenuItem>
                          )}
                          {quotation.status === 'approved' && (
                            <>
                              <DropdownMenuItem onClick={() => setQuotationToConvert(quotation)}>
                                <Check className="mr-2 h-4 w-4 text-blue-500" />
                                <span>Convert to Sales Order</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setQuotationToConvertToInvoice(quotation)}>
                                <Check className="mr-2 h-4 w-4 text-indigo-500" />
                                <span>Convert to Invoice</span>
                              </DropdownMenuItem>
                            </>
                          )}
                          {quotation.status === 'converted' && (
                            <DropdownMenuItem disabled>
                              <span className="text-gray-400">Quotation Already Converted</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AlertDialog
        open={!!quotationToDelete}
        onOpenChange={(open) => !open && setQuotationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete Quotation #{quotationToDelete?.id} and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuotation}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog
        open={!!quotationToApprove}
        onOpenChange={(open) => !open && setQuotationToApprove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve Quotation #{quotationToApprove?.id} for {getCustomerName(quotationToApprove?.customerId || 0)}?
              Approved quotations can be converted to sales orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveQuotation}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
            >
              {approveMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  Approving...
                </>
              ) : (
                "Approve"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog 
        open={!!quotationToDuplicate}
        onOpenChange={(open) => !open && setQuotationToDuplicate(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicate Quotation</DialogTitle>
            <DialogDescription>
              Create a copy of Quotation #{quotationToDuplicate?.id} with all its rooms, products, accessories, and images.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <RadioGroup 
              value={duplicateForSameCustomer ? "same" : "different"} 
              onValueChange={(value) => setDuplicateForSameCustomer(value === "same")}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="same" id="same-customer" />
                <Label htmlFor="same-customer" className="font-normal">
                  Create for same customer ({getCustomerName(quotationToDuplicate?.customerId || 0)})
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="different" id="different-customer" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="different-customer" className="font-normal">
                    Create for different customer
                  </Label>
                  {!duplicateForSameCustomer && (
                    <Select 
                      value={selectedCustomerId?.toString() || ""} 
                      onValueChange={(value) => setSelectedCustomerId(parseInt(value))}
                      disabled={duplicateForSameCustomer}
                    >
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setQuotationToDuplicate(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDuplicateQuotation}
              disabled={!duplicateForSameCustomer && !selectedCustomerId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {duplicateMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  Duplicating...
                </>
              ) : (
                "Duplicate Quotation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog
        open={!!quotationToConvert}
        onOpenChange={(open) => !open && setQuotationToConvert(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Sales Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to convert Quotation #{quotationToConvert?.id} for {getCustomerName(quotationToConvert?.customerId || 0)} to a sales order?
              This will create a new sales order and mark the quotation as converted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertQuotation}
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
            >
              {convertMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  Converting...
                </>
              ) : (
                "Convert to Sales Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog
        open={!!quotationToConvertToInvoice}
        onOpenChange={(open) => !open && setQuotationToConvertToInvoice(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to convert Quotation #{quotationToConvertToInvoice?.id} for {getCustomerName(quotationToConvertToInvoice?.customerId || 0)} to an invoice?
              This will create a new invoice and mark the quotation as converted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToInvoice}
              className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-600"
            >
              {convertToInvoiceMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  Converting...
                </>
              ) : (
                "Convert to Invoice"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
