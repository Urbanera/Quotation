import React, { useMemo } from 'react';
import { formatCurrency } from "@/lib/calculations";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import LandscapeQuote from "@/components/PDFQuotes/LandscapeQuote";
import { QuotationWithDetails, CompanySettings, AppSettings } from "@shared/schema";

// Format date function
const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

interface LandscapeQuotePreviewProps {
  quotation: QuotationWithDetails;
  companySettings: CompanySettings;
  appSettings: AppSettings;
  id: string;
}

const LandscapeQuotePreview: React.FC<LandscapeQuotePreviewProps> = ({ 
  quotation, 
  companySettings, 
  appSettings,
  id
}) => {
  // Sort room images by order or type
  const sortedRooms = useMemo(() => {
    if (!quotation.rooms) return [];
    
    return quotation.rooms.filter(room => room && room.included).map(room => {
      const sortedImages = [...(room.images || [])].sort((a, b) => {
        // First sort by order
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        
        // Then prioritize 3D views over 2D views
        const aIs3D = (a.type || "").toLowerCase().includes("3d");
        const bIs3D = (b.type || "").toLowerCase().includes("3d");
        
        if (aIs3D && !bIs3D) return -1;
        if (!aIs3D && bIs3D) return 1;
        
        // Finally alphabetical by type
        return (a.type || "").localeCompare(b.type || "");
      });
      
      return {
        ...room,
        images: sortedImages
      };
    });
  }, [quotation.rooms]);

  // Calculate page counts for footer
  const getTotalPages = () => {
    let pageCount = 2; // Cover page + Features page
    
    // Count room name pages and image pages
    sortedRooms.forEach(room => {
      pageCount += 1; // Room name page
      pageCount += room.images?.length || 0; // Image pages
    });
    
    // Add summary page
    pageCount += 1;
    
    return pageCount;
  };
  
  const totalPages = getTotalPages();
  
  // Generate footer with page number and company website
  const renderFooter = (pageNumber: number) => (
    <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-500 border-t pt-2">
      <div className="flex justify-between px-8">
        <span>Page {pageNumber} of {totalPages}</span>
        <span>{companySettings?.website || ""}</span>
      </div>
    </div>
  );
  
  return (
    <div className="flex flex-col">
      <div className="overflow-auto mb-6" style={{ maxHeight: '70vh' }}>
        {/* Cover Page Preview */}
        <div className="border rounded-lg p-8 mb-8 bg-white" style={{ width: '100%', aspectRatio: '1.77 / 1', position: 'relative' }}>
          <div className="absolute top-0 right-0 bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-bl-md">
            Page 1 - Cover
          </div>
          <div className="flex flex-col h-full">
            {/* Logo Area with border */}
            <div className="text-center p-6 border-b-4 border-[#009245] mb-6">
              <h1 className="text-2xl font-bold text-gray-800">{companySettings?.name || "DesignQuotes"}</h1>
            </div>
            
            {/* Quotation Title */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-[#7A7A7A] tracking-wide">MODULAR INTERIOR QUOTATION</h2>
              <div className="w-full h-0.5 bg-[#D81F28] mt-2"></div>
            </div>
            
            {/* Spacer for center positioning */}
            <div className="flex-grow"></div>
            
            {/* Project Info Box */}
            <div className="bg-white bg-opacity-95 p-6 w-3/5 border-l-4 border-[#D81F28] mb-4">
              <div className="mb-3 flex">
                <div className="font-bold text-[#009245] w-28">Client:</div>
                <div>{quotation?.customer?.name || "Customer Name"}</div>
              </div>
              <div className="mb-3 flex">
                <div className="font-bold text-[#009245] w-28">Date:</div>
                <div>{formatDate(quotation?.createdAt || new Date())}</div>
              </div>
              <div className="flex">
                <div className="font-bold text-[#009245] w-28">Quotation #:</div>
                <div>{quotation?.quotationNumber || "QT-0000"}</div>
              </div>
            </div>
            
            {/* Green Footer */}
            <div className="bg-[#009245] text-white p-3 text-center -m-8 mt-4">
              <span className="text-sm">{companySettings?.website || "www.yourcompany.com"}</span>
            </div>
          </div>
          {renderFooter(1)}
        </div>
        
        {/* Features Page Preview */}
        <div className="border rounded-lg p-8 mb-8 bg-white" style={{ width: '100%', aspectRatio: '1.77 / 1', position: 'relative' }}>
          <div className="absolute top-0 right-0 bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-bl-md">
            Page 2 - Features
          </div>
          <div className="flex flex-col h-full">
            {/* Logo Area */}
            <div className="text-center p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-800">{companySettings?.name || "DesignQuotes"}</h1>
            </div>
            
            {/* Features Content */}
            <div className="mb-6">
              {appSettings?.landscapeSecondPageContent ? (
                <div className="text-sm text-gray-700 space-y-2">
                  <div dangerouslySetInnerHTML={{ __html: appSettings.landscapeSecondPageContent }} />
                </div>
              ) : appSettings?.presentationSecondPageContent ? (
                <div className="text-sm text-gray-700 space-y-2">
                  <div dangerouslySetInnerHTML={{ __html: appSettings.presentationSecondPageContent }} />
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-bold text-[#009245] mb-4">Our Features</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-bold text-gray-800 mb-2">Best Quality Materials</h5>
                      <p className="text-sm text-gray-600">Premium raw materials and fittings to ensure durability and elegance.</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-bold text-gray-800 mb-2">Fast Delivery</h5>
                      <p className="text-sm text-gray-600">Prompt project execution with strict timeline adherence.</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-bold text-gray-800 mb-2">Hassle-Free Installation</h5>
                      <p className="text-sm text-gray-600">Expert installation team ensures minimal disruption to your routine.</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-bold text-gray-800 mb-2">Eco-Friendly Options</h5>
                      <p className="text-sm text-gray-600">Sustainable materials that care for both your home and the environment.</p>
                    </div>
                  </div>
                  
                  {/* Client Testimonial */}
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg border-l-4 border-[#009245]">
                    <h5 className="font-bold text-[#009245] mb-2">What Our Clients Say</h5>
                    <p className="text-sm text-gray-600 italic">
                      "The team's attention to detail and commitment to quality exceeded our expectations. Our home has been completely transformed!"
                    </p>
                    <p className="text-xs text-gray-500 mt-2">- Recent Client</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Green Footer */}
            <div className="bg-[#009245] text-white p-3 text-center -m-8 mt-auto">
              <span className="text-sm">{companySettings?.website || "www.yourcompany.com"}</span>
            </div>
          </div>
          {renderFooter(2)}
        </div>
        
        {/* Room Images - Room name page followed by image pages */}
        {sortedRooms.map((room, roomIndex) => {
          const roomPages = [];
          let currentPageNumber = 3; // Start after cover and features pages
          
          // Calculate page number for this room
          for (let i = 0; i < roomIndex; i++) {
            currentPageNumber += 1; // Room name page
            currentPageNumber += sortedRooms[i].images?.length || 0; // Image pages
          }
          
          // Add room name page
          roomPages.push(
            <div 
              key={`room-${roomIndex}`} 
              className="border rounded-lg p-8 mb-8 bg-white" 
              style={{ width: '100%', aspectRatio: '1.77 / 1', position: 'relative' }}
            >
              <div className="absolute top-0 right-0 bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-bl-md">
                Page {currentPageNumber} - {room.name}
              </div>
              
              <div className="flex flex-col h-full">
                <div className="flex justify-between mb-4 mt-6 ml-6">
                  <div className="w-2/3">
                    <h3 className="text-lg font-bold text-[#009245]">
                      {companySettings?.name || "DesignQuotes"}
                    </h3>
                  </div>
                  <div className="w-1/4 text-right mr-6">
                    {companySettings?.logo && (
                      <img 
                        src={companySettings.logo} 
                        alt={companySettings.name}
                        className="w-[120px] object-contain ml-auto" 
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  <h2 className="text-4xl font-bold text-[#009245] mb-4">
                    {room.name}
                  </h2>
                  {room.description && (
                    <p className="text-lg text-gray-700 text-center max-w-2xl leading-relaxed px-8">
                      {room.description}
                    </p>
                  )}
                </div>
              </div>
              {renderFooter(currentPageNumber)}
            </div>
          );
          currentPageNumber++;
          
          // Add image pages for this room
          if (room.images) {
            room.images.forEach((image, imageIndex) => {
              roomPages.push(
                <div 
                  key={`${roomIndex}-${imageIndex}`} 
                  className="border rounded-lg p-8 mb-8 bg-white" 
                  style={{ width: '100%', aspectRatio: '1.77 / 1', position: 'relative' }}
                >
                  <div className="absolute top-0 right-0 bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-bl-md">
                    Page {currentPageNumber} - {room.name}
                  </div>
                  
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between mb-4 mt-6 ml-6">
                      <div className="w-2/3">
                        <h3 className="text-lg font-bold text-[#009245]">
                          {room.name} - {image.type || "Room Image"}
                        </h3>
                      </div>
                      <div className="w-1/4 text-right mr-6">
                        {companySettings?.logo && (
                          <img 
                            src={companySettings.logo} 
                            alt={companySettings.name}
                            className="w-[120px] object-contain ml-auto" 
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-grow flex items-center justify-center mb-4 overflow-hidden" 
                         style={{ height: '380px', width: '95%', margin: 'auto', marginLeft: '30px', marginRight: '30px', marginTop: '20px', marginBottom: '40px' }}>
                      <img 
                        src={image.path} 
                        alt={`${room.name} - ${image.type || "Image"}`} 
                        className="object-contain border shadow-sm" 
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </div>
                  {renderFooter(currentPageNumber)}
                </div>
              );
              currentPageNumber++;
            });
          }
          
          return roomPages;
        }).flat()}
        
        {/* Summary Page - Project Cost Summary */}
        <div className="border rounded-lg p-8 mb-8 bg-white" style={{ width: '100%', aspectRatio: '1.77 / 1', position: 'relative' }}>
          <div className="absolute top-0 right-0 bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-bl-md">
            Project Cost Summary
          </div>
          
          <div className="flex flex-col h-full">
            <div className="flex justify-between mb-4 mt-6 ml-6 mr-6">
              <div className="w-2/3">
                <h3 className="text-xl font-bold text-[#009245] mb-4">Project Cost Summary</h3>
              </div>
              <div className="w-1/4 text-right">
                {companySettings?.logo && (
                  <img 
                    src={companySettings.logo} 
                    alt={companySettings.name}
                    className="w-[120px] object-contain ml-auto" 
                  />
                )}
              </div>
            </div>
            
            <div className="overflow-auto mt-4 mb-6 ml-6 mr-6">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
                {/* Table Header - matching basic and presentation quotes exactly */}
                <thead className="bg-[#E6E6E6]">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-[#009245] uppercase tracking-wider border-b border-gray-200">
                      S.No
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-[#009245] uppercase tracking-wider border-b border-gray-200">
                      Product Description
                    </th>
                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-[#009245] uppercase tracking-wider border-b border-gray-200">
                      Selling Price
                    </th>
                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-[#009245] uppercase tracking-wider border-b border-gray-200">
                      {quotation.globalDiscount > 0 
                        ? `Discounted Price (${quotation.globalDiscount}%)` 
                        : "Discounted Price"}
                    </th>
                  </tr>
                </thead>
                
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Room Rows */}
                  {sortedRooms.map((room, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center border-b border-gray-200">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-200">
                        {room.name ? room.name.toUpperCase() : 'UNNAMED ROOM'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right border-b border-gray-200">
                        {formatCurrency(room.sellingPrice || 0)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 text-right border-b border-gray-200">
                        {formatCurrency((room.sellingPrice || 0) * (1 - quotation.globalDiscount / 100))}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr className="bg-gray-50 font-medium">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center border-b border-gray-200"></td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                      Total Of All Items
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right border-b border-gray-200">
                      {formatCurrency(quotation.totalSellingPrice)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 text-right border-b border-gray-200">
                      {formatCurrency(quotation.totalSellingPrice * (1 - quotation.globalDiscount / 100))}
                    </td>
                  </tr>
                  
                  {/* Installation Row */}
                  <tr>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center border-b border-gray-200"></td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-200">
                      Installation and Handling
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right border-b border-gray-200">
                      {formatCurrency(quotation.totalInstallationCharges)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right border-b border-gray-200">
                      {formatCurrency(quotation.totalInstallationCharges)}
                    </td>
                  </tr>
                  
                  {/* GST Row */}
                  <tr className="bg-gray-50 font-medium">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center border-b border-gray-200"></td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                      GST {quotation.gstPercentage}%
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right border-b border-gray-200">
                      {formatCurrency(quotation.gstAmount)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right border-b border-gray-200">
                      {formatCurrency(quotation.gstAmount)}
                    </td>
                  </tr>
                  
                  {/* Final Price Row */}
                  <tr className="bg-[#009245] text-white font-bold">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center border-b border-gray-200"></td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm border-b border-gray-200">
                      Final Price
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right border-b border-gray-200"></td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right border-b border-gray-200">
                      {formatCurrency(quotation.finalPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {renderFooter(totalPages - 1)}
        </div>
        
        {/* Terms and Conditions Page */}
        <div className="border rounded-lg p-8 mb-8 bg-white" style={{ width: '100%', aspectRatio: '1.77 / 1', position: 'relative' }}>
          <div className="absolute top-0 right-0 bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-bl-md">
            Terms & Conditions
          </div>
          
          <div className="flex flex-col h-full">
            <div className="flex justify-between mb-4 mt-6 ml-6 mr-6">
              <div className="w-2/3">
                <h3 className="text-lg font-bold text-[#009245]">Terms & Conditions</h3>
              </div>
              <div className="w-1/4 text-right">
                {companySettings?.logo && (
                  <img 
                    src={companySettings.logo} 
                    alt={companySettings.name}
                    className="w-[120px] object-contain ml-auto" 
                  />
                )}
              </div>
            </div>
            
            <div className="overflow-auto mt-4 mb-auto ml-6 mr-6 mb-6">
              {appSettings?.landscapeTermsAndConditions ? (
                <div className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: appSettings.landscapeTermsAndConditions }} />
              ) : appSettings?.presentationTermsAndConditions ? (
                <div className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: appSettings.presentationTermsAndConditions }} />
              ) : (
                <div className="text-sm text-gray-700 leading-relaxed space-y-4">
                  <div>
                    <h4 className="font-bold mb-2">1. Scope of Services</h4>
                    <p>
                      This quotation covers the design, supply, and installation of modular interior solutions as specified in the project details.
                      Any modifications to the scope will require a revised quotation.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-2">2. Pricing and Payment</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>All prices are in Indian Rupees (INR) and valid for 30 days from the date of issue.</li>
                      <li>Payment terms: 50% advance with order confirmation, 40% before delivery, and 10% upon completion.</li>
                      <li>GST and other applicable taxes will be charged as per government regulations.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-2">3. Timeline</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Manufacturing will commence upon receipt of advance payment and signed approval of designs.</li>
                      <li>Standard delivery time is 4-6 weeks from order confirmation, subject to material availability.</li>
                      <li>Installation timeline will be provided in the project schedule and may vary based on site conditions.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-2">4. Warranty</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>All products carry a 12-month warranty against manufacturing defects under normal use.</li>
                      <li>Warranty excludes damage caused by misuse, improper maintenance, or unauthorized modifications.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
          {renderFooter(totalPages)}
        </div>
      </div>
      
      {/* Download button at the bottom */}
      <div className="flex flex-col items-center mt-4">
        <PDFDownloadLink 
          document={
            <LandscapeQuote 
              quotation={quotation} 
              companySettings={companySettings}
              appSettings={appSettings}
            />
          } 
          fileName={`${quotation?.customer?.name || 'Customer'}_${quotation?.quotationNumber || id}.pdf`}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          {({ blob, url, loading, error }) => 
            loading ? 
              <>
                <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Preparing PDF...
              </> : 
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Landscape PDF
              </>
          }
        </PDFDownloadLink>
        <p className="text-xs text-gray-500 mt-2">(This might take a few seconds to prepare)</p>
      </div>
    </div>
  );
};

export default LandscapeQuotePreview;