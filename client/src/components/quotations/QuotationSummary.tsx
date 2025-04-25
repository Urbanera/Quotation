import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, FileOutput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { QuotationWithDetails, Room, InstallationCharge } from "@shared/schema";

interface QuotationSummaryProps {
  quotationId: number;
  installationHandling: number;
  setInstallationHandling: (value: number) => void;
  globalDiscount: number;
  setGlobalDiscount: (value: number) => void;
  gstPercentage: number;
  setGstPercentage: (value: number) => void;
  onSave: () => void;
}

export default function QuotationSummary({
  quotationId,
  installationHandling,
  setInstallationHandling,
  globalDiscount,
  setGlobalDiscount,
  gstPercentage,
  setGstPercentage,
  onSave
}: QuotationSummaryProps) {
  const { toast } = useToast();

  const { data: quotation, isLoading } = useQuery<QuotationWithDetails>({
    queryKey: [`/api/quotations/${quotationId}`],
    enabled: !!quotationId,
  });
  
  // Log for debugging
  useEffect(() => {
    if (quotation) {
      console.log('Quotation data:', quotation);
      console.log('Rooms data:', quotation.rooms);
      console.log('Rooms with installation charges:', 
        quotation.rooms?.filter(room => room.installationCharges && room.installationCharges.length > 0));
    }
  }, [quotation]);

  // Input change handlers
  const handleInstallationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setInstallationHandling(value);
    }
  };

  const handleGlobalDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setGlobalDiscount(value);
    }
  };

  const handleGstChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setGstPercentage(value);
    }
  };

  // Fetch installation charges for all rooms in the quotation
  const { data: roomInstallationCharges = [], refetch: refetchInstallationCharges, isError, error } = useQuery<{roomId: number, charges: InstallationCharge[]}[]>({
    queryKey: [`/api/quotations/${quotationId}/installation-charges`],
    enabled: !!quotationId && !!quotation?.rooms?.length,
  });
  
  // Log for debugging
  useEffect(() => {
    console.log('Room installation charges data:', roomInstallationCharges);
    if (isError) {
      console.error('Error fetching installation charges:', error);
    }
  }, [roomInstallationCharges, isError, error]);
  
  // Refetch installation charges whenever quotation data changes
  useEffect(() => {
    if (quotationId && quotation?.rooms?.length) {
      refetchInstallationCharges();
    }
  }, [quotationId, quotation, refetchInstallationCharges]);

  const getTotalInstallationCharges = () => {
    // First check if totalInstallationCharges is available in the quotation
    if (quotation && 'totalInstallationCharges' in quotation) {
      console.log('Using totalInstallationCharges from quotation:', quotation.totalInstallationCharges);
      return quotation.totalInstallationCharges;
    }
    
    // Then try to use the installation charges from the room data directly
    if (quotation?.rooms && quotation.rooms.length > 0) {
      let totalAmount = 0;
      
      for (const room of quotation.rooms) {
        if (room.installationCharges && room.installationCharges.length > 0) {
          for (const charge of room.installationCharges) {
            const amount = typeof charge.amount === 'number' 
              ? charge.amount 
              : parseFloat(String(charge.amount));
            totalAmount += amount;
          }
        }
      }
      
      console.log('Total installation charges from room data:', totalAmount);
      return totalAmount;
    }
    
    // Fall back to the installation charges from the API endpoint
    if (!roomInstallationCharges.length) return 0;
    
    // Get all charges from all rooms
    let totalAmount = 0;
    
    for (const roomData of roomInstallationCharges) {
      // Sum up all charges for this room
      for (const charge of roomData.charges) {
        const amount = typeof charge.amount === 'number' 
          ? charge.amount 
          : parseFloat(String(charge.amount));
        totalAmount += amount;
      }
    }
    
    console.log('Total installation charges from API endpoint:', totalAmount);
    return totalAmount;
  };

  const calculateTotals = () => {
    if (!quotation) return {
      totalSelling: 0,
      totalDiscounted: 0,
      totalAfterGlobalDiscount: 0,
      gstAmount: 0,
      finalPrice: 0
    };
    
    const totalSelling = quotation.totalSellingPrice;
    const totalDiscounted = quotation.totalDiscountedPrice;
    
    // Apply global discount to the already discounted price
    const totalAfterGlobalDiscount = globalDiscount > 0 
      ? totalDiscounted - (totalDiscounted * (globalDiscount / 100))
      : totalDiscounted;
    
    const totalInstallationCharges = getTotalInstallationCharges();
    const gstAmount = (totalAfterGlobalDiscount + totalInstallationCharges + installationHandling) * (gstPercentage / 100);
    const finalPrice = totalAfterGlobalDiscount + totalInstallationCharges + installationHandling + gstAmount;
    
    return {
      totalSelling,
      totalDiscounted,
      totalAfterGlobalDiscount,
      gstAmount,
      finalPrice
    };
  };

  const totals = calculateTotals();

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <p className="text-red-500">Error loading quotation data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quotation Summary</h3>
        
        <div className="overflow-hidden border border-gray-200 rounded-lg">
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
                  {globalDiscount > 0 
                    ? `Discounted Price (Incl. ${globalDiscount}% Discount)` 
                    : "Discounted Price"}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotation.rooms && quotation.rooms.map((room) => {
                if (!room) return null;
                
                // Calculate the discounted price with global discount applied
                const calculatedDiscountedPrice = globalDiscount > 0
                  ? room.sellingPrice - (room.sellingPrice * globalDiscount / 100)
                  : room.sellingPrice;
                
                return (
                  <tr key={room.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {room.name ? room.name.toUpperCase() : 'UNTITLED ROOM'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ₹{room.sellingPrice ? room.sellingPrice.toLocaleString('en-IN') : '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {globalDiscount > 0 ? (
                        <span className="text-indigo-600 font-medium">
                          ₹{Math.round(calculatedDiscountedPrice).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <>₹{room.sellingPrice ? room.sellingPrice.toLocaleString('en-IN') : '0'}</>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Of All Items
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  ₹{(totals.totalSelling || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                  {globalDiscount > 0 ? (
                    <span className="text-indigo-600 font-medium">
                      ₹{(totals.totalAfterGlobalDiscount || 0).toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <>₹{(totals.totalAfterGlobalDiscount || 0).toLocaleString('en-IN')}</>
                  )}
                </td>
              </tr>
              

              
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Installation and Handling
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  ₹{((getTotalInstallationCharges() || 0) + (installationHandling || 0)).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  ₹{((getTotalInstallationCharges() || 0) + (installationHandling || 0)).toLocaleString('en-IN')}
                </td>
              </tr>
              
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  GST {gstPercentage}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  ₹{(((totals.totalSelling || 0) + (getTotalInstallationCharges() || 0) + (installationHandling || 0)) * (gstPercentage / 100)).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  ₹{(totals.gstAmount || 0).toLocaleString('en-IN')}
                </td>
              </tr>
              
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                  Final Price
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 text-right">
                  ₹{(((totals.totalSelling || 0) + (getTotalInstallationCharges() || 0) + (installationHandling || 0)) + (((totals.totalSelling || 0) + (getTotalInstallationCharges() || 0) + (installationHandling || 0)) * (gstPercentage / 100))).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-indigo-600 text-right">
                  ₹{(totals.finalPrice || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
          <div>
            <label htmlFor="installation-handling" className="block text-sm font-medium text-gray-700">Handling Charges</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <Input
                type="number"
                id="installation-handling"
                value={installationHandling}
                onChange={handleInstallationChange}
                onBlur={onSave}
                className="pl-7 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="global-discount" className="block text-sm font-medium text-gray-700">Global Discount</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <Input
                type="number"
                id="global-discount"
                value={globalDiscount}
                onChange={handleGlobalDiscountChange}
                onBlur={onSave}
                className="pr-8 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="gst-percentage" className="block text-sm font-medium text-gray-700">GST Percentage</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <Input
                type="number"
                id="gst-percentage"
                value={gstPercentage}
                onChange={handleGstChange}
                onBlur={onSave}
                className="pr-8 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              toast({
                title: "Feature coming soon",
                description: "Basic quote generation will be available soon."
              });
            }}
            className="gap-2"
          >
            <FileText className="h-5 w-5" />
            Basic Quote
          </Button>
          <Button
            onClick={() => {
              toast({
                title: "Feature coming soon",
                description: "Presentation quote generation will be available soon."
              });
            }}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            <FileOutput className="h-5 w-5" />
            Presentation Quote
          </Button>
        </div>
      </div>
    </div>
  );
}
