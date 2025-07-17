import React from 'react';
import { formatCurrency } from "@/lib/calculations";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import LandscapeQuote from "@/components/PDFQuotes/LandscapeQuote";

// This is a complete landscape preview component that will be used on the quotation view page
const LandscapeTab = ({ quotation, companySettings, appSettings, id }) => {
  if (!quotation || !companySettings || !appSettings) {
    return <p className="text-center">Loading quotation data...</p>;
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-auto mb-6" style={{ maxHeight: '70vh' }}>
        {/* Cover Page Preview */}
        <div className="border rounded-lg p-8 mb-8 bg-white" style={{ width: '100%', aspectRatio: '1.77 / 1', position: 'relative' }}>
          <div className="absolute top-0 right-0 bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-bl-md">
            Page 1 - Cover
          </div>
          <div className="flex flex-col h-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Modular Interior Quotation</h2>
            </div>
            
            <div className="flex justify-between mb-8">
              <div className="w-1/3">
                {companySettings?.logo && (
                  <img 
                    src={companySettings.logo} 
                    alt={companySettings.name}
                    className="max-h-16 object-contain" 
                  />
                )}
              </div>
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
        </div>
        
        {/* Features Page Preview */}
        <div className="border rounded-lg p-8 mb-8 bg-white" style={{ width: '100%', aspectRatio: '1.77 / 1', position: 'relative' }}>
          <div className="absolute top-0 right-0 bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-bl-md">
            Page 2 - Features
          </div>
          <div className="flex flex-col h-full">
            <div className="flex justify-between mb-6">
              <div className="w-1/3">
                {companySettings?.logo && (
                  <img 
                    src={companySettings.logo} 
                    alt={companySettings.name}
                    className="max-h-12 object-contain" 
                  />
                )}
              </div>
              <div className="w-2/3">
                <h3 className="text-xl font-bold text-gray-800">{companySettings?.name || "Company Name"}</h3>
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
        </div>
        
        {/* Room Images - one page per image */}
        {quotation.rooms && quotation.rooms.filter(room => room && room.included).map((room, roomIndex) => 
          room.images && room.images.map((image, imageIndex) => (
            <div 
              key={`${roomIndex}-${imageIndex}`} 
              className="border rounded-lg p-8 mb-8 bg-white" 
              style={{ width: '100%', aspectRatio: '1.77 / 1', position: 'relative' }}
            >
              <div className="absolute top-0 right-0 bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-bl-md">
                Page {3 + roomIndex + imageIndex} - {room.name}
              </div>
              
              <div className="flex flex-col h-full">
                <div className="flex justify-between mb-4">
                  <div className="w-1/3">
                    {companySettings?.logo && (
                      <img 
                        src={companySettings.logo} 
                        alt={companySettings.name}
                        className="max-h-10 object-contain" 
                      />
                    )}
                  </div>
                  <div className="w-2/3">
                    <h3 className="text-xl font-bold text-gray-800">{companySettings?.name || "Company Name"}</h3>
                  </div>
                </div>
                
                <h4 className="text-lg font-bold text-[#009245] mb-4">{image.type || "Room Image"}</h4>
                
                <div className="flex-grow flex items-center justify-center mb-4">
                  <img 
                    src={image.path} 
                    alt={`${room.name} - ${image.type || "Image"}`} 
                    className="max-h-[calc(100%-2rem)] max-w-full object-contain border shadow-sm" 
                  />
                </div>
                
                <div className="text-center mt-auto mb-0">
                  <p className="text-gray-700 font-medium">{room.name}</p>
                  {room.description && (
                    <p className="text-gray-600 text-sm mt-1">{room.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Summary Page */}
        <div className="border rounded-lg p-8 mb-8 bg-white" style={{ width: '100%', aspectRatio: '1.77 / 1', position: 'relative' }}>
          <div className="absolute top-0 right-0 bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-bl-md">
            Summary Page
          </div>
          
          <div className="flex flex-col h-full">
            <div className="flex justify-between mb-4">
              <div className="w-1/3">
                {companySettings?.logo && (
                  <img 
                    src={companySettings.logo} 
                    alt={companySettings.name}
                    className="max-h-10 object-contain" 
                  />
                )}
              </div>
              <div className="w-2/3">
                <h3 className="text-xl font-bold text-gray-800">{companySettings?.name || "Company Name"}</h3>
              </div>
            </div>
            
            <h4 className="text-lg font-bold text-[#009245] mb-4">Quotation Summary</h4>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 mb-6">
                <thead className="bg-[#009245] text-white">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                      Room
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotation.rooms && quotation.rooms.filter(room => room && room.included).map((room, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {room.name}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {room.description || `${room.products?.length || 0} products`}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(room.sellingPrice || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="ml-auto w-2/5 border-t border-gray-200 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(quotation.totalSellingPrice)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Discount ({quotation.globalDiscount}%):</span>
                <span className="font-medium text-red-600">-{formatCurrency(quotation.totalSellingPrice * (quotation.globalDiscount / 100))}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Installation:</span>
                <span className="font-medium">{formatCurrency(quotation.totalInstallationCharges)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">GST ({quotation.gstPercentage}%):</span>
                <span className="font-medium">{formatCurrency(quotation.gstAmount)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span className="text-[#009245]">{formatCurrency(quotation.finalPrice)}</span>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-gray-200">
              <h5 className="font-bold text-gray-700 mb-2">Terms & Conditions</h5>
              <div className="text-xs text-gray-600">
                {appSettings?.defaultTermsAndConditions ? (
                  <div className="line-clamp-3" dangerouslySetInnerHTML={{ __html: appSettings.defaultTermsAndConditions }} />
                ) : (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Quotation is valid for 30 days from the date of issue.</li>
                    <li>Payment terms: 50% advance, 50% before delivery.</li>
                    <li>Delivery time: 4-6 weeks from date of order confirmation.</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
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

export default LandscapeTab;