/**
 * Utility to restore sample quotation data when the server restarts
 * This provides continuity for testing until database storage is enabled for quotations
 */

import { storage } from "./storage";

export async function restoreQuotationData() {
  try {
    // Check if we already have quotations
    const existingQuotations = await storage.getQuotations();
    if (existingQuotations.length > 0) {
      console.log('Quotations already exist, skipping restoration');
      return;
    }

    // Check if we have customers to create quotations for
    const customers = await storage.getCustomers();
    if (customers.length === 0) {
      console.log('No customers found, skipping quotation restoration');
      return;
    }

    console.log('Restoring sample quotation data...');

    // Get the first customer
    const customer = customers[0];

    // Create a sample quotation
    const quotation = await storage.createQuotation({
      customerId: customer.id,
      quotationNumber: 'Q-2025-001',
      status: 'draft',
      title: 'Kitchen Interior Design',
      description: 'Complete kitchen renovation with modern cabinets and accessories',
      totalSellingPrice: 171000,
      totalDiscountedPrice: 162450, // 5% discount applied
      totalInstallationCharges: 1000,
      installationHandling: 1000,
      globalDiscount: 5,
      gstPercentage: 18,
      gstAmount: 29025.9,
      finalPrice: 194475.9,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      terms: 'Standard terms and conditions apply'
    });

    console.log('Created quotation:', quotation);

    // Create a room
    const room = await storage.createRoom({
      quotationId: quotation.id,
      name: 'Kitchen',
      order: 0,
      description: 'Modern kitchen with premium finishes',
      sellingPrice: 171000,
      discountedPrice: 162450,
      included: true
    });

    console.log('Created room:', room);

    // Create some products
    await storage.createProduct({
      roomId: room.id,
      name: 'Cabinet',
      description: 'Premium modular kitchen cabinets',
      quantity: 1,
      sellingPrice: 90000,
      discount: 0,
      discountType: 'percentage',
      discountedPrice: 90000
    });

    await storage.createAccessory({
      roomId: room.id,
      name: 'Handles',
      description: 'Stainless steel cabinet handles',
      quantity: 9,
      sellingPrice: 9000,
      discount: 0,
      discountType: 'percentage',
      discountedPrice: 9000
    });

    // Create installation charge
    await storage.createInstallationCharge({
      roomId: room.id,
      cabinetType: 'WALL',
      widthFt: 8,
      heightFt: 8,
      quantity: 1,
      ratePerSqft: 100,
      totalAmount: 6400
    });

    console.log('✅ Sample quotation data restored successfully');

  } catch (error) {
    console.error('❌ Failed to restore quotation data:', error);
  }
}