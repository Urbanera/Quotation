import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { CustomerPayment, Customer, CompanySettings, AppSettings } from "@shared/schema";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertToWords, formatDate } from "@/lib/utils";

// Add custom styles for printing
const printStyles = `
@media print {
  @page {
    size: A4;
    margin: 15mm;
  }
  
  body {
    background: white;
    font-size: 12pt;
    font-family: 'Arial', sans-serif;
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
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    margin-top: 10mm !important;
    box-shadow: none !important;
    border: none !important;
    /* Apply 80% scale to match the user's preferred scale */
    transform: scale(0.8);
    transform-origin: top center;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<CustomerPayment | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Extract payment ID from URL
  const id = location.split("/").pop();

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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch payment data
        const paymentRes = await fetch(`/api/customer-payments/${id}`);
        if (!paymentRes.ok) {
          throw new Error('Failed to load payment');
        }
        const paymentData = await paymentRes.json();
        setPayment(paymentData);

        // Fetch customer data
        const customerRes = await fetch(`/api/customers/${paymentData.customerId}`);
        if (!customerRes.ok) {
          throw new Error('Failed to load customer');
        }
        const customerData = await customerRes.json();
        setCustomer(customerData);

        // Fetch settings
        const [companyRes, appRes] = await Promise.all([
          fetch('/api/settings/company'),
          fetch('/api/settings/app')
        ]);
        
        if (companyRes.ok && appRes.ok) {
          const company = await companyRes.json();
          const app = await appRes.json();
          setCompanySettings(company);
          setAppSettings(app);
        } else {
          throw new Error('Failed to load settings');
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !payment || !customer || !companySettings) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/10 border border-destructive rounded-md p-4">
          <h2 className="font-semibold text-destructive">Error</h2>
          <p>{error || 'Failed to load receipt data'}</p>
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
      <div className="container mx-auto p-8 print:p-6 max-w-4xl bg-white shadow-md print:shadow-none border rounded-md print:border-none">
        {/* Company Header */}
        <div className="flex justify-between mb-6 border-b pb-6">
          <div className="w-3/4">
            <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
            <p className="text-sm">{companyInfo.address}</p>
            <p className="text-sm">Email: {companyInfo.email}</p>
            <p className="text-sm">GSTIN: {companyInfo.gstin}</p>
            <p className="text-sm">State: {companyInfo.state}</p>
          </div>
          <div className="w-1/4 flex justify-end items-start logo-container">
            {companyInfo.logo ? (
              <img src={companyInfo.logo} alt="Company Logo" className="h-16 object-contain" />
            ) : (
              <div className="text-xl font-bold text-primary">LECCO CUCINA</div>
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
            <p className="uppercase font-medium">{customer.name}</p>
            <p>{customer.address.split(',')[0]}</p>
            <p>{customer.address.split(',').slice(1).join(',')}</p>
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
          <p className="text-lg">Received amount of <span className="font-bold">₹ {payment.amount.toFixed(2)}</span> from <span className="font-semibold uppercase">{customer.name}</span> as {payment.paymentType || 'advance payment'}</p>
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
          <p className="text-sm text-right">For: {companyInfo.name}</p>
          <div className="h-16"></div>
          <p className="text-sm font-semibold text-right">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}