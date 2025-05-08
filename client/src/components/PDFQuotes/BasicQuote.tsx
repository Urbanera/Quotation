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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
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
    ? safeQuotation.totalSellingPrice * (1 - safeQuotation.globalDiscount / 100)
    : safeQuotation.totalSellingPrice;
  const gstAmount = (discountedTotal + totalWithHandling) * (safeQuotation.gstPercentage / 100);
  const finalPrice = discountedTotal + totalWithHandling + gstAmount;

  // Default company name if settings not loaded
  const companyName = companySettings?.name || "DesignQuotes";

  // Get quotation number
  const quotationNumber = quotation?.quotationNumber || `Q-${new Date().getFullYear()}-${String(quotation?.id || 0).padStart(4, '0')}`;

  return (
    <div ref={ref} className="max-w-4xl mx-auto bg-white p-8 print:p-2" id="basic-quote">
      {/* Header - avoid page break after header */}
      <div className="flex justify-between items-center mb-4 border-b border-[#009245] pb-3 avoid-break print:mb-2 print:pb-2">
        <div className="flex items-center">
          {companySettings?.logo && (
            <img src={companySettings.logo} alt={companyName} className="h-8 mr-2 print:h-6" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#009245] print:text-lg">{companyName}</h1>
            <p className="text-[#7A7A7A] print:text-xs">Interior Design Quotations</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-[#D81F28] print:text-lg">QUOTATION</h2>
          <p className="text-gray-600 print:text-xs">#{quotationNumber}</p>
          <p className="text-gray-600 print:text-xs">Date: {formatDate(safeQuotation.createdAt)}</p>
        </div>
      </div>

      {/* Client Information */}
      <div className="mb-4 grid grid-cols-2 gap-4 avoid-break print:mb-2 print:gap-2">
        <div>
          <h3 className="text-md font-semibold mb-1 text-[#009245] print:text-sm">From:</h3>
          <p className="font-semibold print:text-xs">{companyName}</p>
          <p className="print:text-xs">{companySettings?.address || ""}</p>
          <p className="print:text-xs">{companySettings?.phone || ""}</p>
          <p className="print:text-xs">{companySettings?.email || ""}</p>
        </div>
        <div>
          <h3 className="text-md font-semibold mb-1 text-[#009245] print:text-sm">To:</h3>
          {safeQuotation.customer ? (
            <>
              <p className="font-semibold print:text-xs">{safeQuotation.customer.name || 'N/A'}</p>
              <p className="print:text-xs">{safeQuotation.customer.address || 'N/A'}</p>
              <p className="print:text-xs">{safeQuotation.customer.email || 'N/A'}</p>
              <p className="print:text-xs">{safeQuotation.customer.phone || 'N/A'}</p>
            </>
          ) : (
            <p className="italic text-gray-500 print:text-xs">No customer information available</p>
          )}
        </div>
      </div>

      {/* Project Cost Summary */}
      <div className="mb-4 avoid-break print:mb-2">
        <h3 className="text-lg font-semibold mb-2 text-[#009245] print:text-sm print:mb-1">Project Cost Summary</h3>
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
            <thead className="bg-[#E6E6E6]">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-[#009245] uppercase tracking-wider print:px-2 print:py-1 print:text-[10px] border-b border-gray-200">
                  Product Description
                </th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-[#009245] uppercase tracking-wider print:px-2 print:py-1 print:text-[10px] border-b border-gray-200">
                  Selling Price
                </th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-[#009245] uppercase tracking-wider print:px-2 print:py-1 print:text-[10px] border-b border-gray-200">
                  {safeQuotation.globalDiscount > 0 
                    ? `Discounted Price (${safeQuotation.globalDiscount}%)` 
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
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 print:px-2 print:py-1 print:text-xs border-b border-gray-200">
                        {room.name ? room.name.toUpperCase() : 'UNNAMED ROOM'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right print:px-2 print:py-1 print:text-xs border-b border-gray-200">
                        {formatCurrency(roomSellingPrice)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right print:px-2 print:py-1 print:text-xs border-b border-gray-200">
                        {safeQuotation.globalDiscount > 0 ? (
                          <span className="text-[#D81F28] font-medium">
                            {formatCurrency(calculatedDiscountedPrice)}
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
                  <td colSpan={3} className="px-4 py-2 text-center text-sm text-gray-500 print:px-2 print:py-1 print:text-xs">
                    No rooms available for this quotation
                  </td>
                </tr>
              )}
              
              <tr className="bg-[#E6E6E6]">
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 print:px-2 print:py-1 print:text-xs border-b border-gray-200">
                  Total Of All Items
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right print:px-2 print:py-1 print:text-xs border-b border-gray-200">
                  {formatCurrency(safeQuotation.totalSellingPrice)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-right print:px-2 print:py-1 print:text-xs border-b border-gray-200">
                  {safeQuotation.globalDiscount > 0 ? (
                    <span className="text-[#D81F28] font-medium">
                      {formatCurrency(safeQuotation.totalSellingPrice * (1 - safeQuotation.globalDiscount / 100))}
                    </span>
                  ) : (
                    <>{formatCurrency(safeQuotation.totalSellingPrice)}</>
                  )}
                </td>
              </tr>
              
              {/* Installation and handling charges */}
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 print:px-2 print:py-1 print:text-xs border-b border-gray-200">
                  Installation and Handling
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right print:px-2 print:py-1 print:text-xs border-b border-gray-200">
                  {formatCurrency(totalWithHandling)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right print:px-2 print:py-1 print:text-xs border-b border-gray-200">
                  {formatCurrency(totalWithHandling)}
                </td>
              </tr>
              
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 print:px-2 print:py-1 print:text-xs border-b border-gray-200">
                  GST {safeQuotation.gstPercentage}%
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right print:px-2 print:py-1 print:text-xs border-b border-gray-200">
                  {formatCurrency((safeQuotation.totalSellingPrice + totalWithHandling) * (safeQuotation.gstPercentage / 100))}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right print:px-2 print:py-1 print:text-xs border-b border-gray-200">
                  {formatCurrency(gstAmount)}
                </td>
              </tr>
                  
              <tr className="bg-[#E6E6E6]">
                <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900 print:px-2 print:py-1 print:text-xs">
                  Final Price
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right print:px-2 print:py-1 print:text-xs">
                  {formatCurrency(safeQuotation.totalSellingPrice + totalWithHandling + 
                    (safeQuotation.totalSellingPrice + totalWithHandling) * (safeQuotation.gstPercentage / 100))}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-[#D81F28] text-right print:px-2 print:py-1 print:text-xs">
                  {formatCurrency(finalPrice)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Terms and conditions */}
      <div className="mb-3 avoid-break">
        <h3 className="text-lg font-semibold mb-1 text-[#009245] print:text-sm print:mb-0.5">Terms & Conditions</h3>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-0.5 print:pl-4 print:text-xs print:space-y-0">
          <li>Quotation is valid for 15 days from the date of issue.</li>
          <li>50% advance payment required to start the work.</li>
          <li>Delivery time: 4-6 weeks from date of order confirmation.</li>
          <li>Warranty: 1 year on manufacturing defects.</li>
          <li>Transportation and installation included in the price.</li>
          <li>Colors may vary slightly from the samples shown.</li>
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-3 border-t border-[#009245] text-center text-sm text-gray-500 avoid-break print:mt-3 print:pt-1 print:text-xs">
        <p>Thank you for your business!</p>
        <p>For any queries, please contact us at {companySettings?.email || ""} 
        {companySettings?.phone && ` or call ${companySettings.phone}`}</p>
        {companySettings?.website && <p>{companySettings.website}</p>}
      </div>
    </div>
  );
});

BasicQuote.displayName = "BasicQuote";

export default BasicQuote;