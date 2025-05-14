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
    <div ref={ref} className="bg-white w-full mx-auto" id="presentation-quote">
      {/* Cover Page - First Fixed Page */}
      <div className="h-[1100px] bg-white relative flex flex-col overflow-hidden page-container" 
           style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
        {/* Logo Area */}
        <div className="p-10 text-center border-b-5 border-[#009245] logo-container" style={{ borderBottomWidth: '5px' }}>
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
      
      {/* Second Page - Configurable Content - Second Fixed Page */}
      <div className="h-[1100px] bg-white flex flex-col overflow-hidden page-container" 
           style={{ pageBreakInside: 'avoid', pageBreakAfter: 'always', breakAfter: 'page', position: 'relative' }}>
        {/* Logo Area */}
        <div className="p-10 text-center logo-container">
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
        
        {/* Configurable Content */}
        <div className="px-10 mb-8 flex-1 overflow-auto">
          {appSettings?.presentationSecondPageContent ? (
            <div
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: appSettings.presentationSecondPageContent }}
            />
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-[#009245] mb-4">About Us</h2>
              <p className="text-gray-700 leading-relaxed">
                {`${companyName} specializes in creating elegant, functional interior spaces tailored to your unique lifestyle and preferences. Our team of skilled designers and craftsmen work closely with you to transform your vision into reality, ensuring every detail is perfect.`}
              </p>
            </div>
          )}
        </div>
        
        {/* Page Footer */}
        <div className="mt-auto px-10 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {safeQuotation.quotationNumber} | {formatDate(safeQuotation.createdAt)}
            </div>
            <div className="text-xs text-gray-500">
              Page 2 of {safeQuotation.rooms.length + 4}
            </div>
          </div>
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
        <div style={{ 
          position: 'absolute', 
          bottom: '60px', 
          left: 0, 
          right: 0,
          padding: '0 10px'
        }}>
          <div className="flex justify-around items-center">
            <img src={bestQualityImg} alt="Best Quality" className="h-14 object-contain" />
            <img src={fastDeliveryImg} alt="Fast Delivery" className="h-14 object-contain" />
            <img src={hassleFreeImg} alt="Hassle-Free" className="h-14 object-contain" />
            <img src={ecoFriendlyImg} alt="Eco-Friendly" className="h-14 object-contain" />
            <img src={emiAvailableImg} alt="EMI Available" className="h-14 object-contain" />
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-[#009245] text-white p-4 text-center" style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0 
        }}>
          {companySettings?.website || "www.yourcompany.com"}
        </div>
      </div>
      
      {/* Room Pages - One page per room */}
      {safeQuotation.rooms.map((room, index) => (
        <div 
          key={room.id} 
          className="h-[1100px] bg-white p-8 flex flex-col page-container" 
          style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
        >
          {/* Room Header with Logo */}
          <div className="flex items-start justify-between mb-6 border-b border-gray-200 pb-4">
            <div className="logo-container">
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
            
            {/* Design References with Images - ADAPTIVE LAYOUT: 2 IMAGES PER ROW (≤6) OR 3 IMAGES PER ROW (>6) */}
            {room.images && room.images.length > 0 && (
              <div className="mb-6">
                <h5 className="font-medium text-gray-800 mb-3">Design References:</h5>
                {room.images.length <= 6 ? (
                  // For 6 or fewer images - 2 per row
                  <table style={{width: '100%'}} cellPadding={10} cellSpacing={0} border={0}>
                    <tbody>
                      {Array.from({ length: Math.ceil(room.images.length / 2) }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                          {/* First column */}
                          <td width="50%" align="center" valign="middle">
                            {room.images[rowIndex * 2] && (
                              <div style={{
                                width: '100%',
                                height: '200px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                              }}>
                                <img 
                                  src={room.images[rowIndex * 2].path} 
                                  alt={`Design ${rowIndex * 2 + 1}`}
                                  style={{
                                    maxHeight: '190px',
                                    maxWidth: '100%',
                                    objectFit: 'contain'
                                  }}
                                />
                              </div>
                            )}
                          </td>
                          
                          {/* Second column */}
                          <td width="50%" align="center" valign="middle">
                            {room.images[rowIndex * 2 + 1] && (
                              <div style={{
                                width: '100%',
                                height: '200px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                              }}>
                                <img 
                                  src={room.images[rowIndex * 2 + 1].path} 
                                  alt={`Design ${rowIndex * 2 + 2}`}
                                  style={{
                                    maxHeight: '190px',
                                    maxWidth: '100%',
                                    objectFit: 'contain'
                                  }}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  // For more than 6 images - 3 per row
                  <table style={{width: '100%'}} cellPadding={6} cellSpacing={0} border={0}>
                    <tbody>
                      {Array.from({ length: Math.ceil(room.images.length / 3) }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                          {/* First column */}
                          <td width="33.33%" align="center" valign="middle">
                            {room.images[rowIndex * 3] && (
                              <div style={{
                                width: '100%',
                                height: '180px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                              }}>
                                <img 
                                  src={room.images[rowIndex * 3].path} 
                                  alt={`Design ${rowIndex * 3 + 1}`}
                                  style={{
                                    maxHeight: '170px',
                                    maxWidth: '100%',
                                    objectFit: 'contain'
                                  }}
                                />
                              </div>
                            )}
                          </td>
                          
                          {/* Second column */}
                          <td width="33.33%" align="center" valign="middle">
                            {room.images[rowIndex * 3 + 1] && (
                              <div style={{
                                width: '100%',
                                height: '180px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                              }}>
                                <img 
                                  src={room.images[rowIndex * 3 + 1].path} 
                                  alt={`Design ${rowIndex * 3 + 2}`}
                                  style={{
                                    maxHeight: '170px',
                                    maxWidth: '100%',
                                    objectFit: 'contain'
                                  }}
                                />
                              </div>
                            )}
                          </td>
                          
                          {/* Third column */}
                          <td width="33.33%" align="center" valign="middle">
                            {room.images[rowIndex * 3 + 2] && (
                              <div style={{
                                width: '100%',
                                height: '180px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                              }}>
                                <img 
                                  src={room.images[rowIndex * 3 + 2].path} 
                                  alt={`Design ${rowIndex * 3 + 3}`}
                                  style={{
                                    maxHeight: '170px',
                                    maxWidth: '100%',
                                    objectFit: 'contain'
                                  }}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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
                Page {index + 3} of {safeQuotation.rooms.length + 4}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Project Cost Summary Page */}
      <div className="h-[1100px] bg-white p-8 flex flex-col page-container" 
           style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
        {/* Page Header with Logo */}
        <div className="flex items-start mb-6 border-b border-gray-200 pb-4">
          <div className="logo-container">
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {safeQuotation.rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(room.name || 'UNNAMED ROOM').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(room.sellingPrice || 0)}
                    </td>
                  </tr>
                ))}
                
                {/* Installation Charges if any */}
                {totalWithHandling > 0 && (
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      INSTALLATION CHARGES
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(totalWithHandling)}
                    </td>
                  </tr>
                )}
                
                {/* Subtotal */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    SUBTOTAL
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(safeQuotation.totalSellingPrice)}
                  </td>
                </tr>
                
                {/* Discount if applicable */}
                {discountPercentage > 0 && (
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      DISCOUNT ({discountPercentage}%)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#D81F28] text-right">
                      - {formatCurrency(safeQuotation.totalSellingPrice * (discountPercentage / 100))}
                    </td>
                  </tr>
                )}
                
                {/* GST if applicable */}
                {safeQuotation.gstPercentage > 0 && (
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      GST ({safeQuotation.gstPercentage}%)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(gstAmount)}
                    </td>
                  </tr>
                )}
                
                {/* Total */}
                <tr className="bg-[#E6E6E6]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#009245]">
                    TOTAL PRICE
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#009245] text-right">
                    {formatCurrency(finalPrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Removed payment terms as requested */}
        </div>
        
        {/* Page Footer */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {safeQuotation.quotationNumber} | {formatDate(safeQuotation.createdAt)}
            </div>
            <div className="text-xs text-gray-500">
              Page {safeQuotation.rooms.length + 3} of {safeQuotation.rooms.length + 4}
            </div>
          </div>
        </div>
      </div>
      
      {/* Terms and Conditions Page */}
      <div className="h-[1100px] bg-white p-8 flex flex-col page-container">
        {/* Page Header with Logo */}
        <div className="flex items-start mb-6 border-b border-gray-200 pb-4">
          <div className="logo-container">
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
        </div>
        
        {/* Terms and Conditions Content */}
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-6 text-[#009245]">Terms & Conditions</h3>
          
          {appSettings?.presentationTermsAndConditions ? (
            <div 
              className="text-sm leading-relaxed text-gray-700"
              dangerouslySetInnerHTML={{ __html: appSettings.presentationTermsAndConditions }}
            />
          ) : (
            <div className="text-sm leading-relaxed text-gray-700">
              <p className="mb-3">1. <strong>Scope of Work:</strong> {companyName} agrees to perform the production and services outlined in our individual quotation and this agreement according to the terms and conditions contained herein.</p>
              <p className="mb-3">2. <strong>Quotation Validity:</strong> This quotation is valid for 30 days from the date of issue. Prices and availability of materials are subject to change after this period.</p>
              <p className="mb-3">3. <strong>Measurement & Design:</strong> All product dimensions and designs are agreed upon in advance. Any changes after production begins may incur additional charges and delay delivery.</p>
              <p className="mb-3">4. <strong>Payment Terms:</strong> The payment schedule is as follows:<br />
                • 50% advance upon acceptance of quotation<br />
                • 40% upon delivery of materials<br />
                • 10% upon completion of installation</p>
              <p className="mb-3">5. <strong>Cancellation:</strong> In the event of cancellation after production has begun, the client shall be liable for costs incurred up to the point of cancellation, including materials, labor, and a 15% administration fee.</p>
              <p className="mb-3">6. <strong>Delivery:</strong> Standard delivery timeline is 6-8 weeks from confirmation of order unless otherwise specified. We're not responsible for delays due to circumstances beyond our control.</p>
              <p className="mb-3">7. <strong>Site Readiness:</strong> The installation site must be clean, accessible, and with electrical connections available. Additional charges may apply if our team needs to prepare the site.</p>
              <p className="mb-3">8. <strong>Warranty:</strong> All products come with a 1-year warranty against manufacturing defects. This excludes damage from misuse, normal wear and tear, or unauthorized modifications.</p>
              <p className="mb-3">9. <strong>Returns & Refunds:</strong> Custom-made products cannot be returned or refunded except in cases of manufacturing defects. Defective items will be repaired or replaced at our discretion.</p>
              <p className="mb-3">10. <strong>Ownership:</strong> All goods remain the property of {companyName} until payment has been received in full.</p>
            </div>
          )}
        </div>
        
        {/* Page Footer */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {safeQuotation.quotationNumber} | {formatDate(safeQuotation.createdAt)}
            </div>
            <div className="text-xs text-gray-500">
              Page {safeQuotation.rooms.length + 4} of {safeQuotation.rooms.length + 4}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PresentationQuote;
