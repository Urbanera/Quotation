import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { CustomerPayment, Customer, CompanySettings, AppSettings } from "@shared/schema";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertToWords, formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

// Add custom styles for printing
const printStyles = `
@media print {
  @page {
    size: A4;
    margin: 10mm;
  }
  
  body {
    background: white;
    font-size: 12pt;
    font-family: 'Arial', sans-serif;
    width: 100%;
  }
  
  .print\\:hidden,
  header,
  footer,
  nav,
  button,
  input,
  form,
  .search-bar,
  .no-print {
    display: none !important;
  }
  
  .print\\:p-6 {
    padding: 0 !important;
  }
  
  .container {
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 auto !important;
    box-shadow: none !important;
    border: none !important;
    transform: none;
  }
  
  /* Fix the width of the receipt content to fill the page */
  .flex {
    width: 100% !important;
  }
}

  .terms-conditions {
    margin-top: 8mm;
    padding: 4mm;
    border: 1px solid #ddd;
    background-color: #f9f9f9;
    border-radius: 5px;
  }

  .payment-highlight {
    font-weight: 600;
    font-size: 13pt;
    margin: 4mm 0;
    color: #333;
  }
  
  /* Adjust the logo position to match the reference */
  .logo-container {
    display: flex;
    justify-content: center !important;
    margin-right: 0 !important;
  }
}
`;

// Format payment method for display
const paymentMethods: Record<string, string> = {
  cash: 'CASH',
  bank_transfer: 'BANK TRANSFER',
  check: 'CHEQUE',
  card: 'CARD',
  upi: 'UPI',
  other: 'OTHER',
};

export default function PrintReceiptPage() {
  const [location, setLocation] = useLocation();

  // Extract payment ID from URL
  const id = location.split("/").pop();

  // Use React Query to fetch data with proper authentication
  const { data: payment, isLoading: paymentLoading, error: paymentError } = useQuery<CustomerPayment>({
    queryKey: [`/api/customer-payments/${id}`],
    enabled: !!id,
  });

  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: [`/api/customers/${payment?.customerId}`],
    enabled: !!payment?.customerId,
  });

  const { data: companySettings, isLoading: companyLoading } = useQuery<CompanySettings>({
    queryKey: ["/api/settings/company"],
  });

  const { data: appSettings, isLoading: appLoading } = useQuery<AppSettings>({
    queryKey: ["/api/settings/app"],
  });

  const isLoading = paymentLoading || customerLoading || companyLoading || appLoading;
  const error = paymentError;



  // Inject print styles
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement('style');
    styleElement.innerHTML = printStyles;
    document.head.appendChild(styleElement);
    
    // Clean up when component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Handle customer data - could be array or object
  const customerData = Array.isArray(customer) ? customer[0] : customer;

  if (error || !payment || !customerData || !companySettings) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/10 border border-destructive rounded-md p-4">
          <h2 className="font-semibold text-destructive">Error</h2>
          <p>{error?.message || 'Failed to load receipt data'}</p>
          <Link href="/payments">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Company info from settings
  const companyInfo = {
    name: companySettings.name || "URBAN ERA INTERIOR STUDIO",
    firmName: companySettings.firmName || null,
    address: companySettings.address || "Layout, No.plot Plaza, 48-11-13/2/1, Santhoshimatha Building, Visakhapatnam",
    mobile: companySettings.phone || "+91 98765 43210",
    email: companySettings.email || "sales.visakhapatnam@leccocucina.com",
    gstin: companySettings.taxId || "37AAVPG9038J2Z4",
    state: "37-Andhra Pradesh",
    logo: companySettings.logo || null
  };

  // Get description and terms from settings
  const description = payment.description || "";
  const termsAndConditions = appSettings?.receiptTermsAndConditions || 
                   "This receipt confirms the advance payment received for starting work on your project. This advance is non-refundable and will be deducted from the total project cost upon completion. By signing, the client agrees to these terms.";

  return (
    <div>
      {/* Non-printable header */}
      <div className="print:hidden container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/payments/view/${id}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Payment Details
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Receipt Preview</h1>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Printable receipt */}
      <div className="container mx-auto p-8 print:p-6 max-w-4xl bg-white shadow-md print:shadow-none border rounded-md print:border-none" style={{ width: '100%' }}>
        {/* Company Header */}
        <div className="flex justify-between mb-6 border-b pb-6 print:w-full">
          <div className="w-3/4">
            <h1 className="text-2xl font-bold">{companyInfo.firmName || companyInfo.name}</h1>
            <p className="text-sm">{companyInfo.address}</p>
            <p className="text-sm">Email: {companyInfo.email}</p>
            <p className="text-sm">GSTIN: {companyInfo.gstin}</p>
            <p className="text-sm">State: {companyInfo.state}</p>
          </div>
          <div className="w-1/4 flex justify-center items-center ms-start-logo-container">
            {companyInfo.logo ? (
              <img src={companyInfo.logo} alt="Company Logo" className="h-16 object-contain" />
            ) : (
              <div className="text-xl font-bold text-primary">{companyInfo.firmName || companyInfo.name}</div>
            )}
          </div>
        </div>

        {/* Receipt Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">RECEIPT</h2>
        </div>

        {/* Customer and Receipt Details */}
        <div className="flex mb-6">
          <div className="w-7/12 pr-6">
            <h3 className="font-semibold mb-2">Received From:</h3>
            <p className="uppercase font-medium">{customerData.name}</p>
            <p>{customerData.address?.split(',')[0] || ''}</p>
            <p>{customerData.address?.split(',').slice(1).join(',') || ''}</p>
            <p>State: {companyInfo.state}</p>
          </div>
          <div className="w-5/12">
            <h3 className="font-semibold mb-2">Receipt Details:</h3>
            <p>Receipt Number: {payment.receiptNumber}</p>
            <p>Date: {formatDate(payment.paymentDate, 'dd-MM-yyyy')}</p>
            <p>Mode: {paymentMethods[payment.paymentMethod]}</p>
          </div>
        </div>

        {/* Payment Highlight */}
        <div className="payment-highlight mb-5 pb-2 border-b border-gray-200">
          <p className="text-lg">Received amount of <span className="font-bold">₹ {payment.amount.toFixed(2)}</span> from <span className="font-semibold uppercase">{customerData.name}</span> as {payment.paymentType || 'advance payment'}</p>
        </div>

        {/* Amount in Words */}
        <div className="mb-4">
          <p className="font-semibold">Amount in Words: {convertToWords(payment.amount)}</p>
        </div>

        {/* Payment Method Details */}
        <div className="mb-4">
          <p>Payment Mode: {paymentMethods[payment.paymentMethod]} {payment.transactionId ? `(${payment.transactionId})` : ''}</p>
        </div>

        {/* Amount Display */}
        <div className="flex justify-end mb-6">
          <p className="text-2xl font-bold">₹ {payment.amount.toFixed(2)}</p>
        </div>

        {/* Description */}
        {description && (
          <div className="mb-5">
            <h3 className="font-semibold mb-2 text-gray-700">Description:</h3>
            <p className="text-sm whitespace-pre-line">{description}</p>
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="terms-conditions mb-16">
          <h3 className="font-semibold mb-2 text-gray-700">Terms & Conditions:</h3>
          <p className="text-sm whitespace-pre-line">{termsAndConditions}</p>
        </div>

        {/* Signature Section */}
        <div className="mt-16">
          <p className="text-sm text-right">For: {companyInfo.firmName || companyInfo.name}</p>
          <div className="h-16"></div>
          <p className="text-sm font-semibold text-right">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}