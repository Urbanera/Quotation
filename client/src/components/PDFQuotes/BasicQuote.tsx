import { forwardRef } from "react";
import { CompanySettings, QuotationWithDetails } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface BasicQuoteProps {
  quotation: QuotationWithDetails;
}

const BasicQuote = forwardRef<HTMLDivElement, BasicQuoteProps>(({ quotation }, ref) => {
  // Fetch company settings
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/settings/company"],
    retry: 1,
  });

  // Format currency
  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Safe access to quotation fields
  const safeQuotation = {
    id: quotation?.id || 0,
    createdAt: quotation?.createdAt || new Date(),
    totalSellingPrice: quotation?.totalSellingPrice || 0,
    globalDiscount: quotation?.globalDiscount || 0,
    installationHandling: quotation?.installationHandling || 0,
    gstPercentage: quotation?.gstPercentage || 0,
    customer: quotation?.customer || null,
    rooms: quotation?.rooms || []
  };
  
  console.log("BasicQuote - rooms data:", safeQuotation.rooms);

  // Calculate total installation charges safely
  const calculateInstallationCharges = () => {
    let totalInstallCharges = 0;
    
    if (Array.isArray(safeQuotation.rooms)) {
      for (const room of safeQuotation.rooms) {
        if (room?.installationCharges && Array.isArray(room.installationCharges)) {
          for (const charge of room.installationCharges) {
            totalInstallCharges += charge?.amount || 0;
          }
        }
      }
    }
    
    return totalInstallCharges + safeQuotation.installationHandling;
  };

  // Calculations
  const totalWithHandling = calculateInstallationCharges();
  const discountedTotal = safeQuotation.globalDiscount > 0
    ? Math.round(safeQuotation.totalSellingPrice * (1 - safeQuotation.globalDiscount / 100))
    : safeQuotation.totalSellingPrice;
  const gstAmount = Math.round((discountedTotal + totalWithHandling) * (safeQuotation.gstPercentage / 100));
  const finalPrice = discountedTotal + totalWithHandling + gstAmount;

  // Default company name if settings not loaded
  const companyName = companySettings?.name || "DesignQuotes";

  return (
    <div ref={ref} className="max-w-4xl mx-auto bg-white p-8 print:p-4" id="basic-quote">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div className="flex items-center">
          {companySettings?.logo && (
            <img src={companySettings.logo} alt={companyName} className="h-10 mr-3" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">{companyName}</h1>
            <p className="text-gray-500">Interior Design Quotations</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">QUOTATION</h2>
          <p className="text-gray-600">#{safeQuotation.id}</p>
          <p className="text-gray-600">Date: {formatDate(safeQuotation.createdAt)}</p>
        </div>
      </div>

      {/* Client Information */}
      <div className="mb-8 grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-md font-semibold mb-2 text-gray-700">From:</h3>
          <p className="font-semibold">{companyName}</p>
          <p>{companySettings?.address || "123 Design Street"}</p>
          <p>{companySettings?.phone || ""}</p>
          <p>{companySettings?.email || "design@example.com"}</p>
        </div>
        <div>
          <h3 className="text-md font-semibold mb-2 text-gray-700">To:</h3>
          {safeQuotation.customer ? (
            <>
              <p className="font-semibold">{safeQuotation.customer.name || 'N/A'}</p>
              <p>{safeQuotation.customer.address || 'N/A'}</p>
              <p>{safeQuotation.customer.email || 'N/A'}</p>
              <p>{safeQuotation.customer.phone || 'N/A'}</p>
            </>
          ) : (
            <p className="italic text-gray-500">No customer information available</p>
          )}
        </div>
      </div>

      {/* Project Cost Summary */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Project Cost Summary</h3>
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
                  {safeQuotation.globalDiscount > 0 
                    ? `Discounted Price (Incl. ${safeQuotation.globalDiscount}% Discount)` 
                    : "Discounted Price"}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(safeQuotation.rooms) && safeQuotation.rooms.length > 0 ? (
                safeQuotation.rooms.map((room) => {
                  if (!room) return null;
                  
                  // Calculate the discounted price with global discount applied
                  const roomSellingPrice = room.sellingPrice || 0;
                  const calculatedDiscountedPrice = safeQuotation.globalDiscount > 0
                    ? roomSellingPrice - (roomSellingPrice * safeQuotation.globalDiscount / 100)
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
                        {safeQuotation.globalDiscount > 0 ? (
                          <span className="text-indigo-600 font-medium">
                            {formatCurrency(Math.round(calculatedDiscountedPrice))}
                          </span>
                        ) : (
                          <>{formatCurrency(roomSellingPrice)}</>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                    No rooms available for this quotation
                  </td>
                </tr>
              )}
              
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Of All Items
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(safeQuotation.totalSellingPrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  {safeQuotation.globalDiscount > 0 ? (
                    <span className="text-indigo-600 font-medium">
                      {formatCurrency(Math.round(safeQuotation.totalSellingPrice * (1 - safeQuotation.globalDiscount / 100)))}
                    </span>
                  ) : (
                    <>{formatCurrency(safeQuotation.totalSellingPrice)}</>
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
              
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  GST {safeQuotation.gstPercentage}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(Math.round((safeQuotation.totalSellingPrice + totalWithHandling) * (safeQuotation.gstPercentage / 100)))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(gstAmount)}
                </td>
              </tr>
                  
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                  Final Price
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 text-right">
                  {formatCurrency(safeQuotation.totalSellingPrice + totalWithHandling + 
                    Math.round((safeQuotation.totalSellingPrice + totalWithHandling) * (safeQuotation.gstPercentage / 100)))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-indigo-600 text-right">
                  {formatCurrency(finalPrice)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Terms and conditions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Terms & Conditions</h3>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
          <li>Quotation is valid for 15 days from the date of issue.</li>
          <li>50% advance payment required to start the work.</li>
          <li>Delivery time: 4-6 weeks from date of order confirmation.</li>
          <li>Warranty: 1 year on manufacturing defects.</li>
          <li>Transportation and installation included in the price.</li>
          <li>Colors may vary slightly from the samples shown.</li>
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
        <p>Thank you for your business!</p>
        <p>For any queries, please contact us at {companySettings?.email || "support@designquotes.com"} 
        {companySettings?.phone && ` or call ${companySettings.phone}`}</p>
        {companySettings?.website && <p>{companySettings.website}</p>}
      </div>
    </div>
  );
});

BasicQuote.displayName = "BasicQuote";

export default BasicQuote;