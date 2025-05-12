import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { CustomerPayment, Customer, AppSettings, CompanySettings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PaymentReceipt, { StaticReceipt } from "@/components/payments/PaymentReceipt";
import { ArrowLeft, Download, Edit, Loader2, Printer, Mail } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

export default function ViewPaymentPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const id = location.split("/").pop();
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Fetch company and app settings for PDF generation
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [companyRes, appRes] = await Promise.all([
          fetch('/api/settings/company'),
          fetch('/api/settings/app')
        ]);
        
        if (companyRes.ok && appRes.ok) {
          const company = await companyRes.json();
          const app = await appRes.json();
          setCompanySettings(company);
          setAppSettings(app);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    
    fetchSettings();
  }, []);

  // Fetch payment data
  const { data: payment, isLoading: isLoadingPayment, error } = useQuery<CustomerPayment>({
    queryKey: [`/api/customer-payments/${id}`]
  });

  // Fetch customer data if payment data is available
  const { data: customer, isLoading: isLoadingCustomer } = useQuery<Customer>({
    queryKey: [`/api/customers/${payment?.customerId}`],
    enabled: !!payment?.customerId
  });

  // Email payment receipt mutation
  const emailReceiptMutation = useMutation({
    mutationFn: async (email: string) => {
      setSendingEmail(true);
      
      // Send email request to server
      const response = await apiRequest(
        "POST",
        `/api/payments/${id}/email`,
        { emailTo: email }
      );
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "The payment receipt has been sent via email successfully.",
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
      console.error("Failed to send payment receipt via email:", error);
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
    
    emailReceiptMutation.mutate(emailTo);
  };

  const isLoading = isLoadingPayment || isLoadingCustomer;

  function getPaymentMethodBadge(method: string) {
    const styles: Record<string, string> = {
      cash: "bg-green-100 text-green-800 hover:bg-green-100",
      check: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      card: "bg-purple-100 text-purple-800 hover:bg-purple-100",
      netbanking: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
      upi: "bg-cyan-100 text-cyan-800 hover:bg-cyan-100",
      wallet: "bg-pink-100 text-pink-800 hover:bg-pink-100",
      other: "bg-gray-100 text-gray-800 hover:bg-gray-100"
    };
    
    const labels: Record<string, string> = {
      cash: "Cash",
      check: "Check",
      card: "Card",
      netbanking: "Net Banking",
      upi: "UPI",
      wallet: "Wallet",
      other: "Other"
    };
    
    return <Badge className={styles[method] || ""}>{labels[method] || method}</Badge>;
  }
  
  function getPaymentTypeBadge(type: string) {
    const styles: Record<string, string> = {
      token_advance: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      starting_production: "bg-orange-100 text-orange-800 hover:bg-orange-100",
      final_payment: "bg-green-100 text-green-800 hover:bg-green-100",
      other: "bg-gray-100 text-gray-800 hover:bg-gray-100"
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
            <p>Failed to load payment details. Please try again later.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/payments">Back to Payments</Link>
            </Button>
          </CardContent>
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
            <Link href={`/payments/edit/${id}`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Receipt
              </Button>
            </Link>
            <Link href={`/payments/print-receipt/${id}`}>
              <Button variant="default">
                <Printer className="mr-2 h-4 w-4" />
                Print Receipt
              </Button>
            </Link>
            <Button 
              variant="outline"
              onClick={() => {
                // Pre-fill email with customer's email if available
                if (customer?.email) {
                  setEmailTo(customer.email);
                }
                setIsEmailDialogOpen(true);
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Email Receipt
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
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Method</span>
                      <span>{getPaymentMethodBadge(payment.paymentMethod)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span>{getPaymentTypeBadge(payment.paymentType || 'other')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payment Date</span>
                      <span>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Created On</span>
                      <span>{format(new Date(payment.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="whitespace-pre-wrap">{payment.description || 'No description provided.'}</p>
                  </div>
                </div>
              </div>
              
              {customer && (
                <div>
                  <Separator className="my-4" />
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Customer Information</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.email && (
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                {companySettings && customer && (
                  <Button asChild variant="outline" size="sm" className="ml-auto">
                    <PDFDownloadLink
                      document={
                        <StaticReceipt
                          payment={payment}
                          customer={customer}
                          companySettings={companySettings}
                          appSettings={appSettings || undefined}
                        />
                      }
                      fileName={`Receipt-${payment.receiptNumber}.pdf`}
                    >
                      {({ loading }) => (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          {loading ? "Generating PDF..." : "Download PDF"}
                        </>
                      )}
                    </PDFDownloadLink>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {customer && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
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
      
      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Receipt via Email</DialogTitle>
            <DialogDescription>
              Enter the recipient's email address to send the payment receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={sendingEmail}
            >
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}