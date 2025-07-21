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
    const paymentsResult = await db
      .select({ total: sql<number>`sum(${customerPayments.amount})` })
      .from(customerPayments)
      .where(eq(customerPayments.customerId, customerId));
    
    const totalPayments = paymentsResult[0]?.total || 0;
    
    // For now, just return negative payments as balance (indicating credit)
    // In a full implementation, you'd subtract total order amounts
    return { balance: -totalPayments };
  }

  // ===== PLACEHOLDER IMPLEMENTATIONS FOR REMAINING METHODS =====
  // These would need to be implemented for full functionality

  async getQuotations(): Promise<Quotation[]> {
    return db.select().from(quotations).orderBy(desc(quotations.createdAt));
  }

  async getQuotation(id: number): Promise<Quotation | undefined> {
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id));
    return quotation || undefined;
  }

  async getQuotationWithDetails(id: number): Promise<QuotationWithDetails | undefined> {
    const quotation = await this.getQuotation(id);
    if (!quotation) return undefined;
    
    // Get customer data
    const customer = await this.getCustomer(quotation.customerId);
    
    // Get rooms with basic data (products/accessories/images would need separate queries)
    const roomsList = await db.select().from(rooms)
      .where(eq(rooms.quotationId, id))
      .orderBy(rooms.order);
    
    const roomsWithItems: RoomWithItems[] = roomsList.map(room => ({
      ...room,
      products: [], // Would need separate query
      accessories: [], // Would need separate query
      images: [], // Would need separate query
      installationCharges: [] // Would need separate query
    }));
    
    return {
      ...quotation,
      customer: customer || null,
      rooms: roomsWithItems
    };
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

    const [created] = await db.insert(quotations).values({
      ...quotation,
      quotationNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
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

  // ===== STUB IMPLEMENTATIONS =====
  // These are minimal implementations to satisfy the interface
  // Full implementations would be added as needed

  async duplicateQuotation(id: number, customerId?: number): Promise<Quotation> {
    throw new Error("Method not implemented");
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
    return [];
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return undefined;
  }

  async getRoomWithItems(id: number): Promise<RoomWithItems | undefined> {
    return undefined;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [created] = await db.insert(rooms).values(room).returning();
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
    return [];
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    throw new Error("Method not implemented");
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    return undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return false;
  }

  async getAccessories(roomId: number): Promise<Accessory[]> {
    return [];
  }

  async getAccessory(id: number): Promise<Accessory | undefined> {
    return undefined;
  }

  async createAccessory(accessory: InsertAccessory): Promise<Accessory> {
    throw new Error("Method not implemented");
  }

  async updateAccessory(id: number, accessory: Partial<InsertAccessory>): Promise<Accessory | undefined> {
    return undefined;
  }

  async deleteAccessory(id: number): Promise<boolean> {
    return false;
  }

  async getImages(roomId: number): Promise<Image[]> {
    return [];
  }

  async getImage(id: number): Promise<Image | undefined> {
    return undefined;
  }

  async createImage(image: InsertImage): Promise<Image> {
    throw new Error("Method not implemented");
  }

  async deleteImage(id: number): Promise<boolean> {
    return false;
  }

  async reorderImages(imageIds: number[]): Promise<boolean> {
    return false;
  }

  async getInstallationCharges(roomId: number): Promise<InstallationCharge[]> {
    return [];
  }

  async getInstallationCharge(id: number): Promise<InstallationCharge | undefined> {
    return undefined;
  }

  async createInstallationCharge(charge: any): Promise<InstallationCharge> {
    throw new Error("Method not implemented");
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
    const [salesOrder] = await db.select().from(salesOrders).where(eq(salesOrders.id, id));
    return salesOrder || undefined;
  }

  async getSalesOrderByQuotation(quotationId: number): Promise<SalesOrder | undefined> {
    const [salesOrder] = await db.select().from(salesOrders)
      .where(eq(salesOrders.quotationId, quotationId));
    return salesOrder || undefined;
  }

  async getSalesOrderWithDetails(id: number): Promise<SalesOrder & { customer: Customer, quotation: QuotationWithDetails, payments: Payment[] } | undefined> {
    const salesOrder = await this.getSalesOrder(id);
    if (!salesOrder) return undefined;
    
    const customer = await this.getCustomer(salesOrder.customerId);
    const quotation = await this.getQuotationWithDetails(salesOrder.quotationId);
    const orderPayments = await this.getPayments(salesOrder.id);
    
    if (!customer || !quotation) return undefined;
    
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
    
    const [created] = await db.insert(salesOrders).values({
      orderNumber,
      quotationId,
      customerId: quotation.customerId,
      status: "pending",
      orderStatus: "pending",
      paymentStatus: "pending",
      totalAmount: quotation.finalPrice || 0,
      paidAmount: 0,
      balanceAmount: quotation.finalPrice || 0,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return created;
  }

  async updateSalesOrderStatus(id: number, status: "pending" | "confirmed" | "in_production" | "ready_for_delivery" | "delivered" | "completed" | "cancelled"): Promise<SalesOrder | undefined> {
    const [updated] = await db
      .update(salesOrders)
      .set({ orderStatus: status, updatedAt: new Date() })
      .where(eq(salesOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async updateSalesOrder(id: number, salesOrder: Partial<InsertSalesOrder>): Promise<SalesOrder | undefined> {
    const [updated] = await db
      .update(salesOrders)
      .set({ ...salesOrder, updatedAt: new Date() })
      .where(eq(salesOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async cancelSalesOrder(id: number): Promise<SalesOrder | undefined> {
    const [updated] = await db
      .update(salesOrders)
      .set({ orderStatus: "cancelled", updatedAt: new Date() })
      .where(eq(salesOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async revertSalesOrderToQuotation(id: number): Promise<Quotation | undefined> {
    // This would require complex logic - returning undefined for now
    return undefined;
  }

  async getPayments(salesOrderId: number): Promise<Payment[]> {
    return db.select().from(payments)
      .where(eq(payments.salesOrderId, salesOrderId))
      .orderBy(desc(payments.createdAt));
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
    return [];
  }

  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    return [];
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return undefined;
  }

  async getInvoiceByQuotation(quotationId: number): Promise<Invoice | undefined> {
    return undefined;
  }

  async getInvoiceBySalesOrder(salesOrderId: number): Promise<Invoice | undefined> {
    return undefined;
  }

  async getInvoiceWithDetails(id: number): Promise<Invoice & { customer: Customer, quotation: QuotationWithDetails } | undefined> {
    return undefined;
  }

  async createInvoiceFromQuotation(quotationId: number, data?: Partial<InsertInvoice>): Promise<Invoice> {
    throw new Error("Method not implemented");
  }

  async createInvoiceFromSalesOrder(salesOrderId: number, data?: Partial<InsertInvoice>): Promise<Invoice> {
    throw new Error("Method not implemented");
  }

  async updateInvoiceStatus(id: number, status: "pending" | "paid" | "partially_paid" | "overdue" | "cancelled"): Promise<Invoice | undefined> {
    return undefined;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    return undefined;
  }

  async cancelInvoice(id: number): Promise<Invoice | undefined> {
    return undefined;
  }

  async getAllPayments(): Promise<Payment[]> {
    return [];
  }

  async getAllMilestones(): Promise<Milestone[]> {
    return [];
  }

  async createSalesOrder(salesOrder: InsertSalesOrder): Promise<SalesOrder> {
    throw new Error("Method not implemented");
  }
}

// Create instance for export
export const databaseStorage = new DatabaseStorage();