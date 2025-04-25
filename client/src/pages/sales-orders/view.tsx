import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  SalesOrder, 
  Customer, 
  Payment, 
  CustomerPayment,
  Quotation
} from "@shared/schema";
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  FileText, 
  Loader2,
  ShoppingBag, 
  TruckIcon, 
  User, 
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define RoomWithItems for the QuotationWithDetails
interface RoomWithItems {
  id: number;
  name: string;
  quotationId: number;
  products: Product[];
  accessories: Accessory[];
  images: Image[];
  installationCharges: InstallationCharge[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define QuotationWithDetails to match server response
interface QuotationWithDetails extends Quotation {
  customer: Customer;
  rooms: RoomWithItems[];
}

// Define SalesOrderResponse type to match the server response
interface SalesOrderResponse {
  id: number;
  orderNumber: string;
  customerId: number;
  quotationId: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  paymentStatus: string;
  orderDate: string;
  expectedDeliveryDate: string;
  notes: string;
  customer: Customer;
  quotation: QuotationWithDetails;
  payments: Payment[];
}

export default function ViewSalesOrder() {
  const { id } = useParams();
  const orderId = parseInt(id || "0");
  const { toast } = useToast();

  // Fetch the sales order with all details
  const { 
    data: salesOrder, 
    isLoading: isLoadingSalesOrder, 
    error 
  } = useQuery<SalesOrderResponse>({
    queryKey: ["/api/sales-orders", orderId],
    queryFn: async () => {
      console.log("Fetching sales order data for ID:", orderId);
      const response = await fetch(`/api/sales-orders/${orderId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Error fetching sales order: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log("Sales order API data:", data);
      return data;
    },
    enabled: !isNaN(orderId) && orderId > 0,
  });

  // Fetch direct customer payments for this customer
  const { 
    data: customerPayments = [], 
    isLoading: isLoadingCustomerPayments 
  } = useQuery<CustomerPayment[]>({
    queryKey: ["/api/customer-payments"],
    queryFn: async () => {
      if (!salesOrder?.customerId) return [];
      console.log("Fetching customer payments for customer ID:", salesOrder.customerId);
      const response = await fetch(`/api/customer-payments?customerId=${salesOrder.customerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch customer payments');
      }
      const data = await response.json();
      console.log("Customer payments data:", data);
      return data;
    },
    enabled: !!salesOrder?.customerId
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest(
        "PUT", 
        `/api/sales-orders/${orderId}/status`, 
        { status }
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Sales order status has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update order status: " + error.message,
        variant: "destructive",
      });
    },
  });
  
  // Convert to invoice mutation
  const convertToInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST", 
        `/api/sales-orders/${orderId}/convert-to-invoice`, 
        {}
      );
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Conversion successful",
        description: `Sales order #${orderId} has been converted to invoice #${data.id}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error: any) => {
      // Extract detailed error message if available
      let errorMessage = "Failed to convert sales order to invoice.";
      try {
        if (error.response && error.response.data) {
          errorMessage = error.response.data.message || errorMessage;
        } else if (typeof error === 'object' && 'message' in error) {
          errorMessage = error.message;
        }
      } catch (e) {
        // Fallback to default message if we can't parse the error
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash": return "Cash";
      case "bank_transfer": return "Bank Transfer";
      case "check": return "Check";
      case "card": return "Card";
      case "upi": return "UPI";
      default: return "Other";
    }
  };

  const isLoading = isLoadingSalesOrder || isLoadingCustomerPayments || 
                 updateStatusMutation.isPending || convertToInvoiceMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Sales Order</h2>
          <p className="mb-4">There was an error loading the sales order data: {String(error)}</p>
          <Link href="/sales-orders">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sales Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!salesOrder) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sales Order Not Found</h2>
          <p className="mb-4">The requested sales order does not exist or has been deleted.</p>
          <Link href="/sales-orders">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sales Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter customer payments to show only those for this customer
  const filteredCustomerPayments = customerPayments?.filter(
    payment => payment.customerId === salesOrder.customerId
  ) || [];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/sales-orders">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Sales Order {salesOrder.orderNumber}</h1>
        <Badge 
          className={`ml-4 ${
            salesOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            salesOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
            salesOrder.status === 'in_production' ? 'bg-purple-100 text-purple-800' :
            salesOrder.status === 'ready_for_delivery' ? 'bg-indigo-100 text-indigo-800' :
            salesOrder.status === 'delivered' || salesOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}
          variant="outline"
        >
          {salesOrder.status ? salesOrder.status.replace('_', ' ') : 'pending'}
        </Badge>
        <Badge 
          className={`${
            salesOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
            salesOrder.paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}
          variant="outline"
        >
          {salesOrder.paymentStatus ? salesOrder.paymentStatus.replace('_', ' ') : 'unpaid'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <FileText className="h-4 w-4" /> Quotation
                </h3>
                <p className="mt-1">
                  {salesOrder.quotation?.quotationNumber || `#${salesOrder.quotationId}` || "N/A"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Order Date
                </h3>
                <p className="mt-1">
                  {salesOrder.orderDate ? format(new Date(salesOrder.orderDate), "dd MMM yyyy") : "N/A"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <TruckIcon className="h-4 w-4" /> Expected Delivery
                </h3>
                <p className="mt-1">
                  {salesOrder.expectedDeliveryDate 
                    ? format(new Date(salesOrder.expectedDeliveryDate), "dd MMM yyyy") 
                    : "N/A"}
                </p>
              </div>
              
              <div className="col-span-2 md:col-span-3">
                <h3 className="text-sm font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <User className="h-4 w-4" /> Customer
                </h3>
                <div className="border rounded-md p-3 bg-gray-50">
                  {/* Display customer information */}
                  {salesOrder.customer ? (
                    <>
                      <p className="font-medium">{salesOrder.customer.name}</p>
                      <p className="text-sm text-gray-500">{salesOrder.customer.email}</p>
                      <p className="text-sm text-gray-500">{salesOrder.customer.phone}</p>
                      <p className="text-sm text-gray-500 mt-1">{salesOrder.customer.address}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No customer information available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <div className="border rounded-md p-3 bg-gray-50 min-h-[60px]">
                {salesOrder.notes || "No notes provided."}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Amount:</span>
                <span className="font-medium">{formatCurrency(salesOrder.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Amount Paid:</span>
                <span className="font-medium text-green-600">{formatCurrency(salesOrder.amountPaid || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Amount Due:</span>
                <span className="font-medium text-red-600">{formatCurrency(salesOrder.amountDue || 0)}</span>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Change Order Status:</h3>
                <Select 
                  value={salesOrder.status || "pending"} 
                  onValueChange={handleStatusChange}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_production">In Production</SelectItem>
                    <SelectItem value="ready_for_delivery">Ready for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4 border-t">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => convertToInvoiceMutation.mutate()}
                  disabled={convertToInvoiceMutation.isPending || salesOrder.status === 'cancelled'}
                >
                  {convertToInvoiceMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Convert to Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="items">Order Items</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              {(!salesOrder.payments || salesOrder.payments.length === 0) && 
               (!filteredCustomerPayments || filteredCustomerPayments.length === 0) && (
                <CardDescription>No payments recorded yet</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {/* Combine both payment types for display */}
              {((salesOrder.payments && salesOrder.payments.length > 0) || 
                (filteredCustomerPayments && filteredCustomerPayments.length > 0)) ? (
                <div className="space-y-8">
                  {/* Sales Order Payments */}
                  {salesOrder.payments && salesOrder.payments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Sales Order Payments</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Receipt Number</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salesOrder.payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {payment.paymentDate 
                                  ? format(new Date(payment.paymentDate), "dd MMM yyyy") 
                                  : "N/A"}
                              </TableCell>
                              <TableCell className="font-medium">
                                {payment.receiptNumber}
                              </TableCell>
                              <TableCell>{formatCurrency(payment.amount)}</TableCell>
                              <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {payment.transactionId}
                              </TableCell>
                              <TableCell>{payment.notes}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {/* Customer Direct Payments - only show for this customer */}
                  {filteredCustomerPayments && filteredCustomerPayments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Customer Payments</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Receipt Number</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCustomerPayments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {payment.paymentDate 
                                  ? format(new Date(payment.paymentDate), "dd MMM yyyy") 
                                  : "N/A"}
                              </TableCell>
                              <TableCell className="font-medium">
                                {payment.receiptNumber}
                              </TableCell>
                              <TableCell>{formatCurrency(payment.amount)}</TableCell>
                              <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {payment.transactionId}
                              </TableCell>
                              <TableCell>{payment.description || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="mx-auto h-12 w-12 mb-4 text-muted-foreground/80" />
                  <p>No payment transactions found</p>
                  <p className="text-sm mt-2">Payments are managed separately from sales orders.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="items" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                Items from Quotation {salesOrder.quotation?.quotationNumber || "N/A"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salesOrder.quotation?.rooms && salesOrder.quotation.rooms.length > 0 ? (
                <div className="space-y-6">
                  {salesOrder.quotation.rooms.map((room) => (
                    <div key={room.id} className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-2">{room.name}</h3>
                      
                      {room.products && room.products.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Products</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead>Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {room.products.map((product) => (
                                <TableRow key={product.id}>
                                  <TableCell>{product.name}</TableCell>
                                  <TableCell>{product.quantity}</TableCell>
                                  <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                                  <TableCell>{formatCurrency(product.quantity * product.sellingPrice)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      
                      {room.accessories && room.accessories.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Accessories</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead>Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {room.accessories.map((accessory) => (
                                <TableRow key={accessory.id}>
                                  <TableCell>{accessory.name}</TableCell>
                                  <TableCell>{accessory.quantity}</TableCell>
                                  <TableCell>{formatCurrency(accessory.sellingPrice)}</TableCell>
                                  <TableCell>{formatCurrency(accessory.quantity * accessory.sellingPrice)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="mx-auto h-12 w-12 mb-4 text-muted-foreground/80" />
                  <p>No items found in this order</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}