import { QuotationWithDetails, Room } from '@shared/schema';
import { apiRequest } from './queryClient';

export interface ValidationError {
  type: 'room_zero_value' | 'missing_product' | 'missing_accessory' | 'missing_installation' | 'missing_handling_charge';
  message: string;
  roomId?: number;
  roomName?: string;
}

export interface ValidationWarning {
  type: 'check_accessories';
  message: string;
  accessories: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export async function validateQuotation(quotationId: number): Promise<ValidationResult> {
  // Fetch the quotation with details
  const response = await apiRequest('GET', `/api/quotations/${quotationId}/details`);
  const quotation: QuotationWithDetails = await response.json();
  
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check if quotation has rooms
  if (!quotation.rooms || quotation.rooms.length === 0) {
    errors.push({
      type: 'room_zero_value',
      message: 'Quotation must have at least one room.'
    });
    
    return { isValid: false, errors, warnings };
  }
  
  // Validate each room
  for (const room of quotation.rooms) {
    // Check 1: Room value should not be zero
    if (room.sellingPrice === 0) {
      errors.push({
        type: 'room_zero_value',
        message: `Room "${room.name || 'Untitled'}" has a zero value.`,
        roomId: room.id,
        roomName: room.name || 'Untitled'
      });
    }
    
    // Check 2: Every room must contain a product
    if (!room.products || room.products.length === 0) {
      errors.push({
        type: 'missing_product',
        message: `Room "${room.name || 'Untitled'}" does not have any products.`,
        roomId: room.id,
        roomName: room.name || 'Untitled'
      });
    }
    
    // Check 3: Every room must contain accessories
    if (!room.accessories || room.accessories.length === 0) {
      errors.push({
        type: 'missing_accessory',
        message: `Room "${room.name || 'Untitled'}" does not have any accessories.`,
        roomId: room.id,
        roomName: room.name || 'Untitled'
      });
    }
    
    // Check 4: Every room must have installation charges
    if (!room.installationCharges || room.installationCharges.length === 0) {
      errors.push({
        type: 'missing_installation',
        message: `Room "${room.name || 'Untitled'}" does not have installation charges.`,
        roomId: room.id,
        roomName: room.name || 'Untitled'
      });
    }
  }
  
  // Check 5: Handling charge must be entered
  if (!quotation.installationHandling || quotation.installationHandling === 0) {
    errors.push({
      type: 'missing_handling_charge',
      message: 'Handling charge must be entered.'
    });
  }
  
  // Get settings for required accessories
  const appSettingsResponse = await apiRequest('GET', `/api/settings/app`);
  const appSettings = await appSettingsResponse.json();
  
  // Warning check: Verify specific accessories from settings
  const requiredAccessories = (appSettings.requiredAccessories || 'skirting,handles,sliding mechanism,t profile')
    .split(',')
    .map(item => item.trim().toLowerCase());
    
  const accessoryCategories = quotation.rooms
    .flatMap(room => room.accessories || [])
    .map(acc => acc.name.toLowerCase());
  
  const missingAccessories = requiredAccessories.filter(
    required => !accessoryCategories.some(cat => cat.includes(required))
  );
  
  if (missingAccessories.length > 0) {
    warnings.push({
      type: 'check_accessories',
      message: 'Please check that the following required accessories are added:',
      accessories: missingAccessories
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export async function markQuotationAsSaved(quotationId: number): Promise<QuotationWithDetails> {
  const response = await apiRequest(
    'PUT',
    `/api/quotations/${quotationId}/status`,
    { status: 'saved' }
  );
  return await response.json();
}