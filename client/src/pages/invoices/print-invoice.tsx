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

  // Calculate total
  const discountedTotal = quotation.globalDiscount > 0
    ? Math.round(quotation.totalSellingPrice * (1 - quotation.globalDiscount / 100))
    : quotation.totalSellingPrice;
  
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
  
  // Calculate taxable amount
  const taxableAmount = discountedTotal + totalWithHandling;
  
  // Calculate CGST and SGST (assuming equal split of GST)
  const gstRate = quotation.gstPercentage || 0;
  const halfGstRate = gstRate / 2;
  const gstAmount = Math.round(taxableAmount * (gstRate / 100));
  const halfGstAmount = Math.round(gstAmount / 2);
  
  // Calculate final price
  const finalPrice = taxableAmount + gstAmount;

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
              <p className="text-gray-600">GST No: {companySettings?.gstNumber || 'Not Specified'}</p>
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
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Ship To:</h3>
              <p className="font-medium">{customer.name}</p>
              <p>{customer.address}</p>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-6">
            <table className="w-full border-collapse items-table">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border text-left py-2 px-3">S.No</th>
                  <th className="border text-left py-2 px-3">Description</th>
                  <th className="border text-right py-2 px-3">Qty</th>
                  <th className="border text-right py-2 px-3">Rate</th>
                  <th className="border text-right py-2 px-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotation.rooms.map((room, roomIndex) => (
                  <>
                    <tr key={`room-header-${room.id}`} className="bg-gray-50">
                      <td colSpan={5} className="border py-2 px-3 font-medium">
                        {room.name.toUpperCase()}
                      </td>
                    </tr>
                    
                    {/* Products for this room */}
                    {room.products.map((product, productIndex) => (
                      <tr key={`product-${product.id}`}>
                        <td className="border py-2 px-3">
                          {roomIndex + 1}.{productIndex + 1}
                        </td>
                        <td className="border py-2 px-3">
                          {product.name}
                          {product.description && (
                            <span className="text-gray-500 block text-sm">
                              {product.description}
                            </span>
                          )}
                        </td>
                        <td className="border py-2 px-3 text-right">{product.quantity}</td>
                        <td className="border py-2 px-3 text-right">{formatCurrency(product.sellingPrice)}</td>
                        <td className="border py-2 px-3 text-right">
                          {formatCurrency(product.quantity * product.sellingPrice)}
                        </td>
                      </tr>
                    ))}
                    
                    {/* Accessories for this room */}
                    {room.accessories.map((accessory, accessoryIndex) => (
                      <tr key={`accessory-${accessory.id}`}>
                        <td className="border py-2 px-3">
                          {roomIndex + 1}.{room.products.length + accessoryIndex + 1}
                        </td>
                        <td className="border py-2 px-3">
                          {accessory.name}
                          {accessory.description && (
                            <span className="text-gray-500 block text-sm">
                              {accessory.description}
                            </span>
                          )}
                        </td>
                        <td className="border py-2 px-3 text-right">{accessory.quantity}</td>
                        <td className="border py-2 px-3 text-right">{formatCurrency(accessory.sellingPrice)}</td>
                        <td className="border py-2 px-3 text-right">
                          {formatCurrency(accessory.quantity * accessory.sellingPrice)}
                        </td>
                      </tr>
                    ))}
                    
                    {/* Installation charges for this room */}
                    {room.installationCharges && room.installationCharges.map((charge, chargeIndex) => (
                      <tr key={`charge-${charge.id}`}>
                        <td className="border py-2 px-3">
                          {roomIndex + 1}.{room.products.length + room.accessories.length + chargeIndex + 1}
                        </td>
                        <td className="border py-2 px-3">
                          Installation: {charge.name || 'Installation Service'}
                        </td>
                        <td className="border py-2 px-3 text-right">1</td>
                        <td className="border py-2 px-3 text-right">{formatCurrency(charge.amount)}</td>
                        <td className="border py-2 px-3 text-right">{formatCurrency(charge.amount)}</td>
                      </tr>
                    ))}
                  </>
                ))}
                
                {/* Installation handling if any */}
                {quotation.installationHandling > 0 && (
                  <tr>
                    <td className="border py-2 px-3"></td>
                    <td className="border py-2 px-3">Installation Handling</td>
                    <td className="border py-2 px-3 text-right">1</td>
                    <td className="border py-2 px-3 text-right">{formatCurrency(quotation.installationHandling)}</td>
                    <td className="border py-2 px-3 text-right">{formatCurrency(quotation.installationHandling)}</td>
                  </tr>
                )}

                {/* Summary rows */}
                <tr>
                  <td colSpan={4} className="border py-2 px-3 text-right font-medium">
                    Subtotal
                  </td>
                  <td className="border py-2 px-3 text-right font-medium">
                    {formatCurrency(quotation.totalSellingPrice)}
                  </td>
                </tr>
                
                {quotation.globalDiscount > 0 && (
                  <tr>
                    <td colSpan={4} className="border py-2 px-3 text-right">
                      Discount ({quotation.globalDiscount}%)
                    </td>
                    <td className="border py-2 px-3 text-right">
                      -{formatCurrency(quotation.totalSellingPrice - discountedTotal)}
                    </td>
                  </tr>
                )}
                
                <tr>
                  <td colSpan={4} className="border py-2 px-3 text-right">
                    Taxable Amount
                  </td>
                  <td className="border py-2 px-3 text-right font-medium">
                    {formatCurrency(taxableAmount)}
                  </td>
                </tr>
                
                <tr>
                  <td colSpan={4} className="border py-2 px-3 text-right">
                    CGST @ {halfGstRate}%
                  </td>
                  <td className="border py-2 px-3 text-right">
                    {formatCurrency(halfGstAmount)}
                  </td>
                </tr>
                
                <tr>
                  <td colSpan={4} className="border py-2 px-3 text-right">
                    SGST @ {halfGstRate}%
                  </td>
                  <td className="border py-2 px-3 text-right">
                    {formatCurrency(halfGstAmount)}
                  </td>
                </tr>
                
                <tr className="bg-gray-100">
                  <td colSpan={4} className="border py-2 px-3 text-right font-bold">
                    TOTAL
                  </td>
                  <td className="border py-2 px-3 text-right font-bold">
                    {formatCurrency(finalPrice)}
                  </td>
                </tr>
              </tbody>
            </table>
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
              {appSettings?.invoiceTerms && appSettings.invoiceTerms.split('\n').map((term, i) => (
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
                    <td>{companySettings?.bankName || 'HDFC Bank'}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-1"><strong>Account No:</strong></td>
                    <td>{companySettings?.accountNumber || '50200012345678'}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-1"><strong>IFSC Code:</strong></td>
                    <td>{companySettings?.ifscCode || 'HDFC0004321'}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-1"><strong>Branch:</strong></td>
                    <td>{companySettings?.branch || 'Main Branch'}</td>
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