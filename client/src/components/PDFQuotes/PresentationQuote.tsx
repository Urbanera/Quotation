import { forwardRef } from "react";
import { AppSettings, CompanySettings, QuotationWithDetails } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

// Import feature icons
import bestQualityImg from "@assets/Picture1.png";
import fastDeliveryImg from "@assets/Picture2.png";
import hassleFreeImg from "@assets/Picture3.png";
import ecoFriendlyImg from "@assets/Picture5.png";
import emiAvailableImg from "@assets/Picture6.png";

interface PresentationQuoteProps {
  quotation: QuotationWithDetails;
}

const PresentationQuote = forwardRef<HTMLDivElement, PresentationQuoteProps>(({ quotation }, ref) => {
  // Fetch company settings
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/settings/company"],
    retry: 1,
  });
  
  // Fetch app settings for presentation terms and conditions
  const { data: appSettings } = useQuery<AppSettings>({
    queryKey: ["/api/settings/app"],
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
    quotationNumber: quotation?.quotationNumber || `Q-${new Date().getFullYear()}-${String(quotation?.id || 0).padStart(4, '0')}`,
    createdAt: quotation?.createdAt || new Date(),
    totalSellingPrice: quotation?.totalSellingPrice || 0,
    globalDiscount: quotation?.globalDiscount || 0,
    installationHandling: quotation?.installationHandling || 0,
    gstPercentage: quotation?.gstPercentage || 0,
    customer: quotation?.customer || { 
      name: 'Customer',
      address: 'No address provided',
      email: 'No email provided',
      phone: 'No phone provided' 
    },
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

  return (
    <div ref={ref} className="max-w-5xl mx-auto bg-white" id="presentation-quote">
      {/* Cover Page */}
      <div className="h-[1100px] bg-white relative flex flex-col overflow-hidden" 
           style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
        {/* Logo Area */}
        <div className="p-10 text-center border-b-5 border-[#009245]" style={{ borderBottomWidth: '5px' }}>
          {companySettings?.logo && (
            <img 
              src={companySettings.logo} 
              alt={companyName} 
              className="h-20 mx-auto"
            />
          )}
          {!companySettings?.logo && (
            <h1 className="text-4xl font-bold">{companyName}</h1>
          )}
        </div>
        
        {/* Quotation Title */}
        <div className="bg-white p-6 text-center">
          <h2 className="text-2xl font-bold text-[#7A7A7A] uppercase">
            MODULAR INTERIOR QUOTATION
          </h2>
          <div className="w-full h-0.5 bg-[#D81F28] mt-2"></div>
        </div>
        
        {/* Cover Image - Using a background color instead of an image */}
        <div className="flex-1 bg-gray-100 relative">
          {/* Project Info Box */}
          <div className="absolute bottom-32 left-8 bg-white bg-opacity-95 p-6 w-2/3 border-l-4 border-[#D81F28]">
            <div className="mb-3 flex">
              <div className="font-bold text-[#009245] w-32">Client:</div>
              <div>{safeQuotation.customer.name}</div>
            </div>
            <div className="mb-3 flex">
              <div className="font-bold text-[#009245] w-32">Date:</div>
              <div>{formatDate(safeQuotation.createdAt)}</div>
            </div>
            <div className="flex">
              <div className="font-bold text-[#009245] w-32">Quotation #:</div>
              <div>{safeQuotation.quotationNumber}</div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-[#009245] text-white p-4 text-center">
          {companySettings?.website || "www.yourcompany.com"}
        </div>
      </div>
      
      {/* USPs Page */}
      <div className="h-[1100px] bg-white relative flex flex-col overflow-hidden"
           style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
        {/* Header */}
        <div className="bg-[#009245] text-white px-8 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Our USPs</h2>
          <div>Quotation #: {safeQuotation.quotationNumber}</div>
        </div>
        
        {/* USPs Content */}
        <div className="p-8 flex-1">
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>Best Price for Quality</div>
            </div>
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>Eco-Friendly</div>
            </div>
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>10 years' warranty and after sales services</div>
            </div>
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>Unique raw material</div>
            </div>
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>Italian designs</div>
            </div>
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>State of the art German technology</div>
            </div>
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>ACS Alloy coated steel kitchen carcass and sink</div>
            </div>
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>Transparent policies and pricing</div>
            </div>
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>Kitchen & Wardrobe delivered in 30 days</div>
            </div>
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>NO COST EMI options</div>
            </div>
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>Kitchen starting at 1,50,000</div>
            </div>
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>Wardrobe starting at 50,000</div>
            </div>
            <div className="flex items-start">
              <div className="text-[#D81F28] font-bold mr-3">➤</div>
              <div>Hassle - Free handover</div>
            </div>
          </div>
        </div>
        
        {/* Feature Images Row */}
        <div className="px-6 py-8 flex justify-between items-center">
          <div className="text-center">
            <img src={bestQualityImg} alt="Best Quality" className="h-20 mx-auto mb-2" />
            <p className="text-xs font-medium">BEST QUALITY</p>
          </div>
          <div className="text-center">
            <img src={fastDeliveryImg} alt="Fast Delivery" className="h-20 mx-auto mb-2" />
            <p className="text-xs font-medium">FAST DELIVERY</p>
          </div>
          <div className="text-center">
            <img src={hassleFreeImg} alt="Hassle Free" className="h-20 mx-auto mb-2" />
            <p className="text-xs font-medium">HASSLE FREE</p>
          </div>
          <div className="text-center">
            <img src={ecoFriendlyImg} alt="Eco Friendly" className="h-20 mx-auto mb-2" />
            <p className="text-xs font-medium">ECO FRIENDLY</p>
          </div>
          <div className="text-center">
            <img src={emiAvailableImg} alt="EMI Available" className="h-20 mx-auto mb-2" />
            <p className="text-xs font-medium">EMI AVAILABLE</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-[#009245] text-white p-4 text-center">
          {companySettings?.website || "www.yourcompany.com"}
        </div>
      </div>
      
      {/* Content Pages - Starting with Scope of Work */}
      <div className="bg-white p-8">
        {/* Simple Logo Header */}
        <div className="flex items-start pb-6 border-b border-gray-200" style={{ pageBreakAfter: 'avoid' }}>
          {companySettings?.logo && (
            <img 
              src={companySettings.logo} 
              alt={companyName} 
              className="h-10" 
            />
          )}
          {!companySettings?.logo && (
            <h1 className="text-xl font-bold text-[#009245]">{companyName}</h1>
          )}
        </div>

        {/* Scope of Work - Rooms Description */}
        <div className="mt-6 mb-10">
          <h3 className="text-xl font-bold mb-6 text-[#009245]" style={{ pageBreakAfter: 'avoid' }}>Scope of Work</h3>
          
          {/* Individual Rooms with Better Page Break Control */}
          {safeQuotation.rooms.map((room, index) => (
            <div 
              key={room.id} 
              className="mb-8 pb-6 border-b border-gray-200 last:border-b-0"
              style={{ pageBreakInside: 'avoid', pageBreakBefore: index !== 0 ? 'auto' : 'avoid' }}
            >
              <div className="bg-[#E6E6E6] p-4 border-b border rounded-t-lg">
                <h4 className="text-lg font-semibold text-[#009245]">{room.name || 'Unnamed Room'}</h4>
                {room.description && <p className="text-gray-600 mt-1">{room.description}</p>}
              </div>
              
              <div className="p-4 border border-t-0 rounded-b-lg">
                {/* Inclusions Section */}
                <div style={{ pageBreakInside: 'avoid' }}>
                  <h5 className="font-medium text-gray-800 mb-2">Inclusions:</h5>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {room.products && room.products.map((product) => (
                      <li key={product.id}>
                        {product.name}
                        {product.description && <span className="text-gray-500 text-sm"> - {product.description}</span>}
                      </li>
                    ))}
                    {room.accessories && room.accessories.map((accessory) => (
                      <li key={accessory.id}>
                        {accessory.name}
                        {accessory.description && <span className="text-gray-500 text-sm"> - {accessory.description}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Design References with Images */}
                {room.images && room.images.length > 0 && (
                  <div className="mt-6" style={{ pageBreakInside: 'avoid' }}>
                    <h5 className="font-medium text-gray-800 mb-3">Design References:</h5>
                    <div className="flex flex-wrap gap-4">
                      {room.images.map((image) => (
                        <div key={image.id} className="w-full max-w-xs mb-4">
                          <img 
                            src={image.path} 
                            alt={`Design for ${room.name || 'Room'}`} 
                            className="w-full h-auto object-contain rounded-md border border-gray-200" 
                            style={{ maxHeight: '200px' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Project Cost Summary */}
        <div className="my-10" style={{ pageBreakBefore: 'always', breakBefore: 'page', pageBreakInside: 'avoid' }}>
          <h3 className="text-xl font-bold mb-6 text-[#009245]">Project Cost Summary</h3>
          <div className="border rounded-md overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#E6E6E6]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#009245] uppercase tracking-wider">
                    Product Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#009245] uppercase tracking-wider">
                    Selling Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#009245] uppercase tracking-wider">
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
                          {(room.name || 'UNNAMED ROOM').toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(roomSellingPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
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
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      No rooms available for this quotation
                    </td>
                  </tr>
                )}
                
                <tr className="bg-[#E6E6E6]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Total Of All Items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(safeQuotation.totalSellingPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
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
                    {formatCurrency((safeQuotation.totalSellingPrice + totalWithHandling) * (safeQuotation.gstPercentage / 100))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(gstAmount)}
                  </td>
                </tr>
                    
                <tr className="bg-[#E6E6E6]">
                  <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                    Final Price
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 text-right">
                    {formatCurrency(safeQuotation.totalSellingPrice + totalWithHandling + 
                      (safeQuotation.totalSellingPrice + totalWithHandling) * (safeQuotation.gstPercentage / 100))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-[#D81F28] text-right">
                    {formatCurrency(finalPrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms and conditions */}
        <div className="mt-2" style={{ pageBreakBefore: 'always', breakBefore: 'page', pageBreakInside: 'avoid' }}>
          <h3 className="text-base font-bold mb-4 text-[#009245]">Terms & Conditions</h3>
          
          {appSettings?.presentationTermsAndConditions ? (
            // If custom terms are available in settings, use those with proper formatting
            <div className="text-[10px] leading-tight text-gray-600 whitespace-pre-line" style={{ 
              minHeight: '650px',
              columnCount: 1,
              columnGap: '20px',
              columnFill: 'auto'
            }}>
              {appSettings.presentationTermsAndConditions}
            </div>
          ) : (
            // Otherwise, use the quotation's terms or a default fallback
            quotation.terms ? (
              <div className="text-[10px] leading-tight text-gray-600 whitespace-pre-line" style={{ 
                minHeight: '650px',
                columnCount: 1,
                columnGap: '20px',
                columnFill: 'auto'
              }}>
                {quotation.terms}
              </div>
            ) : (
              <div style={{ 
                minHeight: '650px',
                columnCount: 1, 
                columnGap: '20px', 
                columnFill: 'auto'
              }}>
                <ul className="list-disc pl-4 text-[10px] leading-tight text-gray-600 space-y-2">
                  <li>Quotation is valid for 15 days from the date of issue.</li>
                  <li>50% advance payment required to start the work.</li>
                  <li>Delivery time: 4-6 weeks from date of order confirmation.</li>
                  <li>Warranty: 1 year on manufacturing defects.</li>
                  <li>Transportation and installation included in the price.</li>
                  <li>Colors may vary slightly from the samples shown.</li>
                </ul>
              </div>
            )
          )}
          
          {/* Footer - Moved inside the same container to keep on same page */}
          <div className="mt-4 pt-2 border-t text-center text-[10px] text-gray-500">
            <p>Thank you for your business!</p>
            <p>For any queries, please contact us at {companySettings?.email || "support@designquotes.com"} 
            {companySettings?.phone && ` or call ${companySettings.phone}`}</p>
            {companySettings?.website && <p>{companySettings.website}</p>}
          </div>
        </div>
      </div>
    </div>
  );
});

PresentationQuote.displayName = "PresentationQuote";

export default PresentationQuote;