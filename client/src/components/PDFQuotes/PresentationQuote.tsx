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
  
  // Safe quotation check
  const safeQuotation = quotation || {
    id: 0,
    quotationNumber: 'N/A',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalSellingPrice: 0,
    totalDiscountedPrice: 0,
    globalDiscount: 0,
    gstPercentage: 0,
    gstAmount: 0,
    finalPrice: 0,
    totalInstallationCharges: 0,
    installationHandling: 0,
    customer: { name: 'N/A', id: 0, phone: '', email: '', stage: 'new' },
    rooms: [],
  };
  
  // Calculate installation charges from room-level installation charges
  const calculateInstallationCharges = () => {
    let totalInstallCharges = 0;
    
    // Only calculate if we have rooms with installation charges
    if (safeQuotation.rooms && Array.isArray(safeQuotation.rooms)) {
      for (const room of safeQuotation.rooms) {
        if (room.installationCharges && Array.isArray(room.installationCharges)) {
          for (const charge of room.installationCharges) {
            if (charge && typeof charge.amount === 'number') {
              totalInstallCharges += charge.amount;
            }
          }
        }
      }
    }
    
    return totalInstallCharges + safeQuotation.installationHandling;
  };

  // Calculations
  const totalWithHandling = calculateInstallationCharges();
  const discountPercentage = safeQuotation.globalDiscount || 0;
  const discountedTotal = discountPercentage > 0
    ? safeQuotation.totalSellingPrice * (1 - discountPercentage / 100)
    : safeQuotation.totalSellingPrice;
  const gstAmount = (discountedTotal + totalWithHandling) * (safeQuotation.gstPercentage / 100);
  const finalPrice = discountedTotal + totalWithHandling + gstAmount;

  // Default company name if settings not loaded
  const companyName = companySettings?.name || "DesignQuotes";

  return (
    <div ref={ref} className="max-w-5xl mx-auto bg-white" id="presentation-quote">
      {/* Cover Page - First Fixed Page */}
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
      
      {/* Second Page - Our Features - Second Fixed Page */}
      <div className="h-[1100px] bg-white flex flex-col overflow-hidden" 
           style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
        {/* Logo Area */}
        <div className="p-10 text-center">
          {companySettings?.logo && (
            <img 
              src={companySettings.logo} 
              alt={companyName} 
              className="h-16 mx-auto"
            />
          )}
          {!companySettings?.logo && (
            <h1 className="text-3xl font-bold">{companyName}</h1>
          )}
        </div>
        
        {/* Introduction */}
        <div className="px-10 mb-8">
          <h2 className="text-2xl font-bold text-[#009245] mb-4">About Us</h2>
          <p className="text-gray-700 leading-relaxed">
            {`${companyName} specializes in creating elegant, functional interior spaces tailored to your unique lifestyle and preferences. Our team of skilled designers and craftsmen work closely with you to transform your vision into reality, ensuring every detail is perfect.`}
          </p>
        </div>
        
        {/* Our Features */}
        <div className="px-10 mb-8">
          <h2 className="text-2xl font-bold text-[#009245] mb-4">Our Features</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="feature-item flex items-start">
              <div className="feature-icon mr-4">
                <img src={bestQualityImg} alt="Best Quality Materials" className="w-16 h-16 object-contain" />
              </div>
              <div className="feature-text">
                <h3 className="text-lg font-bold text-gray-800">Best Quality Materials</h3>
                <p className="text-gray-600">Premium raw materials and fittings to ensure durability and elegance.</p>
              </div>
            </div>
            
            <div className="feature-item flex items-start">
              <div className="feature-icon mr-4">
                <img src={fastDeliveryImg} alt="Fast Delivery" className="w-16 h-16 object-contain" />
              </div>
              <div className="feature-text">
                <h3 className="text-lg font-bold text-gray-800">Fast Delivery</h3>
                <p className="text-gray-600">Prompt project execution with strict timeline adherence.</p>
              </div>
            </div>
            
            <div className="feature-item flex items-start">
              <div className="feature-icon mr-4">
                <img src={hassleFreeImg} alt="Hassle-Free Installation" className="w-16 h-16 object-contain" />
              </div>
              <div className="feature-text">
                <h3 className="text-lg font-bold text-gray-800">Hassle-Free Installation</h3>
                <p className="text-gray-600">Expert installation team ensures minimal disruption to your routine.</p>
              </div>
            </div>
            
            <div className="feature-item flex items-start">
              <div className="feature-icon mr-4">
                <img src={ecoFriendlyImg} alt="Eco-Friendly Options" className="w-16 h-16 object-contain" />
              </div>
              <div className="feature-text">
                <h3 className="text-lg font-bold text-gray-800">Eco-Friendly Options</h3>
                <p className="text-gray-600">Sustainable materials that care for both your home and the environment.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Client Testimonial */}
        <div className="px-10 mb-8">
          <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-[#009245]">
            <h2 className="text-xl font-bold text-[#009245] mb-2">What Our Clients Say</h2>
            <p className="text-gray-700 italic">
              "The team's attention to detail and commitment to quality exceeded our expectations. Our home has been completely transformed!"
            </p>
            <p className="text-gray-600 mt-2">- Recent Client</p>
          </div>
        </div>
        
        {/* Feature icons in a row */}
        <div className="mt-auto mb-10 px-10">
          <div className="flex justify-around items-center">
            <img src={bestQualityImg} alt="Best Quality" className="h-16 object-contain" />
            <img src={fastDeliveryImg} alt="Fast Delivery" className="h-16 object-contain" />
            <img src={hassleFreeImg} alt="Hassle-Free" className="h-16 object-contain" />
            <img src={ecoFriendlyImg} alt="Eco-Friendly" className="h-16 object-contain" />
            <img src={emiAvailableImg} alt="EMI Available" className="h-16 object-contain" />
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-[#009245] text-white p-4 text-center mt-auto">
          {companySettings?.website || "www.yourcompany.com"}
        </div>
      </div>
      
      {/* Room Pages - One page per room */}
      {safeQuotation.rooms.map((room, index) => (
        <div 
          key={room.id} 
          className="h-[1100px] bg-white p-8 flex flex-col" 
          style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
        >
          {/* Room Header with Logo */}
          <div className="flex items-start justify-between mb-6 border-b border-gray-200 pb-4">
            {companySettings?.logo ? (
              <img 
                src={companySettings.logo} 
                alt={companyName} 
                className="h-10" 
              />
            ) : (
              <h1 className="text-xl font-bold text-[#009245]">{companyName}</h1>
            )}
            <div className="bg-[#E6E6E6] px-4 py-2 rounded-md">
              <h4 className="text-lg font-semibold text-[#009245]">{room.name || 'Unnamed Room'}</h4>
            </div>
          </div>
          
          {/* Room Content Area */}
          <div className="flex-1 overflow-auto">
            {/* Inclusions Section */}
            <div className="mb-6">
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
              <div className="mb-6">
                <h5 className="font-medium text-gray-800 mb-3">Design References:</h5>
                <div className="grid grid-cols-3 gap-4">
                  {room.images.map((image) => (
                    <div key={image.id} className="aspect-w-3 aspect-h-2 rounded-md overflow-hidden border border-gray-200">
                      <img 
                        src={image.path} 
                        alt={`Design for ${room.name || 'Room'}`} 
                        className="object-contain w-full h-full" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Room Pricing */}
            <div className="mb-6 mt-auto">
              <h5 className="font-medium text-gray-800 mb-2">Room Pricing:</h5>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between">
                  <span className="font-semibold">Base Price:</span>
                  <span>{formatCurrency(room.sellingPrice || 0)}</span>
                </div>
                {safeQuotation.globalDiscount > 0 && (
                  <div className="flex justify-between mt-2">
                    <span className="font-semibold">Discounted Price ({safeQuotation.globalDiscount}% Discount):</span>
                    <span className="text-[#D81F28]">
                      {formatCurrency((room.sellingPrice || 0) * (1 - safeQuotation.globalDiscount / 100))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Room Footer */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {safeQuotation.quotationNumber} | {formatDate(safeQuotation.createdAt)}
              </div>
              <div className="text-xs text-gray-500">
                Page {3 + index} of {3 + safeQuotation.rooms.length + 1 + 1}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Project Cost Summary Page */}
      <div className="h-[1100px] bg-white p-8 flex flex-col" 
           style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
        {/* Page Header with Logo */}
        <div className="flex items-start mb-6 border-b border-gray-200 pb-4">
          {companySettings?.logo ? (
            <img 
              src={companySettings.logo} 
              alt={companyName} 
              className="h-10" 
            />
          ) : (
            <h1 className="text-xl font-bold text-[#009245]">{companyName}</h1>
          )}
        </div>
        
        {/* Project Cost Summary Content */}
        <div className="flex-1">
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
                    {discountPercentage > 0 ? (
                      <span className="text-[#D81F28] font-medium">
                        {formatCurrency(discountedTotal)}
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
                    {formatCurrency((discountedTotal + totalWithHandling) * (safeQuotation.gstPercentage / 100))}
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
                    {formatCurrency(discountedTotal + totalWithHandling + gstAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Page Footer */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {safeQuotation.quotationNumber} | {formatDate(safeQuotation.createdAt)}
            </div>
            <div className="text-xs text-gray-500">
              Page {3 + safeQuotation.rooms.length} of {3 + safeQuotation.rooms.length + 1 + 1}
            </div>
          </div>
        </div>
      </div>
      
      {/* Terms and Conditions Page */}
      <div className="h-[1100px] bg-white p-8 flex flex-col">
        {/* Page Header with Logo */}
        <div className="flex items-start mb-6 border-b border-gray-200 pb-4">
          {companySettings?.logo ? (
            <img 
              src={companySettings.logo} 
              alt={companyName} 
              className="h-10" 
            />
          ) : (
            <h1 className="text-xl font-bold text-[#009245]">{companyName}</h1>
          )}
        </div>
        
        {/* Terms and Conditions Content */}
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-6 text-[#009245]">Terms & Conditions</h3>
          
          {appSettings?.presentationTermsAndConditions ? (
            <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
              {appSettings.presentationTermsAndConditions}
            </div>
          ) : (
            quotation.terms ? (
              <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                {quotation.terms}
              </div>
            ) : (
              <div>
                <ul className="list-disc pl-6 text-sm leading-relaxed text-gray-700 space-y-2">
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
        </div>
        
        {/* Page Footer */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xs text-gray-500">
              {safeQuotation.quotationNumber} | {formatDate(safeQuotation.createdAt)}
            </div>
            <div className="text-xs text-gray-500">
              Page {3 + safeQuotation.rooms.length + 1} of {3 + safeQuotation.rooms.length + 1 + 1}
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p>Thank you for your business!</p>
            <p className="mt-1">For any queries, please contact us at {companySettings?.email || "support@designquotes.com"} 
            {companySettings?.phone && ` or call ${companySettings.phone}`}</p>
            {companySettings?.website && <p className="mt-1">{companySettings.website}</p>}
          </div>
        </div>
      </div>
    </div>
  );
});

PresentationQuote.displayName = "PresentationQuote";

export default PresentationQuote;