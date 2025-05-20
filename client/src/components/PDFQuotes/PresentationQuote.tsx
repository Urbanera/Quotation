import { forwardRef } from "react";
import { AppSettings, CompanySettings, QuotationWithDetails } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import "./presentationFixedFooter.css";

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
  
  // Filter room images to only include 3D images and sort them by order
  const get3DImagesForRoom = (room: any) => {
    if (!room.images || !Array.isArray(room.images)) {
      return [];
    }
    
    // Filter to only include 3D images
    const only3DImages = room.images.filter((img: any) => 
      img.type && img.type.toLowerCase().includes('3d')
    );
    
    // Sort by order first, then by type
    return [...only3DImages].sort((a, b) => {
      // First sort by order
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      // Then alphabetical by type
      return (a.type || "").localeCompare(b.type || "");
    });
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
      {/* Cover Page */}
      <div className="page-container" style={{ height: '1100px' }}>
        <div className="content-container">
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
          <div className="bg-gray-100 relative" style={{ height: '600px' }}>
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
        </div>
        
        {/* Footer */}
        <div className="footer-container bg-[#009245] text-white p-4 text-center">
          {companySettings?.website || "www.yourcompany.com"}
        </div>
      </div>
      
      {/* Second Page - Configurable Content */}
      <div className="page-container" style={{ height: '1100px' }}>
        <div className="content-container">
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
          <div className="px-10 mb-10">
            {appSettings?.presentationSecondPageContent ? (
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: appSettings.presentationSecondPageContent
                    .replace(/\${bestQualityImg}/g, bestQualityImg)
                    .replace(/\${fastDeliveryImg}/g, fastDeliveryImg)
                    .replace(/\${hassleFreeImg}/g, hassleFreeImg)
                    .replace(/\${ecoFriendlyImg}/g, ecoFriendlyImg)
                    .replace(/\${emiAvailableImg}/g, emiAvailableImg)
                }}
              />
            ) : (
              <>
                <div>
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
                <div className="mt-8 mb-8">
                  <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-[#009245]">
                    <h2 className="text-xl font-bold text-[#009245] mb-2">What Our Clients Say</h2>
                    <p className="text-gray-700 italic">
                      "The team's attention to detail and commitment to quality exceeded our expectations. Our home has been completely transformed!"
                    </p>
                    <p className="text-gray-600 mt-2">- Recent Client</p>
                  </div>
                </div>
                
                {/* Feature icons in a row */}
                <div className="flex justify-around items-center px-10 mt-8">
                  <img src={bestQualityImg} alt="Best Quality" className="h-14 object-contain" />
                  <img src={fastDeliveryImg} alt="Fast Delivery" className="h-14 object-contain" />
                  <img src={hassleFreeImg} alt="Hassle-Free" className="h-14 object-contain" />
                  <img src={ecoFriendlyImg} alt="Eco-Friendly" className="h-14 object-contain" />
                  <img src={emiAvailableImg} alt="EMI Available" className="h-14 object-contain" />
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="footer-container">
          <div className="px-10 py-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {safeQuotation.quotationNumber} | {formatDate(safeQuotation.createdAt)}
              </div>
              <div className="text-xs text-gray-500">
                Page 2 of {safeQuotation.rooms.length + 4}
              </div>
            </div>
          </div>
          <div className="bg-[#009245] text-white p-2 text-center">
            {companySettings?.website || "www.yourcompany.com"}
          </div>
        </div>
      </div>
      
      {/* Room Pages - One page per room */}
      {safeQuotation.rooms.map((room, index) => {
        // Get 3D images only for this room
        const images3D = get3DImagesForRoom(room);
        
        return (
          <div key={room.id} className="page-container" style={{ height: '1100px' }}>
            <div className="content-container p-8">
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
              <div>
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
                
                {/* Design References with Images - ONLY 3D IMAGES */}
                {images3D.length > 0 && (
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-800 mb-3">3D Design References:</h5>
                    {images3D.length <= 6 ? (
                      // For 6 or fewer images - 2 per row
                      <table style={{width: '100%'}} cellPadding={10} cellSpacing={0} border={0}>
                        <tbody>
                          {Array.from({ length: Math.ceil(images3D.length / 2) }).map((_, rowIndex) => (
                            <tr key={rowIndex}>
                              {/* First column */}
                              <td width="50%" align="center" valign="middle">
                                {images3D[rowIndex * 2] && (
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
                                      src={images3D[rowIndex * 2].path} 
                                      alt={`${room.name} - ${images3D[rowIndex * 2].type || 'Design'}`}
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
                                {images3D[rowIndex * 2 + 1] && (
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
                                      src={images3D[rowIndex * 2 + 1].path} 
                                      alt={`${room.name} - ${images3D[rowIndex * 2 + 1].type || 'Design'}`}
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
                          {Array.from({ length: Math.ceil(images3D.length / 3) }).map((_, rowIndex) => (
                            <tr key={rowIndex}>
                              {/* First column */}
                              <td width="33.33%" align="center" valign="middle">
                                {images3D[rowIndex * 3] && (
                                  <div style={{
                                    width: '100%',
                                    height: '160px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                  }}>
                                    <img 
                                      src={images3D[rowIndex * 3].path} 
                                      alt={`${room.name} - ${images3D[rowIndex * 3].type || 'Design'}`}
                                      style={{
                                        maxHeight: '150px',
                                        maxWidth: '100%',
                                        objectFit: 'contain'
                                      }}
                                    />
                                  </div>
                                )}
                              </td>
                              
                              {/* Second column */}
                              <td width="33.33%" align="center" valign="middle">
                                {images3D[rowIndex * 3 + 1] && (
                                  <div style={{
                                    width: '100%',
                                    height: '160px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                  }}>
                                    <img 
                                      src={images3D[rowIndex * 3 + 1].path} 
                                      alt={`${room.name} - ${images3D[rowIndex * 3 + 1].type || 'Design'}`}
                                      style={{
                                        maxHeight: '150px',
                                        maxWidth: '100%',
                                        objectFit: 'contain'
                                      }}
                                    />
                                  </div>
                                )}
                              </td>
                              
                              {/* Third column */}
                              <td width="33.33%" align="center" valign="middle">
                                {images3D[rowIndex * 3 + 2] && (
                                  <div style={{
                                    width: '100%',
                                    height: '160px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                  }}>
                                    <img 
                                      src={images3D[rowIndex * 3 + 2].path} 
                                      alt={`${room.name} - ${images3D[rowIndex * 3 + 2].type || 'Design'}`}
                                      style={{
                                        maxHeight: '150px',
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
                <div className="pt-6 border-t border-gray-200 mb-10">
                  <div className="flex justify-between">
                    <span className="font-semibold">Base Price:</span>
                    <span>{formatCurrency(room.sellingPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="footer-container">
              <div className="px-10 py-2 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {safeQuotation.quotationNumber} | {formatDate(safeQuotation.createdAt)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Page {index + 3} of {safeQuotation.rooms.length + 4}
                  </div>
                </div>
              </div>
              <div className="bg-[#009245] text-white p-2 text-center">
                {companySettings?.website || "www.yourcompany.com"}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Summary Page */}
      <div className="page-container" style={{ height: '1100px' }}>
        <div className="content-container p-8">
          {/* Logo and Quotation Number */}
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
              <h4 className="text-lg font-semibold text-[#009245]">Quotation #{safeQuotation.quotationNumber}</h4>
            </div>
          </div>
          
          {/* Content Area */}
          <div>
            <h2 className="text-xl font-bold text-[#009245] mb-4">Quotation Summary</h2>
            
            {/* Price Summary Table */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-3 text-left border border-gray-200">Room</th>
                    <th className="py-2 px-3 text-right border border-gray-200">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {safeQuotation.rooms.map(room => (
                    <tr key={room.id} className="border-b border-gray-200">
                      <td className="py-2 px-3 border border-gray-200">{room.name}</td>
                      <td className="py-2 px-3 text-right border border-gray-200">{formatCurrency(room.sellingPrice)}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-3 border border-gray-200 font-medium">Base Total</td>
                    <td className="py-2 px-3 text-right border border-gray-200 font-medium">{formatCurrency(safeQuotation.totalSellingPrice)}</td>
                  </tr>
                  {safeQuotation.globalDiscount > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="py-2 px-3 border border-gray-200">Discount ({safeQuotation.globalDiscount}%)</td>
                      <td className="py-2 px-3 text-right border border-gray-200 text-red-600">
                        -{formatCurrency(safeQuotation.totalSellingPrice * (safeQuotation.globalDiscount / 100))}
                      </td>
                    </tr>
                  )}
                  {totalWithHandling > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="py-2 px-3 border border-gray-200">Installation & Handling</td>
                      <td className="py-2 px-3 text-right border border-gray-200">{formatCurrency(totalWithHandling)}</td>
                    </tr>
                  )}
                  {safeQuotation.gstPercentage > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="py-2 px-3 border border-gray-200">GST ({safeQuotation.gstPercentage}%)</td>
                      <td className="py-2 px-3 text-right border border-gray-200">{formatCurrency(gstAmount)}</td>
                    </tr>
                  )}
                  <tr className="bg-gray-50">
                    <td className="py-3 px-3 border border-gray-200 font-bold">Total Amount</td>
                    <td className="py-3 px-3 text-right border border-gray-200 font-bold text-[#009245]">{formatCurrency(finalPrice)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="footer-container">
          <div className="px-10 py-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {safeQuotation.quotationNumber} | {formatDate(safeQuotation.createdAt)}
              </div>
              <div className="text-xs text-gray-500">
                Page {safeQuotation.rooms.length + 4} of {safeQuotation.rooms.length + 4}
              </div>
            </div>
          </div>
          <div className="bg-[#009245] text-white p-2 text-center">
            {companySettings?.website || "www.yourcompany.com"}
          </div>
        </div>
      </div>
    </div>
  );
});

export default PresentationQuote;