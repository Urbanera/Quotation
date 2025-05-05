import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Invoice, Customer, CompanySettings, AppSettings, QuotationWithDetails } from "@shared/schema";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, convertToWords } from "@/lib/utils";

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
    box-shadow: none !important;
    border: none !important;
  }

  .terms-conditions {
    margin-top: 10mm;
    padding: 5mm;
    border: 1px solid #ddd;
    page-break-inside: avoid;
  }
  
  table {
    page-break-inside: avoid;
  }
  
  .items-table th,
  .items-table td {
    border: 1px solid #ddd;
    padding: 2mm;
  }
  
  .items-table th {
    background-color: #f0f0f0 !important;
    color: black !important;
    font-weight: bold;
  }
  
  .page-break {
    page-break-after: always;
  }
  
  .amount-in-words {
    font-style: italic;
    font-weight: bold;
  }
  
  .gst-section {
    margin-top: 5mm;
    page-break-inside: avoid;
  }
  
  .stamp-section {
    margin-top: 15mm;
    page-break-inside: avoid;
  }
}
`;

interface PrintInvoicePageProps {
  id?: string;
}

export default function PrintInvoicePage({ id: propId }: PrintInvoicePageProps) {
  const [location] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [quotation, setQuotation] = useState<QuotationWithDetails | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Extract invoice ID from props or URL
  const id = propId || location.split("/").pop();

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
        // Fetch invoice data
        const invoiceRes = await fetch(`/api/invoices/${id}`);
        if (!invoiceRes.ok) {
          throw new Error('Failed to load invoice');
        }
        const invoiceData = await invoiceRes.json();
        setInvoice(invoiceData);

        // Fetch quotation details with rooms
        const quotationRes = await fetch(`/api/quotations/${invoiceData.quotationId}/details`);
        if (!quotationRes.ok) {
          throw new Error('Failed to load quotation details');
        }
        const quotationData = await quotationRes.json();
        setQuotation(quotationData);
        
        // Fetch customer data
        const customerRes = await fetch(`/api/customers/${invoiceData.customerId}`);
        if (!customerRes.ok) {
          throw new Error('Failed to load customer');
        }
        const customerData = await customerRes.json();
        setCustomer(customerData);

        // Fetch company settings
        const companyRes = await fetch('/api/settings/company');
        if (companyRes.ok) {
          const companyData = await companyRes.json();
          setCompanySettings(companyData);
        }

        // Fetch app settings
        const appSettingsRes = await fetch('/api/settings/app');
        if (appSettingsRes.ok) {
          const appSettingsData = await appSettingsRes.json();
          setAppSettings(appSettingsData);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice || !quotation || !customer) {
    return (
      <div className="container mx-auto py-12 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
          <p className="font-bold">Error</p>
          <p>{error || 'Failed to load invoice data'}</p>
        </div>
        <Link href="/invoices">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate installation charges
  let totalInstallCharges = 0;
  
  // Loop through each room
  for (const room of quotation.rooms) {
    // If room has installation charges, add them all up
    if (room.installationCharges && room.installationCharges.length > 0) {
      for (const charge of room.installationCharges) {
        totalInstallCharges += charge.amount;
      }
    }
  }
  
  // Add handling charges
  const totalWithHandling = totalInstallCharges + quotation.installationHandling;
  
  // Calculate total with global discount - only apply to products/accessories, not installation
  let productAccessoryTotal = 0;
  
  // Calculate just the product and accessory total
  for (const room of quotation.rooms) {
    let roomProductAccessoryTotal = 0;
    
    // Add product prices
    for (const product of room.products) {
      roomProductAccessoryTotal += product.quantity * product.sellingPrice;
    }
    
    // Add accessory prices
    for (const accessory of room.accessories) {
      roomProductAccessoryTotal += accessory.quantity * accessory.sellingPrice;
    }
    
    productAccessoryTotal += roomProductAccessoryTotal;
  }
  
  // Calculate discount amount
  const discountAmount = quotation.globalDiscount > 0
    ? Math.round(productAccessoryTotal * (quotation.globalDiscount / 100))
    : 0;
  
  const discountedProductAccessoryTotal = productAccessoryTotal - discountAmount;
  
  // Calculate taxable amount (discounted products/accessories + installation)
  const taxableAmount = discountedProductAccessoryTotal + totalWithHandling;
  
  // Calculate GST
  const gstRate = quotation.gstPercentage || 0;
  const halfGstRate = gstRate / 2;
  const gstAmount = Math.round(taxableAmount * (gstRate / 100));
  const halfGstAmount = Math.round(gstAmount / 2);
  
  // Calculate final price
  const finalPrice = taxableAmount + gstAmount;
  
  // Total selling price without discount
  const totalSellingPriceWithInstallation = quotation.totalSellingPrice + totalWithHandling;
  
  // GST on total without discount
  const gstOnTotalWithoutDiscount = Math.round(totalSellingPriceWithInstallation * (gstRate / 100));
  
  // Final price without discount
  const finalPriceWithoutDiscount = totalSellingPriceWithInstallation + gstOnTotalWithoutDiscount;

  // Format date
  const invoiceDate = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
  const formattedDate = formatDate(invoiceDate);

  return (
    <div>
      {/* Non-printable header */}
      <div className="print:hidden container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/invoices/${id}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Invoice Details
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Invoice Preview</h1>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Printable Invoice */}
      <div className="container mx-auto bg-white shadow-md rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        <div className="p-6 print:p-0">
          {/* Company Header */}
          <div className="border-b pb-6 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{companySettings?.name || 'Interior Design Company'}</h1>
              <p className="text-gray-600">{companySettings?.address || '123 Design Street, Creative City'}</p>
              <p className="text-gray-600">{companySettings?.phone || '+1 234 567 8900'} | {companySettings?.email || 'info@designcompany.com'}</p>
              <p className="text-gray-600">GST No: {companySettings?.taxId || 'Not Specified'}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-800 mb-1">TAX INVOICE</h2>
              <p className="text-gray-600">Invoice #: {invoice.invoiceNumber}</p>
              <p className="text-gray-600">Date: {formattedDate}</p>
              <p className="text-gray-600">Quotation #: {quotation.quotationNumber}</p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
              <p className="font-medium">{customer.name}</p>
              <p>{customer.address}</p>
              <p>Phone: {customer.phone}</p>
              <p>Email: {customer.email}</p>
              {customer.gstNumber && <p>GST No: {customer.gstNumber}</p>}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Ship To:</h3>
              <p className="font-medium">{customer.name}</p>
              <p>{customer.address}</p>
            </div>
          </div>

          {/* Invoice Items - Match Quotation Format */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Project Details</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Selling Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {quotation.globalDiscount > 0 
                        ? `Discounted Price (Incl. ${quotation.globalDiscount}% Discount)` 
                        : "Discounted Price"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Rooms */}
                  {quotation.rooms.map((room) => {
                    // Calculate the room's selling price (products + accessories)
                    let roomSellingPrice = 0;
                    
                    // Add product prices
                    room.products.forEach(product => {
                      roomSellingPrice += product.quantity * product.sellingPrice;
                    });
                    
                    // Add accessory prices
                    room.accessories.forEach(accessory => {
                      roomSellingPrice += accessory.quantity * accessory.sellingPrice;
                    });
                    
                    // Calculate the discounted price with global discount applied
                    const calculatedDiscountedPrice = quotation.globalDiscount > 0
                      ? roomSellingPrice - (roomSellingPrice * quotation.globalDiscount / 100)
                      : roomSellingPrice;
                    
                    return (
                      <tr key={room.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {room.name ? room.name.toUpperCase() : 'UNNAMED ROOM'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(roomSellingPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {quotation.globalDiscount > 0 ? (
                            <span className="text-indigo-600 font-medium">
                              {formatCurrency(Math.round(calculatedDiscountedPrice))}
                            </span>
                          ) : (
                            <>{formatCurrency(roomSellingPrice)}</>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Total of All Items */}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Total Of All Items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(productAccessoryTotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      {quotation.globalDiscount > 0 ? (
                        <span className="text-indigo-600 font-medium">
                          {formatCurrency(discountedProductAccessoryTotal)}
                        </span>
                      ) : (
                        <>{formatCurrency(productAccessoryTotal)}</>
                      )}
                    </td>
                  </tr>
                  
                  {/* Installation and handling charges */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Installation and Handling
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totalWithHandling)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totalWithHandling)}
                    </td>
                  </tr>
                  
                  {/* GST */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      GST {gstRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(gstOnTotalWithoutDiscount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(gstAmount)}
                    </td>
                  </tr>
                      
                  {/* Final Price */}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                      Final Price
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 text-right">
                      {formatCurrency(finalPriceWithoutDiscount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-indigo-600 text-right">
                      {formatCurrency(finalPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mb-6 border-t border-b py-3 amount-in-words">
            <p><strong>Amount in Words:</strong> {convertToWords(finalPrice)} Only</p>
          </div>

          {/* Terms and Conditions */}
          <div className="mb-6 terms-conditions">
            <h3 className="text-lg font-semibold mb-2">Terms and Conditions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Payment is due within 15 days of invoice date.</li>
              <li>Goods once sold will not be taken back or exchanged.</li>
              <li>Interest @18% p.a. will be charged on delayed payments.</li>
              <li>Our responsibility ceases once the goods leave our premises.</li>
              <li>Subject to local jurisdiction only.</li>
              {appSettings?.defaultTermsAndConditions && appSettings.defaultTermsAndConditions.split('\n').map((term: string, i: number) => (
                <li key={i}>{term}</li>
              ))}
            </ol>
          </div>

          {/* Bank Details */}
          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Bank Details:</h3>
              <table className="text-sm">
                <tbody>
                  <tr>
                    <td className="pr-4 py-1"><strong>Bank Name:</strong></td>
                    <td>HDFC Bank</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-1"><strong>Account No:</strong></td>
                    <td>50200012345678</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-1"><strong>IFSC Code:</strong></td>
                    <td>HDFC0004321</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-1"><strong>Branch:</strong></td>
                    <td>Main Branch</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="text-right stamp-section">
              <p className="mb-12">For {companySettings?.name || 'Interior Design Company'}</p>
              <p className="mt-8 font-medium">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}