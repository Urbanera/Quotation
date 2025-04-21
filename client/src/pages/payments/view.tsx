import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, BadgeCheck, Calendar, CreditCard, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CustomerPayment, Customer } from "@shared/schema";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PaymentReceipt from "@/components/payments/PaymentReceipt";

export default function ViewPaymentPage() {
  const [_, params] = useLocation();
  const id = params ? parseInt(params.id) : undefined;
  const { toast } = useToast();

  const { data: payment, isLoading: isLoadingPayment } = useQuery<CustomerPayment>({
    queryKey: [`/api/customer-payments/${id}`],
    enabled: !!id,
    staleTime: 0,
  });

  const { data: customer, isLoading: isLoadingCustomer } = useQuery<Customer>({
    queryKey: ["/api/customers", payment?.customerId],
    enabled: !!payment?.customerId,
  });

  if (isLoadingPayment || isLoadingCustomer) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-500">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-xl font-semibold text-gray-700">Payment not found</p>
          <Link href="/payments">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payments">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Payment Details</h1>
        </div>
        
        <div className="flex space-x-2">
          <PDFDownloadLink
            document={<PaymentReceipt payment={payment} customer={customer} />}
            fileName={`Receipt-${payment.receiptNumber}.pdf`}
          >
            {({ loading }) => (
              <Button disabled={loading}>
                <FileDown className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BadgeCheck className="mr-2 h-5 w-5 text-primary" />
              Receipt Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Receipt Number</p>
              <p className="text-lg font-semibold">{payment.receiptNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
              <p className="text-lg font-semibold">{payment.transactionId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <Badge className="mt-1">
                {payment.paymentType === 'token_advance' && 'Token Advance'}
                {payment.paymentType === 'starting_production' && 'Starting Production'}
                {payment.paymentType === 'final_payment' && 'Final Payment'}
                {payment.paymentType === 'other' && 'Other'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="text-lg font-semibold">
                {format(new Date(payment.paymentDate), 'PPP')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-2xl font-semibold text-primary">
                {formatCurrency(payment.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
              <Badge variant="outline" className="mt-1">
                {payment.paymentMethod === 'cash' && 'Cash'}
                {payment.paymentMethod === 'bank_transfer' && 'Bank Transfer'}
                {payment.paymentMethod === 'check' && 'Check'}
                {payment.paymentMethod === 'card' && 'Card'}
                {payment.paymentMethod === 'upi' && 'UPI'}
                {payment.paymentMethod === 'other' && 'Other'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-base">{payment.description || 'No description provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created On</p>
              <p className="text-base">
                {format(new Date(payment.createdAt), 'PPP p')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <Link href={`/customers/view/${customer.id}`}>
                    <p className="text-lg font-semibold hover:text-primary cursor-pointer">
                      {customer.name}
                    </p>
                  </Link>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact</p>
                  <p className="text-base">{customer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-base">{customer.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stage</p>
                  <Badge variant="secondary" className="mt-1">
                    {customer.stage === 'new' && 'New'}
                    {customer.stage === 'pipeline' && 'Pipeline'}
                    {customer.stage === 'cold' && 'Cold'}
                    {customer.stage === 'warm' && 'Warm'}
                    {customer.stage === 'booked' && 'Booked'}
                  </Badge>
                </div>
              </>
            )}
            {!customer && <p>Customer information not available</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}