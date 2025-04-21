import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SalesOrder, Payment, Customer } from "@shared/schema";
import { Loader2, CreditCard, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function PaymentsPage() {
  const { toast } = useToast();

  // Fetch all orders to get payment information
  const { data: salesOrders, isLoading: isLoadingOrders } = useQuery<SalesOrder[]>({
    queryKey: ["/api/sales-orders"],
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load sales orders",
        variant: "destructive",
      });
    },
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // We'll need to fetch each order's payments when we build the detailed view
  const isLoading = isLoadingOrders;

  const getCustomerName = (customerId: number) => {
    const customer = customers?.find((c) => c.id === customerId);
    return customer ? customer.name : "Unknown Customer";
  };

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
        <h1 className="text-3xl font-bold">Payment Transactions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : salesOrders && salesOrders.length > 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="mx-auto h-12 w-12 mb-4 text-muted-foreground/80" />
              <p>Select a sales order to view its payment details</p>
              <Link href="/sales-orders">
                <Button variant="outline" className="mt-4">
                  View Sales Orders
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="mx-auto h-12 w-12 mb-4 text-muted-foreground/80" />
              <p>No payment transactions found</p>
              <p className="text-sm mt-2">
                You need to have sales orders before recording payments
              </p>
              <Link href="/quotations">
                <Button variant="outline" className="mt-4">
                  View Quotations
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {salesOrders && salesOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{getCustomerName(order.customerId)}</TableCell>
                    <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>{formatCurrency(order.amountPaid)}</TableCell>
                    <TableCell>{formatCurrency(order.amountDue)}</TableCell>
                    <TableCell>
                      <div className={`px-2 py-1 rounded text-xs inline-block ${
                        order.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : order.paymentStatus === 'partially_paid'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {order.paymentStatus.replace('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/sales-orders/${order.id}/payments`}>
                        <Button size="sm" variant="outline">
                          <CreditCard className="h-4 w-4 mr-2" />
                          View Payments
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}