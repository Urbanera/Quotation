import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { CustomerPayment, Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PaymentReceipt from "@/components/payments/PaymentReceipt";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function ViewPaymentPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const id = location.split("/").pop();

  // Fetch payment data
  const { data: payment, isLoading: isLoadingPayment, error } = useQuery<CustomerPayment>({
    queryKey: [`/api/customer-payments/${id}`],
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to load payment details",
        variant: "destructive",
      });
      console.error("Failed to load payment details:", error);
    },
  });

  // Fetch customer data if payment data is available
  const { data: customer, isLoading: isLoadingCustomer } = useQuery<Customer>({
    queryKey: [`/api/customers/${payment?.customerId}`],
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

  const isLoading = isLoadingPayment || isLoadingCustomer;

  function getPaymentMethodBadge(method: string) {
    const styles: Record<string, string> = {
      cash: "bg-green-100 text-green-800 hover:bg-green-100",
      bank_transfer: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      check: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      card: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      upi: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
      other: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    };

    const labels: Record<string, string> = {
      cash: "Cash",
      bank_transfer: "Bank Transfer",
      check: "Check",
      card: "Card",
      upi: "UPI",
      other: "Other",
    };

    return <Badge className={styles[method] || ""}>{labels[method] || method}</Badge>;
  }

  function getPaymentTypeBadge(type: string) {
    const styles: Record<string, string> = {
      token_advance: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      starting_production: "bg-amber-100 text-amber-800 hover:bg-amber-100",
      final_payment: "bg-green-100 text-green-800 hover:bg-green-100",
      other: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    };

    const labels: Record<string, string> = {
      token_advance: "Token Advance",
      starting_production: "Starting Production",
      final_payment: "Final Payment",
      other: "Other",
    };

    return <Badge className={styles[type] || ""}>{labels[type] || type}</Badge>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load payment details. The payment may not exist or has been deleted.</p>
          </CardContent>
          <CardFooter>
            <Link href="/payments">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Payments
              </Button>
            </Link>
          </CardFooter>
        </Card>
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
        {payment && (
          <div className="flex gap-2">
            <PDFDownloadLink 
              document={<PaymentReceipt payment={payment} customer={customer} />}
              fileName={`Receipt-${payment.receiptNumber}.pdf`}
            >
              {({ loading }) => (
                <Button variant="outline">
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download Receipt
                </Button>
              )}
            </PDFDownloadLink>
            <Button 
              variant="default" 
              onClick={() => {
                // Instead of creating our own print view, we'll render the PDF and print it
                // We'll create a temporary iframe to hold the PDF renderer output
                const renderPDF = async () => {
                  try {
                    // Import react-pdf renderer
                    const { pdf } = await import('@react-pdf/renderer');
                    
                    // Generate the PDF blob from our PaymentReceipt component
                    const blob = await pdf(
                      <PaymentReceipt payment={payment} customer={customer} />
                    ).toBlob();

                    // Create a URL from the blob
                    const url = URL.createObjectURL(blob);
                    
                    // Open in a new window
                    const printWindow = window.open(url, '_blank');
                    
                    if (printWindow) {
                      // Wait for the PDF to load then print
                      printWindow.addEventListener('load', () => {
                        printWindow.print();
                        URL.revokeObjectURL(url);
                      });
                    } else {
                      URL.revokeObjectURL(url);
                      toast({
                        title: "Print Error",
                        description: "Unable to open print window. Please check your browser settings.",
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    console.error("Error generating PDF for print:", error);
                    toast({
                      title: "Print Error",
                      description: "Failed to generate the receipt for printing.",
                      variant: "destructive",
                    });
                  }
                };
                
                renderPDF();
              }}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : payment && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Receipt #{payment.receiptNumber}</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(payment.amount)}
                </span>
              </CardTitle>
              <CardDescription>
                Transaction ID: {payment.transactionId}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Method</h3>
                  <div>{getPaymentMethodBadge(payment.paymentMethod)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Type</h3>
                  <div>{getPaymentTypeBadge(payment.paymentType)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Date</h3>
                  <p>{format(new Date(payment.paymentDate), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Created On</h3>
                  <p>{format(new Date(payment.createdAt), 'dd MMM yyyy, h:mm a')}</p>
                </div>
              </div>

              <Separator />
              
              {payment.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Description</h3>
                  <p className="whitespace-pre-wrap">{payment.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {customer && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Name</h3>
                  <p className="font-medium">{customer.name}</p>
                </div>
                
                {customer.email && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                    <p>{customer.email}</p>
                  </div>
                )}
                
                {customer.phone && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Phone</h3>
                    <p>{customer.phone}</p>
                  </div>
                )}
                
                {customer.address && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Address</h3>
                    <p className="whitespace-pre-wrap">{customer.address}</p>
                  </div>
                )}
                
                <div className="pt-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/customers/view/${customer.id}`}>
                      View Customer Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}