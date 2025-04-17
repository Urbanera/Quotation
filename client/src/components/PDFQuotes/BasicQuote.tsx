import { forwardRef } from "react";
import { QuotationWithDetails } from "@shared/schema";

interface BasicQuoteProps {
  quotation: QuotationWithDetails;
}

const BasicQuote = forwardRef<HTMLDivElement, BasicQuoteProps>(({ quotation }, ref) => {
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

  return (
    <div ref={ref} className="max-w-4xl mx-auto bg-white p-8 print:p-4" id="basic-quote">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold text-indigo-600">DesignQuotes</h1>
          <p className="text-gray-500">Interior Design Quotations</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">QUOTATION</h2>
          <p className="text-gray-600">#{quotation.id}</p>
          <p className="text-gray-600">Date: {formatDate(quotation.createdAt)}</p>
        </div>
      </div>

      {/* Client Information */}
      <div className="mb-8 grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-md font-semibold mb-2 text-gray-700">From:</h3>
          <p className="font-semibold">DesignQuotes Interior Services</p>
          <p>123 Design Street</p>
          <p>Creativity District</p>
          <p>design@example.com</p>
          <p>+91 98765 43210</p>
        </div>
        <div>
          <h3 className="text-md font-semibold mb-2 text-gray-700">To:</h3>
          <p className="font-semibold">{quotation.customer.name}</p>
          <p>{quotation.customer.address}</p>
          <p>{quotation.customer.email}</p>
          <p>{quotation.customer.phone}</p>
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
                  {quotation.globalDiscount > 0 
                    ? `Discounted Price (Incl. ${quotation.globalDiscount}% Discount)` 
                    : "Discounted Price"}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotation.rooms.map((room) => {
                // Calculate the discounted price with global discount applied
                const calculatedDiscountedPrice = quotation.globalDiscount > 0
                  ? room.sellingPrice - (room.sellingPrice * quotation.globalDiscount / 100)
                  : room.sellingPrice;
                
                return (
                  <tr key={room.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {room.name.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(room.sellingPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {quotation.globalDiscount > 0 ? (
                        <span className="text-indigo-600 font-medium">
                          {formatCurrency(Math.round(calculatedDiscountedPrice))}
                        </span>
                      ) : (
                        <>{formatCurrency(room.sellingPrice)}</>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {quotation.globalDiscount > 0 
                    ? `Total Of All Items (After ${quotation.globalDiscount}% Global Discount)` 
                    : "Total Of All Items"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(quotation.totalSellingPrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  {quotation.globalDiscount > 0 ? (
                    <span className="text-indigo-600 font-medium">
                      {formatCurrency(quotation.totalDiscountedPrice)}
                    </span>
                  ) : (
                    <>{formatCurrency(quotation.totalSellingPrice)}</>
                  )}
                </td>
              </tr>
              

              
              {/* Installation and handling charges */}
              {(() => {
                // Get total installation charges from all rooms
                const totalInstallCharges = quotation.rooms.reduce((sum, room) => {
                  if (!room.installationCharges) return sum;
                  return sum + room.installationCharges.reduce((chargeSum, charge) => 
                    chargeSum + charge.amount, 0);
                }, 0);
                
                // Add handling charges
                const totalWithHandling = totalInstallCharges + quotation.installationHandling;
                
                return (
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
                );
              })()}
              
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  GST {quotation.gstPercentage}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(quotation.gstAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(quotation.gstAmount)}
                </td>
              </tr>
              
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                  Final Price
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 text-right">
                  {formatCurrency(quotation.finalPrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-indigo-600 text-right">
                  {formatCurrency(quotation.finalPrice)}
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
        <p>For any queries, please contact us at support@designquotes.com or call +91 98765 43210</p>
      </div>
    </div>
  );
});

BasicQuote.displayName = "BasicQuote";

export default BasicQuote;
