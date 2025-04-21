import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SalesOrder, Payment, Customer } from "@shared/schema";
import { Loader2, ArrowLeft, CreditCard, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function SalesOrderPaymentsPage() {
  const { id } = useParams();
  const orderId = parseInt(id);
  const { toast } = useToast();

  // Fetch the sales order
  const { data: salesOrder, isLoading: isLoadingOrder } = useQuery<SalesOrder>({
    queryKey: ["/api/sales-orders", orderId],
    enabled: !isNaN(orderId),
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load sales order",
        variant: "destructive",
      });
    },
  });

  // Fetch payments for this order
  const { data: payments, isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/sales-orders", orderId, "payments"],
    enabled: !isNaN(orderId),
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive",
      });
    },
  });

  // Fetch the customer
  const { data: customer, isLoading: isLoadingCustomer } = useQuery<Customer>({
    queryKey: ["/api/customers", salesOrder?.customerId],
    enabled: !!salesOrder?.customerId,
  });

  const isLoading = isLoadingOrder || isLoadingPayments || isLoadingCustomer;

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Cash";
      case "bank_transfer":
        return "Bank Transfer";
      case "check":
        return "Check";
      case "card":
        return "Card";
      case "upi":
        return "UPI";
      default:
        return "Other";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href={`/sales-orders/view/${orderId}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Order
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Payment History</h1>
        </div>
        
        {salesOrder && salesOrder.amountDue > 0 && (
          <Link href={`/sales-orders/${orderId}/payments/add`}>
            <Button>
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !salesOrder ? (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">Sales Order Not Found</h2>
          <p className="mb-4">The requested sales order does not exist or has been deleted.</p>
          <Link href="/sales-orders">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sales Orders
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Number:</span>
                    <span className="font-medium">{salesOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer:</span>
                    <span className="font-medium">{customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Date:</span>
                    <span className="font-medium">
                      {salesOrder?.orderDate ? format(new Date(salesOrder.orderDate), "dd MMM yyyy") : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(salesOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(salesOrder.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Due:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(salesOrder.amountDue)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      salesOrder?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      salesOrder?.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      salesOrder?.status === 'in_production' ? 'bg-purple-100 text-purple-800' :
                      salesOrder?.status === 'ready_for_delivery' ? 'bg-indigo-100 text-indigo-800' :
                      salesOrder?.status === 'delivered' || salesOrder?.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {salesOrder?.status ? salesOrder.status.replace('_', ' ') : 'pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      salesOrder?.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      salesOrder?.paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {salesOrder?.paymentStatus ? salesOrder.paymentStatus.replace('_', ' ') : 'unpaid'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expected Delivery:</span>
                    <span className="font-medium">
                      {salesOrder?.expectedDeliveryDate ? format(new Date(salesOrder.expectedDeliveryDate), "dd MMM yyyy") : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.receiptNumber}
                        </TableCell>
                        <TableCell>
                          {payment.paymentDate ? format(new Date(payment.paymentDate), "dd MMM yyyy") : "N/A"}
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="mx-auto h-12 w-12 mb-4 text-muted-foreground/80" />
                  <p>No payment transactions found</p>
                  <Link href={`/sales-orders/${orderId}/payments/add`}>
                    <Button variant="outline" className="mt-4">
                      Record First Payment
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}