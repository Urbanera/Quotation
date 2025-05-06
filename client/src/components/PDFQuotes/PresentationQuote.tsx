import { forwardRef } from "react";
import { CompanySettings, QuotationWithDetails } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface PresentationQuoteProps {
  quotation: QuotationWithDetails;
}

const PresentationQuote = forwardRef<HTMLDivElement, PresentationQuoteProps>(({ quotation }, ref) => {
  // Fetch company settings
  const { data: companySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/settings/company"],
    retry: 1,
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Safe access to quotation fields
  const safeQuotation = {
    id: quotation?.id || 0,
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

  // Default company name if settings not loaded
  const companyName = companySettings?.name || "DesignQuotes";

  return (
    <div ref={ref} className="max-w-5xl mx-auto bg-white" id="presentation-quote">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-8 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {companySettings?.logo && (
              <img src={companySettings.logo} alt={companyName} className="h-12 mr-4" />
            )}
            <div>
              <h1 className="text-3xl font-bold">{companyName}</h1>
              <p className="text-indigo-100">Transforming Spaces, Creating Experiences</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold">DESIGN PROPOSAL</h2>
            <p>Reference: #{safeQuotation.id}</p>
            <p>Date: {formatDate(safeQuotation.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Client Introduction */}
      <div className="p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Interior Design Proposal for</h2>
          <h3 className="text-3xl font-bold text-indigo-600 mb-6">{safeQuotation.customer.name}</h3>
          <p className="text-gray-600 mb-4">{safeQuotation.customer.address}</p>
          <div className="flex justify-center items-center gap-4 text-gray-600">
            <span>{safeQuotation.customer.email}</span>
            <span>•</span>
            <span>{safeQuotation.customer.phone}</span>
          </div>
        </div>
      </div>

      {/* Scope of Work */}
      <div className="p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Scope of Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {safeQuotation.rooms.map((room) => (
            <div key={room.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-indigo-50 p-4 border-b">
                <h4 className="text-lg font-semibold text-indigo-700">{room.name || 'Unnamed Room'}</h4>
                {room.description && <p className="text-gray-600 mt-1">{room.description}</p>}
              </div>
              <div className="p-4">
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
                
                {room.images && room.images.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-800 mb-2">Design References:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {room.images.slice(0, 2).map((image) => (
                        <div key={image.id} className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden">
                          <img src={image.path} alt={`Design for ${room.name || 'Room'}`} className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Cost Summary */}
      <div className="p-8 bg-gray-50">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Project Cost Summary</h3>
        <div className="overflow-hidden border rounded-lg shadow-sm mt-6 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-indigo-800 uppercase tracking-wider">
                  Product Description
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-indigo-800 uppercase tracking-wider">
                  Selling Price
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-indigo-800 uppercase tracking-wider">
                  {safeQuotation.globalDiscount > 0 
                    ? `Discounted Price (Incl. ${safeQuotation.globalDiscount}% Discount)` 
                    : "Discounted Price"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {safeQuotation.rooms.map((room) => {
                // Calculate the discounted price with global discount applied
                const roomSellingPrice = room.sellingPrice || 0;
                const calculatedDiscountedPrice = safeQuotation.globalDiscount > 0
                  ? roomSellingPrice - (roomSellingPrice * safeQuotation.globalDiscount / 100)
                  : roomSellingPrice;
                
                return (
                  <tr key={room.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(room.name || 'Unnamed Room').toUpperCase()}
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
              })}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Of All Items
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
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
              {(() => {
                // Get total installation charges from all rooms
                let totalInstallCharges = 0;
                
                // Loop through each room
                for (const room of safeQuotation.rooms) {
                  // If room has installation charges, add them all up
                  if (room.installationCharges && room.installationCharges.length > 0) {
                    for (const charge of room.installationCharges) {
                      totalInstallCharges += charge.amount || 0;
                    }
                  }
                }
                
                // Add handling charges
                const totalWithHandling = totalInstallCharges + safeQuotation.installationHandling;
                
                return (
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Installation and Handling
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(totalWithHandling)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totalWithHandling)}
                    </td>
                  </tr>
                );
              })()}
              
              {(() => {
                // Calculate the discounted total
                const discountedTotal = safeQuotation.globalDiscount > 0
                  ? Math.round(safeQuotation.totalSellingPrice * (1 - safeQuotation.globalDiscount / 100))
                  : safeQuotation.totalSellingPrice;
                
                // Calculate installation charges the same way as above
                let totalInstallCharges = 0;
                
                // Loop through each room
                for (const room of safeQuotation.rooms) {
                  // If room has installation charges, add them all up
                  if (room.installationCharges && room.installationCharges.length > 0) {
                    for (const charge of room.installationCharges) {
                      totalInstallCharges += charge.amount || 0;
                    }
                  }
                }
                
                // Add handling charges
                const totalWithHandling = totalInstallCharges + safeQuotation.installationHandling;
                
                // Calculate GST based on discounted total + installation/handling
                const gstAmount = Math.round((discountedTotal + totalWithHandling) * (safeQuotation.gstPercentage / 100));
                
                // Calculate final price
                const finalPrice = discountedTotal + totalWithHandling + gstAmount;
                
                return (
                  <>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        GST {safeQuotation.gstPercentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {formatCurrency(Math.round((safeQuotation.totalSellingPrice + totalWithHandling) * (safeQuotation.gstPercentage / 100)))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(gstAmount)}
                      </td>
                    </tr>
                    
                    <tr className="bg-indigo-50">
                      <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                        Final Price
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 text-right">
                        {formatCurrency(safeQuotation.totalSellingPrice + totalWithHandling + 
                          Math.round((safeQuotation.totalSellingPrice + totalWithHandling) * (safeQuotation.gstPercentage / 100)))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-indigo-700 text-right">
                        {formatCurrency(finalPrice)}
                      </td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Why Choose Us</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="text-center p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Premium Quality</h4>
            <p className="text-gray-600">We use only the highest quality materials and fittings, ensuring durability and longevity.</p>
          </div>
          <div className="text-center p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Timely Delivery</h4>
            <p className="text-gray-600">We commit to completing your project within the stipulated timeline without compromising quality.</p>
          </div>
          <div className="text-center p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Expert Guidance</h4>
            <p className="text-gray-600">Our professional designers will guide you throughout the journey, offering the best solutions for your needs.</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Space?</h3>
        <p className="max-w-xl mx-auto mb-6">
          This proposal is valid for 30 days from the date issued. Don't miss this opportunity to create your dream space.
        </p>
        <div className="inline-block bg-white text-indigo-700 py-3 px-6 rounded-lg font-semibold text-lg">
          Contact Us: {companySettings?.phone || ""}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50 text-center text-sm text-gray-500 rounded-b-lg">
        <p>{companyName} • {companySettings?.address || "123 Design Street, Creativity District"}</p>
        <p>{companySettings?.email || "design@example.com"}{companySettings?.phone && ` • ${companySettings.phone}`}</p>
        {companySettings?.website && <p>{companySettings.website}</p>}
      </div>
    </div>
  );
});

PresentationQuote.displayName = "PresentationQuote";

export default PresentationQuote;
