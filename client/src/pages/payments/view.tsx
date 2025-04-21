import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { CustomerPayment, Customer, CompanySettings } from "@shared/schema";
import { Loader2, ArrowLeft, Printer, Download } from "lucide-react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

export default function PaymentReceiptPage() {
  const { id } = useParams();
  const paymentId = parseInt(id);
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Handle print
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Payment Receipt`,
    onAfterPrint: () => {
      toast({
        title: "Print successful",
        description: "Receipt has been sent to the printer",
      });
    },
  });

  // Fetch payment details
  const { data: payment, isLoading: isLoadingPayment } = useQuery<CustomerPayment>({
    queryKey: ["/api/customer-payments", paymentId],
    enabled: !isNaN(paymentId),
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load payment details",
        variant: "destructive",
      });
      console.error("Failed to load payment details:", error);
    },
  });

  // Fetch customer details
  const { data: customer, isLoading: isLoadingCustomer } = useQuery<Customer>({
    queryKey: ["/api/customers", payment?.customerId],
    enabled: !!payment?.customerId,
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load customer details",
        variant: "destructive",
      });
      console.error("Failed to load customer details:", error);
    },
  });

  // Fetch company details for the receipt
  const { data: company, isLoading: isLoadingCompany } = useQuery<CompanySettings>({
    queryKey: ["/api/settings/company"],
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load company settings",
        variant: "destructive",
      });
      console.error("Failed to load company settings:", error);
    },
  });

  const isLoading = isLoadingPayment || isLoadingCustomer || isLoadingCompany;

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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payments">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Payment Receipt</h1>
        </div>
        
        {!isLoading && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : payment && customer && company ? (
        <Card>
          <CardContent className="pt-6">
            <div ref={receiptRef} className="p-6 max-w-3xl mx-auto">
              {/* Receipt Header */}
              <div className="flex flex-col items-center mb-8">
                <h2 className="text-2xl font-bold uppercase text-center">Payment Receipt</h2>
                <p className="text-muted-foreground">Original Receipt for Accounting Records</p>
              </div>

              {/* Company Logo and Info */}
              <div className="flex flex-col sm:flex-row justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold">{company.name}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{company.address}</p>
                  <p className="text-sm text-muted-foreground">Phone: {company.phone}</p>
                  <p className="text-sm text-muted-foreground">Email: {company.email}</p>
                  {company.taxId && (
                    <p className="text-sm text-muted-foreground">Tax ID: {company.taxId}</p>
                  )}
                </div>
                <div className="mt-4 sm:mt-0">
                  <div className="text-right">
                    <p className="font-semibold">Receipt #: <span className="ml-2 font-bold">{payment.receiptNumber}</span></p>
                    <p className="font-semibold">Date: <span className="ml-2">{format(new Date(payment.paymentDate), "dd MMMM yyyy")}</span></p>
                    <p className="font-semibold">Transaction ID: <span className="ml-2 font-mono text-xs">{payment.transactionId}</span></p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Customer Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Name: <span className="font-normal">{customer.name}</span></p>
                    <p className="font-semibold">Email: <span className="font-normal">{customer.email}</span></p>
                    <p className="font-semibold">Phone: <span className="font-normal">{customer.phone}</span></p>
                  </div>
                  <div>
                    <p className="font-semibold">Address: <span className="font-normal whitespace-pre-line">{customer.address}</span></p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Payment Details */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
                
                <div className="flex flex-col sm:flex-row justify-between mb-4">
                  <div className="grid grid-cols-1 gap-2 mb-4 sm:mb-0">
                    <div>
                      <span className="font-semibold">Payment Type:</span>
                      <span className="ml-2">{getPaymentTypeLabel(payment.paymentType)}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Payment Method:</span>
                      <span className="ml-2">{getPaymentMethodLabel(payment.paymentMethod)}</span>
                    </div>
                    {payment.description && (
                      <div>
                        <span className="font-semibold">Description:</span>
                        <span className="ml-2">{payment.description}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-right w-full sm:w-64">
                    <p className="text-lg font-semibold">Amount Paid</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(payment.amount)}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Terms and Signature */}
              <div className="mt-12 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    This receipt confirms the payment received as specified above.
                    Thank you for your business.
                  </p>
                </div>
                <div className="text-right">
                  <div className="h-16 mb-2 border-b border-dashed"></div>
                  <p className="font-semibold">Authorized Signature</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 text-center text-xs text-muted-foreground">
                <p>This is a computer-generated receipt and does not require a physical signature.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment Not Found</CardTitle>
            <CardDescription>The requested payment receipt could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please check the payment ID and try again.</p>
            <Link href="/payments">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Payments
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}