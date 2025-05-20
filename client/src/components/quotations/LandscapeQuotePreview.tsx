import React, { useMemo } from 'react';
import { formatCurrency } from "@/lib/calculations";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import LandscapeQuote from "@/components/PDFQuotes/LandscapeQuote";
import { QuotationWithDetails, CompanySettings, AppSettings } from "@shared/schema";

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
    
    return quotation.rooms.map(room => {
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
    
    // Count room image pages
    sortedRooms.forEach(room => {
      pageCount += room.images?.length || 0;
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
            <div className="flex justify-between items-start mb-4">
              <div className="text-center flex-grow">
                <h2 className="text-2xl font-bold text-gray-800">Modular Interior Quotation</h2>
              </div>
              <div className="w-1/4 text-right">
                {companySettings?.logo && (
                  <img 
                    src={companySettings.logo} 
                    alt={companySettings.name}
                    className="max-h-16 max-w-full object-contain ml-auto" 
                  />
                )}
              </div>
            </div>
            
            <div className="flex justify-between mb-8 mt-4">
              <div className="w-2/3">
                <h3 className="text-xl font-bold text-gray-800">{companySettings?.name || "Company Name"}</h3>
                <p className="text-gray-600">{companySettings?.address || "Address"}</p>
                <p className="text-gray-600">Phone: {companySettings?.phone || "Phone"}</p>
                <p className="text-gray-600">Email: {companySettings?.email || "Email"}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mb-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">Customer:</h4>
                  <p className="font-medium">{quotation?.customer?.name || "Customer Name"}</p>
                  
                  <h4 className="text-sm font-semibold text-gray-500 mb-1 mt-3">Address:</h4>
                  <p>{quotation?.customer?.address || "Address"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">Phone:</h4>
                  <p>{quotation?.customer?.phone || "Phone"}</p>
                  
                  <h4 className="text-sm font-semibold text-gray-500 mb-1 mt-3">Email:</h4>
                  <p>{quotation?.customer?.email || "Email"}</p>
                  
                  <h4 className="text-sm font-semibold text-gray-500 mb-1 mt-3">Quotation #:</h4>
                  <p className="font-medium">{quotation?.quotationNumber || "QT-0000"}</p>
                </div>
              </div>
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
            <div className="flex justify-between mb-6">
              <div className="w-2/3">
                <h3 className="text-xl font-bold text-gray-800">{companySettings?.name || "Company Name"}</h3>
              </div>
              <div className="w-1/4 text-right">
                {companySettings?.logo && (
                  <img 
                    src={companySettings.logo} 
                    alt={companySettings.name}
                    className="max-h-12 max-w-full object-contain ml-auto" 
                  />
                )}
              </div>
            </div>
            
            <div className="mb-auto">
              <h4 className="text-lg font-bold text-[#009245] mb-4">About {companySettings?.name || "Our Company"}</h4>
              
              <div className="text-gray-700 space-y-2">
                {appSettings?.presentationSecondPageContent ? (
                  <div dangerouslySetInnerHTML={{ __html: appSettings.presentationSecondPageContent }} />
                ) : (
                  <>
                    <p>
                      {companySettings?.name} is a premier interior design firm specializing in creating exceptional living 
                      and working spaces that reflect our clients' unique styles and needs. With a dedicated team 
                      of designers and craftsmen, we combine innovative design with functionality.
                    </p>
                    <p>
                      Our process begins with understanding your vision, lifestyle, and requirements before crafting 
                      customized solutions that blend aesthetics with practicality.
                    </p>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-bold text-[#009245] mb-2">Quality Materials</h5>
                  <p className="text-sm text-gray-600">We use only the highest quality materials sourced from trusted suppliers.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-bold text-[#009245] mb-2">Expert Craftsmen</h5>
                  <p className="text-sm text-gray-600">Our skilled team ensures precise execution of your design vision.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-bold text-[#009245] mb-2">Timely Delivery</h5>
                  <p className="text-sm text-gray-600">We commit to delivering your project within the agreed timeframe.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-bold text-[#009245] mb-2">After-Sales Support</h5>
                  <p className="text-sm text-gray-600">Our service doesn't end with installation - we provide ongoing support.</p>
                </div>
              </div>
            </div>
          </div>
          {renderFooter(2)}
        </div>
        
        {/* Room Images - one page per image */}
        {sortedRooms.map((room, roomIndex) => 
          room.images && room.images.map((image, imageIndex) => {
            const pageNumber = 3 + roomIndex + imageIndex;
            return (
              <div 
                key={`${roomIndex}-${imageIndex}`} 
                className="border rounded-lg p-8 mb-8 bg-white" 
                style={{ width: '100%', aspectRatio: '1.77 / 1', position: 'relative' }}
              >
                <div className="absolute top-0 right-0 bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-bl-md">
                  Page {pageNumber} - {room.name}
                </div>
                
                <div className="flex flex-col h-full">
                  <div className="flex justify-between mb-4">
                    <div className="w-2/3">
                      <h3 className="text-lg font-bold text-[#009245]">
                        {room.name} - {image.type || "Room Image"}
                      </h3>
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
                  
                  <div className="flex-grow flex items-center justify-center mb-4 overflow-hidden" style={{ height: '380px', width: '95%', margin: 'auto' }}>
                    <img 
                      src={image.path} 
                      alt={`${room.name} - ${image.type || "Image"}`} 
                      className="object-contain border shadow-sm" 
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                </div>
                {renderFooter(pageNumber)}
              </div>
            );
          })
        )}
        
        {/* Summary Page - Project Cost Summary */}
        <div className="border rounded-lg p-8 mb-8 bg-white" style={{ width: '100%', aspectRatio: '1.77 / 1', position: 'relative' }}>
          <div className="absolute top-0 right-0 bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-bl-md">
            Project Cost Summary
          </div>
          
          <div className="flex flex-col h-full">
            <div className="flex justify-between mb-4">
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
            
            <div className="overflow-auto mt-4 mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                {/* Table Header */}
                <thead>
                  <tr className="bg-[#e8f5e9]">
                    <th className="px-4 py-3 text-left font-medium text-[#009245]">PRODUCT DESCRIPTION</th>
                    <th className="px-4 py-3 text-right font-medium text-[#009245]">SELLING PRICE</th>
                    <th className="px-4 py-3 text-right font-medium text-[#009245]">DISCOUNTED PRICE ({quotation.globalDiscount}%)</th>
                  </tr>
                </thead>
                
                <tbody>
                  {/* Room Rows */}
                  {sortedRooms.map((room, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-[#f5f5f5]' : 'bg-white'}>
                      <td className="px-4 py-3 font-medium">{room.name.toUpperCase()}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(room.sellingPrice || 0)}</td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {formatCurrency((room.sellingPrice || 0) * (1 - quotation.globalDiscount / 100))}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr className="bg-[#f5f5f5]">
                    <td className="px-4 py-3 font-medium">Total Of All Items</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(quotation.totalSellingPrice)}</td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {formatCurrency(quotation.totalSellingPrice * (1 - quotation.globalDiscount / 100))}
                    </td>
                  </tr>
                  
                  {/* Installation Row */}
                  <tr>
                    <td className="px-4 py-3 font-medium">Installation and Handling</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(quotation.totalInstallationCharges)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(quotation.totalInstallationCharges)}</td>
                  </tr>
                  
                  {/* GST Row */}
                  <tr className="bg-[#f5f5f5]">
                    <td className="px-4 py-3 font-medium">GST {quotation.gstPercentage}%</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(quotation.gstAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(quotation.gstAmount * (1 - quotation.globalDiscount / 100))}
                    </td>
                  </tr>
                  
                  {/* Final Price Row */}
                  <tr>
                    <td className="px-4 py-3 font-medium">Final Price</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(quotation.finalPrice)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">
                      {formatCurrency(quotation.finalPrice * (1 - quotation.globalDiscount / 100) + quotation.totalInstallationCharges)}
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
            <div className="flex justify-between mb-4">
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
            
            <div className="overflow-auto mt-4 mb-auto">
              {appSettings?.defaultTermsAndConditions ? (
                <div className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: appSettings.defaultTermsAndConditions }} />
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
          fileName={`Landscape-${quotation?.quotationNumber || id}.pdf`}
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