import { Room, QuotationWithDetails, AppSettings } from "@shared/schema";

// Extended Room interface for the application
export interface ExtendedRoom extends Room {
  products: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    discount: number;
    roomId: number;
    description?: string | null;
    category?: string | null;
  }>;
  images?: string[];
}

/**
 * Format a number as currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Calculate the total for a single room
 */
export const calculateRoomTotal = (room: ExtendedRoom): number => {
  if (!room.products || !Array.isArray(room.products)) {
    return 0;
  }
  
  return room.products.reduce((total: number, product: any) => {
    const unitPrice = product.price || 0;
    const quantity = product.quantity || 0;
    const discount = product.discount || 0;
    const totalAfterDiscount = (unitPrice * quantity) * (1 - discount / 100);
    return total + totalAfterDiscount;
  }, 0);
};

/**
 * Calculate grand totals for a quotation
 */
export const calculateQuotationGrandTotal = (
  quotation: QuotationWithDetails,
  appSettings: AppSettings
) => {
  // Typecast rooms to ExtendedRoom as we know they have products in the application
  const extendedRooms = quotation.rooms as unknown as ExtendedRoom[];
  
  // Calculate subtotal from all rooms
  const subtotal = calculateSubtotal(extendedRooms);
  
  // Apply global discount
  const globalDiscountAmount = subtotal * (quotation.globalDiscount / 100);
  const totalAfterDiscount = subtotal - globalDiscountAmount;
  
  // Apply GST
  const gstPercentage = appSettings.defaultGstPercentage || 0;
  const gstAmount = totalAfterDiscount * (gstPercentage / 100);
  
  // Grand total without installation
  const grandTotal = totalAfterDiscount + gstAmount;
  
  // Installation charges if applicable
  // Handle missing installation percentage property
  const installationPercentage = 5; // Default to 5% if not available in settings
  const installationCharge = grandTotal * (installationPercentage / 100);
  
  // Final grand total
  const grandTotalWithInstallation = grandTotal + installationCharge;
  
  return {
    subtotal,
    globalDiscountAmount,
    totalAfterDiscount,
    gstAmount,
    grandTotal,
    installationCharge,
    grandTotalWithInstallation
  };
};

/**
 * Calculate subtotal from all rooms
 */
export const calculateSubtotal = (rooms: ExtendedRoom[]) => {
  return rooms.reduce((total: number, room: ExtendedRoom) => total + calculateRoomTotal(room), 0);
};

/**
 * Convert a number to words (for Indian Rupees)
 */
export const numberToIndianWords = (num: number): string => {
  const singleDigits = [
    'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'
  ];
  const teens = [
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  if (num === 0) return 'Zero Rupees Only';

  // Handle negative numbers
  if (num < 0) return 'Minus ' + numberToIndianWords(Math.abs(num));

  // Indian numbering system groups
  const handleGroup = (num: number): string => {
    if (num === 0) return '';
    else if (num < 10) return singleDigits[num];
    else if (num < 20) return teens[num - 10];
    else if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + singleDigits[num % 10] : '');
    else return singleDigits[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + handleGroup(num % 100) : '');
  };

  let result = '';
  
  // Handle crores (10,000,000)
  if (num >= 10000000) {
    result += handleGroup(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  
  // Handle lakhs (100,000)
  if (num >= 100000) {
    result += handleGroup(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  
  // Handle thousands
  if (num >= 1000) {
    result += handleGroup(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  
  // Handle hundreds
  if (num > 0) {
    result += handleGroup(num);
  }

  return result.trim() + ' Rupees Only';
};