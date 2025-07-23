import {
  companySettings, CompanySettings, InsertCompanySettings,
  appSettings, AppSettings, InsertAppSettings,
  customers, Customer, InsertCustomer,
  quotations, Quotation, InsertQuotation, quotationStatusEnum,
  quotationModifications, QuotationModification, InsertQuotationModification,
  rooms, Room, InsertRoom,
  products, Product, InsertProduct,
  accessories, Accessory, InsertAccessory,
  images, Image, InsertImage,
  installationCharges, InstallationCharge,
  QuotationWithDetails, RoomWithItems,
  users, User, InsertUser,
  teams, Team, InsertTeam,
  teamMembers, TeamMember, InsertTeamMember,
  followUps, FollowUp, InsertFollowUp,
  milestones, Milestone, InsertMilestone,
  accessoryCatalog, AccessoryCatalog, InsertAccessoryCatalog,
  salesOrders, SalesOrder, InsertSalesOrder, orderStatusEnum, paymentStatusEnum,
  payments, Payment, InsertPayment, paymentMethodEnum,
  customerPayments, CustomerPayment, InsertCustomerPayment, paymentTypeEnum,
  invoices, Invoice, InsertInvoice, invoiceStatusEnum,
  userPermissions, UserPermission, InsertUserPermission
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, desc, asc, lt, lte, or, sql, isNotNull } from "drizzle-orm";
import bcrypt from 'bcrypt';

export class DatabaseStorage implements IStorage {
  
  // ===== SETTINGS OPERATIONS =====
  
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).limit(1);
    if (!settings) {
      // Create default settings if none exist
      return this.updateCompanySettings({
        name: "Your Company Name",
        address: "Your Company Address",
        phone: "Your Phone Number",
        email: "your-email@company.com"
      });
    }
    return settings;
  }

  async updateCompanySettings(settings: Partial<InsertCompanySettings>): Promise<CompanySettings> {
    const existing = await db.select().from(companySettings).limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(companySettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(companySettings.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(companySettings)
        .values({ ...settings, updatedAt: new Date() })
        .returning();
      return created;
    }
  }

  async updateCompanyLogo(logoUrl: string): Promise<CompanySettings> {
    return this.updateCompanySettings({ logo: logoUrl });
  }

  async getAppSettings(): Promise<AppSettings | undefined> {
    const [settings] = await db.select().from(appSettings).limit(1);
    if (!settings) {
      // Create default settings if none exist
      return this.updateAppSettings({
        defaultGlobalDiscount: 5,
        defaultGstPercentage: 18,
        handlingChargesSmallRooms: 1000,
        handlingChargesMediumRooms: 2000,
        handlingChargesLargeRooms: 3000
      });
    }
    return settings;
  }

  async updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings> {
    const existing = await db.select().from(appSettings).limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(appSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(appSettings.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(appSettings)
        .values({ ...settings, updatedAt: new Date() })
        .returning();
      return created;
    }
  }

  // ===== CUSTOMER OPERATIONS =====
  
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomersByStage(stage: string): Promise<Customer[]> {
    return db.select().from(customers).where(eq(customers.stage, stage));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByEmailOrPhone(email: string, phone: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(or(eq(customers.email, email), eq(customers.phone, phone)));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values({
      ...customer,
      createdAt: new Date()
    }).returning();
    return created;
  }

  async updateCustomer(id: number, customer: InsertCustomer): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async updateCustomerStage(id: number, stage: string): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set({ stage })
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async updateCustomerFloorPlan(id: number, floorPlanUrl: string, floorPlanType: string, floorPlanName: string): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set({ 
        floorPlanUrl, 
        floorPlanType, 
        floorPlanName 
      })
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.count > 0;
  }

  // ===== FOLLOW-UP OPERATIONS =====
  
  async getAllFollowUps(): Promise<FollowUp[]> {
    return db.select().from(followUps).orderBy(desc(followUps.followUpDate));
  }

  async getFollowUps(customerId: number): Promise<FollowUp[]> {
    return db.select().from(followUps)
      .where(eq(followUps.customerId, customerId))
      .orderBy(desc(followUps.followUpDate));
  }

  async getFollowUp(id: number): Promise<FollowUp | undefined> {
    const [followUp] = await db.select().from(followUps).where(eq(followUps.id, id));
    return followUp || undefined;
  }

  async createFollowUp(followUp: InsertFollowUp): Promise<FollowUp> {
    const [created] = await db.insert(followUps).values({
      ...followUp,
      createdAt: new Date()
    }).returning();
    return created;
  }

  async updateFollowUp(id: number, followUp: Partial<InsertFollowUp>): Promise<FollowUp | undefined> {
    const [updated] = await db
      .update(followUps)
      .set(followUp)
      .where(eq(followUps.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteFollowUp(id: number): Promise<boolean> {
    const result = await db.delete(followUps).where(eq(followUps.id, id));
    return result.count > 0;
  }

  async getPendingFollowUps(): Promise<Array<FollowUp & { customer: Customer }>> {
    const result = await db
      .select()
      .from(followUps)
      .leftJoin(customers, eq(followUps.customerId, customers.id))
      .where(
        and(
          eq(followUps.completed, false),
          isNotNull(followUps.nextFollowUpDate),
          lte(followUps.nextFollowUpDate, new Date())
        )
      )
      .orderBy(asc(followUps.nextFollowUpDate));

    return result.map(row => ({
      ...row.followUps,
      customer: row.customers!
    }));
  }

  async markFollowUpComplete(
    id: number, 
    completionNotes?: string, 
    nextFollowUpDate?: Date | null, 
    nextFollowUpNotes?: string, 
    userId?: number
  ): Promise<FollowUp | undefined> {
    const [updated] = await db
      .update(followUps)
      .set({
        status: "completed",
        completionNotes,
        completedAt: new Date(),
        completedBy: userId
      })
      .where(eq(followUps.id, id))
      .returning();

    // Create next follow-up if specified
    if (updated && nextFollowUpDate && nextFollowUpNotes) {
      await this.createFollowUp({
        customerId: updated.customerId,
        followUpDate: nextFollowUpDate,
        notes: nextFollowUpNotes,
        status: "pending",
        createdBy: userId
      });
    }

    return updated || undefined;
  }

  // ===== USER OPERATIONS =====

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(asc(users.username));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values({
      ...user,
      createdAt: new Date()
    }).returning();
    return created;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.count > 0;
  }

  // ===== USER PERMISSIONS =====

  async getAllUserPermissions(): Promise<UserPermission[]> {
    return db.select().from(userPermissions);
  }

  async getUserPermissionsByRole(role: "admin" | "manager" | "designer" | "viewer"): Promise<UserPermission[]> {
    return db.select().from(userPermissions).where(eq(userPermissions.role, role));
  }

  async getUserPermission(
    role: "admin" | "manager" | "designer" | "viewer", 
    module: "customers" | "quotations" | "sales_orders" | "invoices" | "payments" | "reports" | "settings" | "users"
  ): Promise<UserPermission | undefined> {
    const [permission] = await db
      .select()
      .from(userPermissions)
      .where(and(
        eq(userPermissions.role, role),
        eq(userPermissions.module, module)
      ));
    return permission || undefined;
  }

  async createUserPermission(permission: InsertUserPermission): Promise<UserPermission> {
    const [created] = await db.insert(userPermissions).values({
      ...permission,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return created;
  }

  async updateUserPermission(id: number, permission: Partial<InsertUserPermission>): Promise<UserPermission | undefined> {
    const [updated] = await db
      .update(userPermissions)
      .set({ ...permission, updatedAt: new Date() })
      .where(eq(userPermissions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteUserPermission(id: number): Promise<boolean> {
    const result = await db.delete(userPermissions).where(eq(userPermissions.id, id));
    return result.count > 0;
  }

  async bulkUpdateUserPermissions(permissions: Array<{role: string, module: string, permissions: {canView: boolean, canCreate: boolean, canEdit: boolean, canDelete: boolean}}>): Promise<boolean> {
    try {
      for (const perm of permissions) {
        const result = await db
          .update(userPermissions)
          .set({
            canView: perm.permissions.canView,
            canCreate: perm.permissions.canCreate,
            canEdit: perm.permissions.canEdit,
            canDelete: perm.permissions.canDelete,
            updatedAt: new Date()
          })
          .where(and(
            eq(userPermissions.role, perm.role as any),
            eq(userPermissions.module, perm.module as any)
          ));

        if (result.count === 0) {
          await db.insert(userPermissions).values({
            role: perm.role as any,
            module: perm.module as any,
            canView: perm.permissions.canView,
            canCreate: perm.permissions.canCreate,
            canEdit: perm.permissions.canEdit,
            canDelete: perm.permissions.canDelete,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      return true;
    } catch (error) {
      console.error('Error in bulkUpdateUserPermissions:', error);
      return false;
    }
  }

  // ===== CUSTOMER PAYMENTS =====

  async getCustomerPayments(): Promise<CustomerPayment[]> {
    return db.select().from(customerPayments).orderBy(desc(customerPayments.createdAt));
  }

  async getCustomerPayment(id: number): Promise<CustomerPayment | undefined> {
    const [payment] = await db.select().from(customerPayments).where(eq(customerPayments.id, id));
    return payment || undefined;
  }

  async getCustomerPaymentsByCustomer(customerId: number): Promise<CustomerPayment[]> {
    return db.select().from(customerPayments)
      .where(eq(customerPayments.customerId, customerId))
      .orderBy(desc(customerPayments.createdAt));
  }

  async getCustomerPaymentByTransactionId(transactionId: string): Promise<CustomerPayment | undefined> {
    const [payment] = await db.select().from(customerPayments)
      .where(eq(customerPayments.transactionId, transactionId));
    return payment || undefined;
  }

  async createCustomerPayment(payment: InsertCustomerPayment): Promise<CustomerPayment> {
    // Generate receipt number
    const existingPayments = await db.select().from(customerPayments);
    const receiptNumber = `CP-${new Date().getFullYear()}-${String(existingPayments.length + 1).padStart(4, '0')}`;
    
    const [created] = await db.insert(customerPayments).values({
      ...payment,
      receiptNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return created;
  }

  async getCustomerBalance(customerId: number): Promise<{ balance: number }> {
    // Get total sales orders amount for the customer
    const salesOrdersResult = await db
      .select({ total: sql<number>`sum(${salesOrders.totalAmount})` })
      .from(salesOrders)
      .where(eq(salesOrders.customerId, customerId));
    
    const totalOrders = salesOrdersResult[0]?.total || 0;

    // Get total payments made by the customer  
    const paymentsResult = await db
      .select({ total: sql<number>`sum(${customerPayments.amount})` })
      .from(customerPayments)
      .where(eq(customerPayments.customerId, customerId));
    
    const totalPayments = paymentsResult[0]?.total || 0;
    
    // Balance = Total Payments - Total Orders (negative means customer owes money)
    const balance = totalPayments - totalOrders;
    return { balance };
  }

  // ===== PLACEHOLDER IMPLEMENTATIONS FOR REMAINING METHODS =====
  // These would need to be implemented for full functionality

  async getQuotations(): Promise<Quotation[]> {
    try {
      const result = await db.select().from(quotations)
        .orderBy(desc(quotations.createdAt));
      console.log(`Database getQuotations returning ${result.length} quotations`);
      return result;
    } catch (error) {
      console.error('Error fetching quotations from database:', error);
      throw error;
    }
  }

  async getQuotation(id: number): Promise<Quotation | undefined> {
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id));
    return quotation || undefined;
  }

  async getQuotationWithDetails(id: number): Promise<QuotationWithDetails | undefined> {
    try {
      const quotation = await this.getQuotation(id);
      if (!quotation) return undefined;
      
      // Get customer data
      const customer = await this.getCustomer(quotation.customerId);
      
      // Get rooms with all related data
      const roomsList = await db.select().from(rooms)
        .where(eq(rooms.quotationId, id))
        .orderBy(rooms.order);
      
      // Get all related data for each room
      const roomsWithItems: RoomWithItems[] = [];
      for (const room of roomsList) {
        const roomWithItems = {
          ...room,
          products: await this.getProducts(room.id),
          accessories: await this.getAccessories(room.id),
          images: await this.getImages(room.id),
          installationCharges: await this.getInstallationCharges(room.id)
        };
        roomsWithItems.push(roomWithItems);
      }
      
      return {
        ...quotation,
        customer: customer || null,
        rooms: roomsWithItems
      };
    } catch (error) {
      console.error('Error in getQuotationWithDetails:', error);
      return undefined;
    }
  }

  async getQuotationsByCustomer(customerId: number): Promise<Quotation[]> {
    return db.select().from(quotations)
      .where(eq(quotations.customerId, customerId))
      .orderBy(desc(quotations.createdAt));
  }

  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    // Generate quotation number if not provided
    let quotationNumber = quotation.quotationNumber;
    if (!quotationNumber) {
      const existingQuotations = await db.select().from(quotations);
      const maxNumber = existingQuotations.reduce((max, q) => {
        if (q.quotationNumber) {
          const match = q.quotationNumber.match(/Q-(\d{4})-(\d{3})/);
          if (match) {
            const number = parseInt(match[2]);
            return Math.max(max, number);
          }
        }
        return max;
      }, 0);
      quotationNumber = `Q-${new Date().getFullYear()}-${String(maxNumber + 1).padStart(3, '0')}`;
    }

    // Ensure required fields have default values to prevent NOT NULL constraint violations
    const quotationData = {
      ...quotation,
      quotationNumber,
      totalSellingPrice: quotation.totalSellingPrice ?? 0,
      totalDiscountedPrice: quotation.totalDiscountedPrice ?? 0,
      totalInstallationCharges: quotation.totalInstallationCharges ?? 0,
      installationHandling: quotation.installationHandling ?? 0,
      globalDiscount: quotation.globalDiscount ?? 0,
      gstPercentage: quotation.gstPercentage ?? 18,
      gstAmount: quotation.gstAmount ?? 0,
      finalPrice: quotation.finalPrice ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [created] = await db.insert(quotations).values(quotationData).returning();
    return created;
  }

  async updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined> {
    const [updated] = await db
      .update(quotations)
      .set({ ...quotation, updatedAt: new Date() })
      .where(eq(quotations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteQuotation(id: number): Promise<boolean> {
    const result = await db.delete(quotations).where(eq(quotations.id, id));
    return result.count > 0;
  }

  async updateQuotationPrices(quotationId: number): Promise<void> {
    // Get all rooms for this quotation
    const quotationRooms = await this.getRooms(quotationId);
    
    let totalSellingPrice = 0;
    let totalDiscountedPrice = 0;
    let totalInstallationCharges = 0;
    
    // First, update each room's prices, then calculate totals
    for (const room of quotationRooms) {
      if (!room.included) continue; // Skip excluded rooms
      
      let roomSellingPrice = 0;
      let roomDiscountedPrice = 0;
      
      // Get products for this room
      const roomProducts = await this.getProducts(room.id);
      for (const product of roomProducts) {
        roomSellingPrice += product.sellingPrice * product.quantity;
        roomDiscountedPrice += product.discountedPrice * product.quantity;
      }
      
      // Get accessories for this room
      const roomAccessories = await this.getAccessories(room.id);
      for (const accessory of roomAccessories) {
        roomSellingPrice += accessory.sellingPrice * accessory.quantity;
        roomDiscountedPrice += accessory.discountedPrice * accessory.quantity;
      }
      
      // Update room prices in database
      await db
        .update(rooms)
        .set({
          sellingPrice: roomSellingPrice,
          discountedPrice: roomDiscountedPrice
        })
        .where(eq(rooms.id, room.id));
      
      // Add to quotation totals
      totalSellingPrice += roomSellingPrice;
      totalDiscountedPrice += roomDiscountedPrice;
      
      // Get installation charges for this room
      const roomCharges = await this.getInstallationCharges(room.id);
      for (const charge of roomCharges) {
        totalInstallationCharges += charge.amount;
      }
    }
    
    // Get current quotation to preserve other fields
    const currentQuotation = await this.getQuotation(quotationId);
    if (!currentQuotation) return;
    
    // Calculate GST and final price
    const globalDiscount = currentQuotation.globalDiscount || 0;
    const discountedTotal = totalDiscountedPrice * (1 - globalDiscount / 100);
    const installationHandling = currentQuotation.installationHandling || 0;
    const subtotal = discountedTotal + totalInstallationCharges + installationHandling;
    const gstPercentage = currentQuotation.gstPercentage || 18;
    const gstAmount = subtotal * (gstPercentage / 100);
    const finalPrice = subtotal + gstAmount;
    
    // Update quotation with calculated prices
    await db
      .update(quotations)
      .set({
        totalSellingPrice,
        totalDiscountedPrice,
        totalInstallationCharges,
        gstAmount,
        finalPrice,
        updatedAt: new Date()
      })
      .where(eq(quotations.id, quotationId));
  }

  // ===== STUB IMPLEMENTATIONS =====
  // These are minimal implementations to satisfy the interface
  // Full implementations would be added as needed

  async duplicateQuotation(id: number, customerId?: number): Promise<Quotation> {
    console.log(`Duplicating quotation ${id} in database storage`);
    
    // Get the original quotation with all details
    const originalQuotation = await this.getQuotationWithDetails(id);
    if (!originalQuotation) {
      throw new Error("Original quotation not found");
    }

    // Generate new quotation number with retry logic
    const now = new Date();
    const year = now.getFullYear();
    
    let quotationNumber = '';
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      // Get all quotation numbers for this year to find the highest
      const existingQuotations = await db
        .select({ quotationNumber: quotations.quotationNumber })
        .from(quotations)
        .where(sql`quotation_number LIKE ${`Q-${year}-%`}`)
        .orderBy(quotations.quotationNumber);
      
      let nextNumber = 1;
      if (existingQuotations.length > 0) {
        // Find the highest number
        const numbers = existingQuotations
          .map(q => {
            const parts = q.quotationNumber.split('-');
            if (parts.length >= 3 && parts[2]) {
              const num = parseInt(parts[2], 10);
              return isNaN(num) ? 0 : num;
            }
            return 0;
          })
          .filter(n => n > 0);
        
        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1;
        }
      }
      
      quotationNumber = `Q-${year}-${String(nextNumber).padStart(3, '0')}`;
      
      // Check if this number already exists
      const existing = await db
        .select({ id: quotations.id })
        .from(quotations)
        .where(eq(quotations.quotationNumber, quotationNumber))
        .limit(1);
        
      if (existing.length === 0) {
        break; // Number is available
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        // Fallback: use timestamp
        quotationNumber = `Q-${year}-${String(Date.now()).slice(-6)}`;
        break;
      }
    }

    // Create the new quotation
    const [newQuotation] = await db
      .insert(quotations)
      .values({
        customerId: customerId || originalQuotation.customerId,
        quotationNumber,
        status: "draft",
        title: `${originalQuotation.title || ''} (Copy)`,
        description: originalQuotation.description,
        gstPercentage: originalQuotation.gstPercentage,
        globalDiscount: originalQuotation.globalDiscount,
        installationHandling: originalQuotation.installationHandling,
        totalSellingPrice: originalQuotation.totalSellingPrice,
        totalDiscountedPrice: originalQuotation.totalDiscountedPrice,
        totalInstallationCharges: originalQuotation.totalInstallationCharges || 0,
        gstAmount: originalQuotation.gstAmount,
        finalPrice: originalQuotation.finalPrice,
        validUntil: originalQuotation.validUntil,
        terms: originalQuotation.terms,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    console.log(`Created new quotation ${newQuotation.id} with number ${quotationNumber}`);

    // Duplicate all rooms with their items
    for (const originalRoom of originalQuotation.rooms) {
      console.log(`Duplicating room "${originalRoom.name}" with ${originalRoom.products.length} products, ${originalRoom.accessories.length} accessories, ${originalRoom.images.length} images`);
      
      // Create the new room
      const [newRoom] = await db
        .insert(rooms)
        .values({
          quotationId: newQuotation.id,
          name: originalRoom.name,
          description: originalRoom.description,
          sellingPrice: originalRoom.sellingPrice,
          discountedPrice: originalRoom.discountedPrice,
          order: originalRoom.order,
          installDescription: originalRoom.installDescription,
          widthMm: originalRoom.widthMm,
          heightMm: originalRoom.heightMm,
          areaSqft: originalRoom.areaSqft,
          pricePerSqft: originalRoom.pricePerSqft,
          installAmount: originalRoom.installAmount,
          teowinEstimateUrl: originalRoom.teowinEstimateUrl,
          teowinEstimateType: originalRoom.teowinEstimateType,
          teowinEstimateName: originalRoom.teowinEstimateName,
          included: originalRoom.included
        })
        .returning();

      // Create products for the new room
      if (originalRoom.products.length > 0) {
        const newProducts = originalRoom.products.map(product => ({
          roomId: newRoom.id,
          name: product.name,
          description: product.description,
          sellingPrice: product.sellingPrice,
          discount: product.discount,
          discountType: product.discountType,
          discountedPrice: product.discountedPrice,
          quantity: product.quantity
        }));
        
        await db.insert(products).values(newProducts);
      }

      // Create accessories for the new room
      if (originalRoom.accessories.length > 0) {
        const newAccessories = originalRoom.accessories.map(accessory => ({
          roomId: newRoom.id,
          name: accessory.name,
          description: accessory.description,
          sellingPrice: accessory.sellingPrice,
          discount: accessory.discount,
          discountType: accessory.discountType,
          discountedPrice: accessory.discountedPrice,
          quantity: accessory.quantity
        }));
        
        await db.insert(accessories).values(newAccessories);
      }

      // Create images for the new room (reference the same files)
      if (originalRoom.images.length > 0) {
        const newImages = originalRoom.images.map(image => ({
          roomId: newRoom.id,
          filename: image.filename,
          path: image.path,
          type: image.type,
          order: image.order
        }));
        
        await db.insert(images).values(newImages);
      }

      // Create installation charges for the new room
      if (originalRoom.installationCharges && originalRoom.installationCharges.length > 0) {
        const newCharges = originalRoom.installationCharges.map(charge => ({
          roomId: newRoom.id,
          cabinetType: charge.cabinetType,
          widthMm: charge.widthMm,
          heightMm: charge.heightMm,
          areaSqft: charge.areaSqft,
          pricePerSqft: charge.pricePerSqft,
          amount: charge.amount
        }));
        
        await db.insert(installationCharges).values(newCharges);
      }
    }

    console.log(`Successfully duplicated quotation ${id} as ${newQuotation.id}`);
    
    // Return the new quotation with all details
    return this.getQuotationWithDetails(newQuotation.id) as Promise<Quotation>;
  }

  async updateQuotationStatus(id: number, status: "draft" | "sent" | "approved" | "rejected" | "expired" | "converted"): Promise<Quotation | undefined> {
    const [updated] = await db
      .update(quotations)
      .set({ status, updatedAt: new Date() })
      .where(eq(quotations.id, id))
      .returning();
    return updated || undefined;
  }

  async getQuotationModifications(quotationId: number): Promise<QuotationModification[]> {
    return [];
  }

  async createQuotationModification(modification: InsertQuotationModification): Promise<QuotationModification> {
    throw new Error("Method not implemented");
  }

  async getQuotationModification(id: number): Promise<QuotationModification | undefined> {
    return undefined;
  }

  async revertQuotationToModification(quotationId: number, modificationId: number): Promise<boolean> {
    return false;
  }

  async getRooms(quotationId: number): Promise<Room[]> {
    return db.select().from(rooms)
      .where(eq(rooms.quotationId, quotationId))
      .orderBy(rooms.order);
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async getRoomWithItems(id: number): Promise<RoomWithItems | undefined> {
    const room = await this.getRoom(id);
    if (!room) return undefined;
    
    return {
      ...room,
      products: await this.getProducts(room.id),
      accessories: await this.getAccessories(room.id),
      images: await this.getImages(room.id),
      installationCharges: await this.getInstallationCharges(room.id)
    };
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    // Check if room with the same name already exists in this quotation
    const existingRooms = await db.select().from(rooms)
      .where(eq(rooms.quotationId, room.quotationId));
    
    // Case-insensitive check for duplicate room names
    const isDuplicate = existingRooms.some(existingRoom => 
      existingRoom.name.toLowerCase() === room.name.toLowerCase()
    );
    
    if (isDuplicate) {
      throw new Error(`A room with the name "${room.name}" already exists in this quotation`);
    }
    
    // Get the current highest order value for rooms in this quotation
    const maxOrder = existingRooms.length > 0 
      ? Math.max(...existingRooms.map(r => r.order))
      : -1;
    
    const roomData = {
      ...room,
      order: room.order ?? maxOrder + 1,
      sellingPrice: room.sellingPrice ?? 0,
      discountedPrice: room.discountedPrice ?? 0,
      included: room.included !== undefined ? room.included : true
    };
    
    const [created] = await db.insert(rooms).values(roomData).returning();
    
    // Update quotation prices after creating room
    await this.updateQuotationPrices(room.quotationId);
    
    return created;
  }

  async updateRoom(id: number, roomUpdate: Partial<InsertRoom>): Promise<Room | undefined> {
    const [updated] = await db
      .update(rooms)
      .set(roomUpdate)
      .where(eq(rooms.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRoom(id: number): Promise<boolean> {
    const result = await db.delete(rooms).where(eq(rooms.id, id));
    return result.rowCount > 0;
  }

  async reorderRooms(roomIds: number[]): Promise<boolean> {
    return false;
  }

  async updateRoomTeowinEstimate(roomId: number, teowinEstimateUrl: string, teowinEstimateType: string, teowinEstimateName: string): Promise<Room | undefined> {
    return undefined;
  }

  async getProducts(roomId: number): Promise<Product[]> {
    return db.select().from(products).where(eq(products.roomId, roomId));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    
    // Get room to find quotation ID
    const room = await this.getRoom(product.roomId);
    if (room) {
      await this.updateQuotationPrices(room.quotationId);
    }
    
    return created;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    return undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return false;
  }

  async getAccessories(roomId: number): Promise<Accessory[]> {
    return db.select().from(accessories).where(eq(accessories.roomId, roomId));
  }

  async getAccessory(id: number): Promise<Accessory | undefined> {
    return undefined;
  }

  async createAccessory(accessory: InsertAccessory): Promise<Accessory> {
    const [created] = await db.insert(accessories).values(accessory).returning();
    
    // Get room to find quotation ID
    const room = await this.getRoom(accessory.roomId);
    if (room) {
      await this.updateQuotationPrices(room.quotationId);
    }
    
    return created;
  }

  async updateAccessory(id: number, accessory: Partial<InsertAccessory>): Promise<Accessory | undefined> {
    return undefined;
  }

  async deleteAccessory(id: number): Promise<boolean> {
    return false;
  }

  async getImages(roomId: number): Promise<Image[]> {
    // Define the priority ordering of image types
    const typeOrderPriority: Record<string, number> = {
      'TOP VIEW 3D': 1,
      'TOP VIEW 2D': 2,
      'VIEW 1 3D': 3,
      'VIEW 1 2D': 4,
      'VIEW 2 3D': 5,
      'VIEW 2 2D': 6,
      'VIEW 3 3D': 7,
      'VIEW 3 2D': 8,
      'VIEW 4 3D': 9,
      'VIEW 4 2D': 10,
      'WARDROBE 3D': 11,
      'WARDROBE 2D': 12,
      'OTHER': 13,
    };

    const roomImages = await db.select().from(images).where(eq(images.roomId, roomId));
    
    return roomImages.sort((a, b) => {
      // First sort by type priority
      const aTypePriority = typeOrderPriority[a.type || 'OTHER'] || 999;
      const bTypePriority = typeOrderPriority[b.type || 'OTHER'] || 999;
      
      if (aTypePriority !== bTypePriority) {
        return aTypePriority - bTypePriority;
      }
      
      // If same type, then sort by order field
      return a.order - b.order;
    });
  }

  async getImage(id: number): Promise<Image | undefined> {
    const [image] = await db.select().from(images).where(eq(images.id, id));
    return image || undefined;
  }

  async createImage(image: InsertImage): Promise<Image> {
    const [created] = await db.insert(images).values(image).returning();
    return created;
  }

  async deleteImage(id: number): Promise<boolean> {
    const result = await db.delete(images).where(eq(images.id, id));
    return result.rowCount > 0;
  }

  async updateImage(id: number, imageData: any): Promise<boolean> {
    try {
      const result = await db
        .update(images)
        .set(imageData)
        .where(eq(images.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error updating image:', error);
      return false;
    }
  }

  async reorderImages(imageIds: number[]): Promise<boolean> {
    try {
      // Update order for each image
      for (let i = 0; i < imageIds.length; i++) {
        await db
          .update(images)
          .set({ order: i })
          .where(eq(images.id, imageIds[i]));
      }
      return true;
    } catch (error) {
      console.error('Error reordering images:', error);
      return false;
    }
  }

  async getInstallationCharges(roomId: number): Promise<InstallationCharge[]> {
    return db.select().from(installationCharges).where(eq(installationCharges.roomId, roomId));
  }

  async getInstallationCharge(id: number): Promise<InstallationCharge | undefined> {
    return undefined;
  }

  async createInstallationCharge(charge: any): Promise<InstallationCharge> {
    const [created] = await db.insert(installationCharges).values(charge).returning();
    
    // Get room to find quotation ID
    const room = await this.getRoom(charge.roomId);
    if (room) {
      await this.updateQuotationPrices(room.quotationId);
    }
    
    return created;
  }

  async updateInstallationCharge(id: number, charge: any): Promise<InstallationCharge | undefined> {
    return undefined;
  }

  async deleteInstallationCharge(id: number): Promise<boolean> {
    return false;
  }

  async getTeams(): Promise<Team[]> {
    return [];
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return undefined;
  }

  async getTeamWithMembers(id: number): Promise<Team & { members: User[] }> {
    throw new Error("Method not implemented");
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    throw new Error("Method not implemented");
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined> {
    return undefined;
  }

  async deleteTeam(id: number): Promise<boolean> {
    return false;
  }

  async getTeamMembers(teamId: number): Promise<User[]> {
    return [];
  }

  async addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    throw new Error("Method not implemented");
  }

  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    return false;
  }

  async getMilestones(quotationId: number): Promise<Milestone[]> {
    return [];
  }

  async getMilestone(id: number): Promise<Milestone | undefined> {
    return undefined;
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    throw new Error("Method not implemented");
  }

  async updateMilestone(id: number, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    return undefined;
  }

  async deleteMilestone(id: number): Promise<boolean> {
    return false;
  }

  async reorderMilestones(milestoneIds: number[]): Promise<boolean> {
    return false;
  }

  async updateMilestoneStatus(id: number, status: "pending" | "in_progress" | "completed" | "delayed", completedDate?: Date): Promise<Milestone | undefined> {
    return undefined;
  }

  async getAccessoryCatalog(): Promise<AccessoryCatalog[]> {
    return [];
  }

  async getAccessoryCatalogByCategory(category: "handle" | "kitchen" | "light" | "wardrobe"): Promise<AccessoryCatalog[]> {
    return [];
  }

  async getAccessoryCatalogItem(id: number): Promise<AccessoryCatalog | undefined> {
    return undefined;
  }

  async createAccessoryCatalogItem(item: InsertAccessoryCatalog): Promise<AccessoryCatalog> {
    throw new Error("Method not implemented");
  }

  async updateAccessoryCatalogItem(id: number, item: Partial<InsertAccessoryCatalog>): Promise<AccessoryCatalog | undefined> {
    return undefined;
  }

  async deleteAccessoryCatalogItem(id: number): Promise<boolean> {
    return false;
  }

  async getSalesOrders(): Promise<SalesOrder[]> {
    return db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt));
  }

  async getSalesOrdersByCustomer(customerId: number): Promise<SalesOrder[]> {
    return db.select().from(salesOrders)
      .where(eq(salesOrders.customerId, customerId))
      .orderBy(desc(salesOrders.createdAt));
  }

  async getSalesOrder(id: number): Promise<SalesOrder | undefined> {
    console.log(`Database getSalesOrder called for ID: ${id}`);
    
    try {
      const result = await db.select().from(salesOrders).where(eq(salesOrders.id, id));
      console.log(`Database getSalesOrder query result:`, result);
      
      const [salesOrder] = result;
      console.log(`Database getSalesOrder returning:`, salesOrder);
      return salesOrder || undefined;
    } catch (error) {
      console.error('Error in database getSalesOrder:', error);
      return undefined;
    }
  }

  async getSalesOrderByQuotation(quotationId: number): Promise<SalesOrder | undefined> {
    const [salesOrder] = await db.select().from(salesOrders)
      .where(eq(salesOrders.quotationId, quotationId));
    return salesOrder || undefined;
  }

  async getSalesOrderWithDetails(id: number): Promise<SalesOrder & { customer: Customer, quotation: QuotationWithDetails, payments: Payment[] } | undefined> {
    console.log(`Database getSalesOrderWithDetails called for ID: ${id}`);
    
    const salesOrder = await this.getSalesOrder(id);
    console.log(`Database getSalesOrder result:`, salesOrder);
    
    if (!salesOrder) {
      console.log(`No sales order found with ID: ${id}`);
      return undefined;
    }
    
    const customer = await this.getCustomer(salesOrder.customerId);
    console.log(`Customer found:`, customer?.name);
    
    const quotation = await this.getQuotationWithDetails(salesOrder.quotationId);
    console.log(`Quotation found:`, quotation?.quotationNumber);
    
    const orderPayments = await this.getPayments(salesOrder.id);
    console.log(`Payments found:`, orderPayments.length);
    
    if (!customer || !quotation) {
      console.log(`Missing data - customer: ${!!customer}, quotation: ${!!quotation}`);
      return undefined;
    }
    
    return {
      ...salesOrder,
      customer,
      quotation,
      payments: orderPayments
    };
  }

  async createSalesOrderFromQuotation(quotationId: number, data?: Partial<InsertSalesOrder>): Promise<SalesOrder> {
    // Get quotation details
    const quotation = await this.getQuotation(quotationId);
    if (!quotation) {
      throw new Error("Quotation not found");
    }
    
    // Update quotation status to converted
    await db.update(quotations)
      .set({ status: "converted", updatedAt: new Date() })
      .where(eq(quotations.id, quotationId));
    
    // Generate order number
    const existingOrders = await db.select().from(salesOrders);
    const maxNumber = existingOrders.reduce((max, order) => {
      if (order.orderNumber) {
        const match = order.orderNumber.match(/SO-(\d{4})-(\d{3})/);
        if (match) {
          const number = parseInt(match[2]);
          return Math.max(max, number);
        }
      }
      return max;
    }, 0);
    const orderNumber = `SO-${new Date().getFullYear()}-${String(maxNumber + 1).padStart(3, '0')}`;
    
    // Prepare insert values, ensuring dates are properly handled
    const insertData: Partial<InsertSalesOrder> = {
      orderNumber,
      quotationId,
      customerId: quotation.customerId,
      status: "pending",
      paymentStatus: "unpaid",
      totalAmount: quotation.finalPrice || 0,
      amountPaid: 0,
      amountDue: quotation.finalPrice || 0,
    };

    // Only add additional data fields that are safe
    if (data) {
      if (data.expectedDeliveryDate) {
        // Ensure expectedDeliveryDate is a proper Date object
        insertData.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
      }
      if (data.notes) {
        insertData.notes = data.notes;
      }
      // Don't pass orderDate as it should use database default
    }
    
    const [created] = await db.insert(salesOrders).values(insertData).returning();
    
    console.log(`Created sales order ${created.orderNumber} from quotation ${quotationId}, quotation status set to converted`);
    
    return created;
  }

  async updateSalesOrderStatus(id: number, status: "pending" | "confirmed" | "in_production" | "ready_for_delivery" | "delivered" | "completed" | "cancelled"): Promise<SalesOrder | undefined> {
    const [updated] = await db
      .update(salesOrders)
      .set({ status: status })
      .where(eq(salesOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async updateSalesOrder(id: number, salesOrder: Partial<InsertSalesOrder>): Promise<SalesOrder | undefined> {
    const [updated] = await db
      .update(salesOrders)
      .set(salesOrder)
      .where(eq(salesOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async cancelSalesOrder(id: number): Promise<SalesOrder | undefined> {
    const [updated] = await db
      .update(salesOrders)
      .set({ status: "cancelled" })
      .where(eq(salesOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async revertSalesOrderToQuotation(id: number): Promise<Quotation | undefined> {
    // This would require complex logic - returning undefined for now
    return undefined;
  }

  async getPayments(salesOrderId: number): Promise<Payment[]> {
    try {
      const result = await db.select().from(payments)
        .where(eq(payments.salesOrderId, salesOrderId))
        .orderBy(desc(payments.createdAt));
      return result;
    } catch (error) {
      console.error('Error fetching payments for sales order:', salesOrderId, error);
      return []; // Return empty array on error instead of throwing
    }
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return undefined;
  }

  async getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined> {
    return undefined;
  }

  async getPaymentByReceiptNumber(receiptNumber: string): Promise<Payment | undefined> {
    return undefined;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    throw new Error("Method not implemented");
  }

  async recordPayment(salesOrderId: number, amount: number, paymentMethod: "cash" | "bank_transfer" | "check" | "card" | "upi" | "other", notes?: string, paymentDate?: Date, createdBy?: number): Promise<Payment> {
    throw new Error("Method not implemented");
  }

  async deletePayment(id: number): Promise<boolean> {
    return false;
  }

  async getInvoices(): Promise<Invoice[]> {
    try {
      const result = await db.select().from(invoices)
        .orderBy(desc(invoices.createdAt));
      return result;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    try {
      const result = await db.select().from(invoices)
        .where(eq(invoices.customerId, customerId))
        .orderBy(desc(invoices.createdAt));
      return result;
    } catch (error) {
      console.error('Error fetching invoices by customer:', error);
      return [];
    }
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    try {
      const [result] = await db.select().from(invoices)
        .where(eq(invoices.id, id));
      return result || undefined;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return undefined;
    }
  }

  async getInvoiceByQuotation(quotationId: number): Promise<Invoice | undefined> {
    try {
      const [result] = await db.select().from(invoices)
        .where(eq(invoices.quotationId, quotationId));
      return result || undefined;
    } catch (error) {
      console.error('Error fetching invoice by quotation:', error);
      return undefined;
    }
  }

  async getInvoiceBySalesOrder(salesOrderId: number): Promise<Invoice | undefined> {
    try {
      // First get the sales order to find its quotation ID
      const salesOrder = await this.getSalesOrder(salesOrderId);
      if (!salesOrder) return undefined;
      
      // Then use the quotation ID to find the invoice
      return await this.getInvoiceByQuotation(salesOrder.quotationId);
    } catch (error) {
      console.error('Error fetching invoice by sales order:', error);
      return undefined;
    }
  }

  async getInvoiceWithDetails(id: number): Promise<Invoice & { customer: Customer, quotation: QuotationWithDetails } | undefined> {
    try {
      const invoice = await this.getInvoice(id);
      if (!invoice) return undefined;
      
      const customer = await this.getCustomer(invoice.customerId);
      if (!customer) return undefined;
      
      const quotation = await this.getQuotationWithDetails(invoice.quotationId);
      if (!quotation) return undefined;
      
      return {
        ...invoice,
        customer,
        quotation
      };
    } catch (error) {
      console.error('Error fetching invoice with details:', error);
      return undefined;
    }
  }

  // Helper method to generate next invoice number based on existing invoices
  private async generateNextInvoiceNumber(): Promise<string> {
    const existingInvoices = await db.select().from(invoices);
    const maxNumber = existingInvoices.reduce((max, invoice) => {
      if (invoice.invoiceNumber) {
        // Match any INV-YYYY-XXX format where XXX can be any number of digits
        const match = invoice.invoiceNumber.match(/INV-\d{4}-(\d+)/);
        if (match) {
          const number = parseInt(match[1]);
          return Math.max(max, number);
        }
      }
      return max;
    }, 0);
    return `INV-${new Date().getFullYear()}-${String(maxNumber + 1).padStart(3, '0')}`;
  }

  async createInvoiceFromQuotation(quotationId: number, data?: Partial<InsertInvoice>): Promise<Invoice> {
    // Get quotation details
    const quotation = await this.getQuotation(quotationId);
    if (!quotation) {
      throw new Error("Quotation not found");
    }
    
    // Generate invoice number using helper method
    const invoiceNumber = await this.generateNextInvoiceNumber();
    
    // Prepare insert values
    const insertData: Partial<InsertInvoice> = {
      invoiceNumber,
      quotationId,
      customerId: quotation.customerId,
      totalAmount: quotation.finalPrice || 0,
      amountPaid: 0,
      amountDue: quotation.finalPrice || 0,
      status: "pending",
      dueDate: data?.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      notes: data?.notes || null
    };
    
    const [created] = await db.insert(invoices).values(insertData).returning();
    return created;
  }

  async createInvoiceFromSalesOrder(salesOrderId: number, data?: Partial<InsertInvoice>): Promise<Invoice> {
    console.log(`Database createInvoiceFromSalesOrder called with ID: ${salesOrderId}`);
    
    // Get the sales order with details
    const salesOrder = await this.getSalesOrder(salesOrderId);
    console.log(`Database createInvoiceFromSalesOrder - salesOrder result:`, salesOrder);
    
    if (!salesOrder) {
      console.error(`Database createInvoiceFromSalesOrder - Sales Order with ID ${salesOrderId} not found`);
      throw new Error(`Sales Order with ID ${salesOrderId} not found`);
    }
    
    // Get the quotation
    const quotation = await this.getQuotation(salesOrder.quotationId);
    if (!quotation) {
      throw new Error(`Quotation with ID ${salesOrder.quotationId} not found`);
    }
    
    // Check if the quotation is already converted to an invoice
    const existingInvoice = await this.getInvoiceByQuotation(quotation.id);
    if (existingInvoice) {
      throw new Error(`Quotation with ID ${quotation.id} is already converted to Invoice #${existingInvoice.invoiceNumber}`);
    }
    
    // Generate invoice number using helper method
    const invoiceNumber = await this.generateNextInvoiceNumber();
    
    // Prepare insert values
    const insertData: Partial<InsertInvoice> = {
      invoiceNumber,
      quotationId: quotation.id,
      customerId: quotation.customerId,
      totalAmount: salesOrder.totalAmount,
      amountPaid: salesOrder.amountPaid,
      amountDue: salesOrder.amountDue,
      status: salesOrder.paymentStatus === 'paid' ? 'paid' : (salesOrder.paymentStatus === 'partially_paid' ? 'partially_paid' : 'pending'),
      dueDate: data?.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      notes: data?.notes || null
    };
    
    const [created] = await db.insert(invoices).values(insertData).returning();
    return created;
  }

  async updateInvoiceStatus(id: number, status: "pending" | "paid" | "partially_paid" | "overdue" | "cancelled"): Promise<Invoice | undefined> {
    try {
      const [updated] = await db
        .update(invoices)
        .set({ status: status })
        .where(eq(invoices.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating invoice status:', error);
      return undefined;
    }
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    try {
      const [updated] = await db
        .update(invoices)
        .set(invoice)
        .where(eq(invoices.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return undefined;
    }
  }

  async cancelInvoice(id: number): Promise<Invoice | undefined> {
    return await this.updateInvoiceStatus(id, 'cancelled');
  }

  async getAllPayments(): Promise<Payment[]> {
    return [];
  }

  async getAllMilestones(): Promise<Milestone[]> {
    return [];
  }

  async createSalesOrder(salesOrder: InsertSalesOrder): Promise<SalesOrder> {
    try {
      const [created] = await db.insert(salesOrders).values(salesOrder).returning();
      return created;
    } catch (error) {
      console.error('Error creating sales order:', error);
      throw error;
    }
  }

  async revertSalesOrderToQuotation(id: number): Promise<Quotation | undefined> {
    try {
      console.log(`Database revertSalesOrderToQuotation called for ID: ${id}`);
      
      // Get the sales order
      const salesOrder = await this.getSalesOrder(id);
      if (!salesOrder) {
        console.error(`Sales Order with ID ${id} not found`);
        return undefined;
      }
      
      console.log(`Found sales order:`, salesOrder);
      
      // Check if the sales order has payments
      if (salesOrder.amountPaid > 0) {
        throw new Error("Cannot revert a sales order with payments");
      }
      
      // Check if the sales order is completed, delivered, or cancelled
      if (['completed', 'delivered', 'cancelled'].includes(salesOrder.status)) {
        throw new Error(`Cannot revert a sales order with status '${salesOrder.status}'`);
      }
      
      // Get the associated quotation
      const quotation = await this.getQuotation(salesOrder.quotationId);
      if (!quotation) {
        console.error(`Quotation with ID ${salesOrder.quotationId} not found`);
        return undefined;
      }
      
      console.log(`Found quotation:`, quotation);
      
      // Update the quotation status back to 'approved' (not draft, to maintain approval)
      const [updatedQuotation] = await db
        .update(quotations)
        .set({ status: 'approved' })
        .where(eq(quotations.id, quotation.id))
        .returning();
      
      console.log(`Updated quotation status to approved:`, updatedQuotation);
      
      // Remove the sales order
      await db.delete(salesOrders).where(eq(salesOrders.id, id));
      
      console.log(`Deleted sales order with ID: ${id}`);
      
      return updatedQuotation;
    } catch (error) {
      console.error('Error reverting sales order to quotation:', error);
      throw error;
    }
  }
}

// Create instance for export
export const databaseStorage = new DatabaseStorage();