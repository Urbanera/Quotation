import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { CustomerPayment, Customer } from "@shared/schema";
import { Loader2, CreditCard, Plus, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function PaymentsPage() {
  const { toast } = useToast();

  // Fetch all customer payments
  const { data: customerPayments, isLoading: isLoadingPayments } = useQuery<CustomerPayment[]>({
    queryKey: ["/api/customer-payments"],
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load customer payments",
        variant: "destructive",
      });
      console.error("Failed to load customer payments:", error);
    },
  });

  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const isLoading = isLoadingPayments || isLoadingCustomers;

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
  
  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "token_advance":
        return "Token Advance";
      case "starting_production":
        return "Starting Production";
      case "final_payment":
        return "Final Payment";
      default:
        return "Other";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customer Payments</h1>
        <Link href="/payments/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Payment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : customerPayments && customerPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.receiptNumber}
                    </TableCell>
                    <TableCell>{getCustomerName(payment.customerId)}</TableCell>
                    <TableCell>
                      {payment.paymentDate && format(new Date(payment.paymentDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{getPaymentTypeLabel(payment.paymentType)}</TableCell>
                    <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.transactionId}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/payments/view/${payment.id}`}>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          View Receipt
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="mx-auto h-12 w-12 mb-4 text-muted-foreground/80" />
              <p>No customer payment transactions found</p>
              <Link href="/payments/create">
                <Button variant="outline" className="mt-4">
                  Create First Payment
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Direct Customer Payments</CardTitle>
            <CardDescription>
              Record payments directly from customers without requiring a sales order,
              particularly useful for customers in the "booked" stage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Use direct payments to track:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li>Token advances before quotation finalization</li>
              <li>Production start payments</li>
              <li>Final payments upon delivery</li>
              <li>Other miscellaneous payments</li>
            </ul>
            
            <Link href="/payments/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Payment
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sales Order Payments</CardTitle>
            <CardDescription>
              Manage payments associated with specific sales orders converted from quotations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Sales order payments are linked to specific orders and track:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li>Payment against a specific sales order</li>
              <li>Automatic calculation of remaining balance</li>
              <li>Payment status updates (paid, partially paid, unpaid)</li>
            </ul>
            
            <Link href="/sales-orders">
              <Button variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                View Sales Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}