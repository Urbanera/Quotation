import {
  companySettings, CompanySettings, InsertCompanySettings,
  appSettings, AppSettings, InsertAppSettings,
  customers, Customer, InsertCustomer,
  quotations, Quotation, InsertQuotation, quotationStatusEnum,
  rooms, Room, InsertRoom,
  products, Product, InsertProduct,
  accessories, Accessory, InsertAccessory,
  images, Image, InsertImage,
  InstallationCharge,
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
  invoices, Invoice, InsertInvoice, invoiceStatusEnum
} from "@shared/schema";

export interface IStorage {
  // Settings operations
  getCompanySettings(): Promise<CompanySettings | undefined>;
  updateCompanySettings(settings: Partial<InsertCompanySettings>): Promise<CompanySettings>;
  updateCompanyLogo(logoUrl: string): Promise<CompanySettings>;
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings>;
  
  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomersByStage(stage: string): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByEmailOrPhone(email: string, phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: InsertCustomer): Promise<Customer | undefined>;
  updateCustomerStage(id: number, stage: string): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Customer Follow-up operations
  getAllFollowUps(): Promise<FollowUp[]>;
  getFollowUps(customerId: number): Promise<FollowUp[]>;
  getFollowUp(id: number): Promise<FollowUp | undefined>;
  createFollowUp(followUp: InsertFollowUp): Promise<FollowUp>;
  updateFollowUp(id: number, followUp: Partial<InsertFollowUp>): Promise<FollowUp | undefined>;
  deleteFollowUp(id: number): Promise<boolean>;
  getPendingFollowUps(): Promise<Array<FollowUp & { customer: Customer }>>;
  markFollowUpComplete(id: number, completionNotes?: string, nextFollowUpDate?: Date | null, nextFollowUpNotes?: string, userId?: number): Promise<FollowUp | undefined>;
  
  // Quotation operations
  getQuotations(): Promise<Quotation[]>;
  getQuotation(id: number): Promise<Quotation | undefined>;
  getQuotationWithDetails(id: number): Promise<QuotationWithDetails | undefined>;
  getQuotationsByCustomer(customerId: number): Promise<Quotation[]>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined>;
  deleteQuotation(id: number): Promise<boolean>;
  duplicateQuotation(id: number, customerId?: number): Promise<Quotation>;
  updateQuotationStatus(id: number, status: "draft" | "sent" | "approved" | "rejected" | "expired" | "converted"): Promise<Quotation | undefined>;
  
  // Room operations
  getRooms(quotationId: number): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  getRoomWithItems(id: number): Promise<RoomWithItems | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;
  reorderRooms(roomIds: number[]): Promise<boolean>;
  
  // Product operations
  getProducts(roomId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Accessory operations
  getAccessories(roomId: number): Promise<Accessory[]>;
  getAccessory(id: number): Promise<Accessory | undefined>;
  createAccessory(accessory: InsertAccessory): Promise<Accessory>;
  updateAccessory(id: number, accessory: Partial<InsertAccessory>): Promise<Accessory | undefined>;
  deleteAccessory(id: number): Promise<boolean>;
  
  // Image operations
  getImages(roomId: number): Promise<Image[]>;
  getImage(id: number): Promise<Image | undefined>;
  createImage(image: InsertImage): Promise<Image>;
  deleteImage(id: number): Promise<boolean>;
  reorderImages(imageIds: number[]): Promise<boolean>;
  
  // Installation charge operations
  getInstallationCharges(roomId: number): Promise<InstallationCharge[]>;
  getInstallationCharge(id: number): Promise<InstallationCharge | undefined>;
  createInstallationCharge(charge: InstallationCharge): Promise<InstallationCharge>;
  updateInstallationCharge(id: number, charge: Partial<InstallationCharge>): Promise<InstallationCharge | undefined>;
  deleteInstallationCharge(id: number): Promise<boolean>;
  
  // User operations
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Team operations
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  getTeamWithMembers(id: number): Promise<Team & { members: User[] }>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  
  // Team Member operations
  getTeamMembers(teamId: number): Promise<User[]>;
  addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: number): Promise<boolean>;
  
  // Project Timeline operations
  getMilestones(quotationId: number): Promise<Milestone[]>;
  getMilestone(id: number): Promise<Milestone | undefined>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: number): Promise<boolean>;
  reorderMilestones(milestoneIds: number[]): Promise<boolean>;
  updateMilestoneStatus(id: number, status: "pending" | "in_progress" | "completed" | "delayed", completedDate?: Date): Promise<Milestone | undefined>;
  
  // Accessory Catalog operations
  getAccessoryCatalog(): Promise<AccessoryCatalog[]>;
  getAccessoryCatalogByCategory(category: "handle" | "kitchen" | "light" | "wardrobe"): Promise<AccessoryCatalog[]>;
  getAccessoryCatalogItem(id: number): Promise<AccessoryCatalog | undefined>;
  createAccessoryCatalogItem(item: InsertAccessoryCatalog): Promise<AccessoryCatalog>;
  updateAccessoryCatalogItem(id: number, item: Partial<InsertAccessoryCatalog>): Promise<AccessoryCatalog | undefined>;
  deleteAccessoryCatalogItem(id: number): Promise<boolean>;

  // Sales Order operations
  getSalesOrders(): Promise<SalesOrder[]>;
  getSalesOrdersByCustomer(customerId: number): Promise<SalesOrder[]>;
  getSalesOrder(id: number): Promise<SalesOrder | undefined>;
  getSalesOrderByQuotation(quotationId: number): Promise<SalesOrder | undefined>;
  getSalesOrderWithDetails(id: number): Promise<SalesOrder & { 
    customer: Customer, 
    quotation: QuotationWithDetails, 
    payments: Payment[] 
  } | undefined>;
  createSalesOrderFromQuotation(quotationId: number, data?: Partial<InsertSalesOrder>): Promise<SalesOrder>;
  updateSalesOrderStatus(id: number, status: "pending" | "confirmed" | "in_production" | "ready_for_delivery" | "delivered" | "completed" | "cancelled"): Promise<SalesOrder | undefined>;
  updateSalesOrder(id: number, salesOrder: Partial<InsertSalesOrder>): Promise<SalesOrder | undefined>;
  cancelSalesOrder(id: number): Promise<SalesOrder | undefined>;
  
  // Payment operations
  getPayments(salesOrderId: number): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined>;
  getPaymentByReceiptNumber(receiptNumber: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  recordPayment(
    salesOrderId: number, 
    amount: number, 
    paymentMethod: "cash" | "bank_transfer" | "check" | "card" | "upi" | "other", 
    notes?: string,
    paymentDate?: Date,
    createdBy?: number
  ): Promise<Payment>;
  deletePayment(id: number): Promise<boolean>;
  
  // Customer Payment operations (direct payments without sales orders)
  getCustomerPayments(): Promise<CustomerPayment[]>;
  getCustomerPayment(id: number): Promise<CustomerPayment | undefined>;
  getCustomerPaymentsByCustomer(customerId: number): Promise<CustomerPayment[]>;
  getCustomerPaymentByTransactionId(transactionId: string): Promise<CustomerPayment | undefined>;
  createCustomerPayment(payment: InsertCustomerPayment): Promise<CustomerPayment>;
  
  // Invoice operations
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByCustomer(customerId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByQuotation(quotationId: number): Promise<Invoice | undefined>;
  getInvoiceBySalesOrder(salesOrderId: number): Promise<Invoice | undefined>;
  getInvoiceWithDetails(id: number): Promise<Invoice & { 
    customer: Customer, 
    quotation: QuotationWithDetails
  } | undefined>;
  createInvoiceFromQuotation(quotationId: number, data?: Partial<InsertInvoice>): Promise<Invoice>;
  createInvoiceFromSalesOrder(salesOrderId: number, data?: Partial<InsertInvoice>): Promise<Invoice>;
  updateInvoiceStatus(id: number, status: "pending" | "paid" | "partially_paid" | "overdue" | "cancelled"): Promise<Invoice | undefined>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  cancelInvoice(id: number): Promise<Invoice | undefined>;
}

export class MemStorage implements IStorage {
  private companySettings: CompanySettings | undefined;
  private appSettings: AppSettings | undefined;
  private customers: Map<number, Customer>;
  private quotations: Map<number, Quotation>;
  private rooms: Map<number, Room>;
  private products: Map<number, Product>;
  private accessories: Map<number, Accessory>;
  private images: Map<number, Image>;
  private installationCharges: Map<number, InstallationCharge>;
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private teamMembers: Map<number, TeamMember>;
  private followUps: Map<number, FollowUp>;
  private milestones: Map<number, Milestone>;
  private accessoryCatalogItems: Map<number, AccessoryCatalog>;
  private salesOrders: Map<number, SalesOrder>;
  private payments: Map<number, Payment>;
  private customerPayments: Map<number, CustomerPayment>;
  private invoices: Map<number, Invoice>;
  
  private customerIdCounter: number;
  private quotationIdCounter: number;
  private roomIdCounter: number;
  private productIdCounter: number;
  private accessoryIdCounter: number;
  private imageIdCounter: number;
  private installationChargeIdCounter: number;
  private userIdCounter: number;
  private teamIdCounter: number;
  private teamMemberIdCounter: number;
  private followUpIdCounter: number;
  private milestoneIdCounter: number;
  private accessoryCatalogIdCounter: number;
  private salesOrderIdCounter: number;
  private paymentIdCounter: number;
  private customerPaymentIdCounter: number;
  private invoiceIdCounter: number;
  
  constructor() {
    // Create singleton instance of storage to persist data between server reloads
    if ((global as any).__memStorageInstance) {
      console.log("Using existing MemStorage instance from global");
      const instance = (global as any).__memStorageInstance;
      
      // Copy all properties from existing instance
      this.customers = instance.customers;
      this.quotations = instance.quotations;
      this.rooms = instance.rooms;
      this.products = instance.products;
      this.accessories = instance.accessories;
      this.images = instance.images;
      this.installationCharges = instance.installationCharges;
      this.users = instance.users;
      this.teams = instance.teams;
      this.teamMembers = instance.teamMembers;
      this.followUps = instance.followUps;
      this.milestones = instance.milestones;
      this.accessoryCatalogItems = instance.accessoryCatalogItems;
      this.salesOrders = instance.salesOrders;
      this.payments = instance.payments;
      this.customerPayments = instance.customerPayments;
      this.invoices = instance.invoices;
      
      this.companySettings = instance.companySettings;
      this.appSettings = instance.appSettings;
      
      this.customerIdCounter = instance.customerIdCounter;
      this.quotationIdCounter = instance.quotationIdCounter;
      this.roomIdCounter = instance.roomIdCounter;
      this.productIdCounter = instance.productIdCounter;
      this.accessoryIdCounter = instance.accessoryIdCounter;
      this.imageIdCounter = instance.imageIdCounter;
      this.installationChargeIdCounter = instance.installationChargeIdCounter;
      this.userIdCounter = instance.userIdCounter;
      this.teamIdCounter = instance.teamIdCounter;
      this.teamMemberIdCounter = instance.teamMemberIdCounter;
      this.followUpIdCounter = instance.followUpIdCounter;
      this.milestoneIdCounter = instance.milestoneIdCounter;
      this.accessoryCatalogIdCounter = instance.accessoryCatalogIdCounter;
      this.salesOrderIdCounter = instance.salesOrderIdCounter;
      this.paymentIdCounter = instance.paymentIdCounter;
      this.customerPaymentIdCounter = instance.customerPaymentIdCounter;
      this.invoiceIdCounter = instance.invoiceIdCounter;
      
      console.log(`Restored data with ${this.customers.size} customers, ${this.salesOrders.size} sales orders, ${this.customerPayments.size} customer payments, ${this.invoices.size} invoices`);
      
      return;
    }
    
    console.log("Creating new MemStorage instance");
    this.customers = new Map();
    this.quotations = new Map();
    this.rooms = new Map();
    this.products = new Map();
    this.accessories = new Map();
    this.images = new Map();
    this.installationCharges = new Map();
    this.users = new Map();
    this.teams = new Map();
    this.teamMembers = new Map();
    this.followUps = new Map();
    this.milestones = new Map();
    this.accessoryCatalogItems = new Map();
    this.salesOrders = new Map();
    this.payments = new Map();
    this.customerPayments = new Map();
    this.invoices = new Map();
    
    this.customerIdCounter = 1;
    this.quotationIdCounter = 1;
    this.roomIdCounter = 1;
    this.productIdCounter = 1;
    this.accessoryIdCounter = 1;
    this.imageIdCounter = 1;
    this.installationChargeIdCounter = 1;
    this.userIdCounter = 1;
    this.teamIdCounter = 1;
    this.teamMemberIdCounter = 1;
    this.followUpIdCounter = 1;
    this.milestoneIdCounter = 1;
    this.accessoryCatalogIdCounter = 1;
    this.salesOrderIdCounter = 1;
    this.paymentIdCounter = 1;
    this.customerPaymentIdCounter = 1;
    this.invoiceIdCounter = 1;
    
    // Add some initial data
    this.initializeData();
  }

  private initializeData() {
    // Initialize company settings
    this.companySettings = {
      id: 1,
      name: "Interio Designs",
      address: "123 Design Avenue, Suite 456, Design District",
      phone: "+1 (555) 123-4567",
      email: "info@interiodesigns.com",
      website: "https://www.interiodesigns.com",
      logo: null,
      taxId: "TAX123456789",
      updatedAt: new Date()
    };

    // Initialize app settings
    this.appSettings = {
      id: 1,
      defaultGlobalDiscount: 5,
      defaultGstPercentage: 18,
      defaultTermsAndConditions: "1. All prices are valid for 30 days from quotation date.\n2. 50% advance payment required to start work.\n3. Balance payment due upon completion.\n4. Material colors may vary slightly from samples.\n5. Changes to design after approval may incur additional charges.",
      receiptTermsAndConditions: "1. Receipt is valid only when payment is confirmed.\n2. All payments are non-refundable unless otherwise specified.\n3. Please retain this receipt for your records and warranty claims.\n4. For any disputes regarding payment, please contact us within 7 days of receipt.",
      presentationTermsAndConditions: "1. Scope of Work\nLecco Cucina agrees to perform the production and services outlined in our individual product dossier document.\n\n2. Taxes\nApplicable taxes will be charged in accordance with Government policies in effect at the time of signing.\n\n3. Order Confirmation\na) This offer should be reviewed in conjunction with the designs and specifications considered at the time of confirmation.\nb) Any modifications to the designs, finishes or additional selections of accessories will result in a revised quote.\nc) A final agreement document must be signed by both Lecco Cucina Experience Centre and the client to confirm the order.\nd) In the event of any disagreement post-order finalization, this document will be deemed as the final agreement.\ne) No changes or alterations to the design, finishes or addition of accessories will be permitted after order confirmation. The order cannot be cancelled once confirmed, the customer is required to remit 100% payment towards the orders placed with Lecco Cucina Experience Centre.\nf) Product colours may vary within a range of 7 to 10% due to differences in production batches or intentional use of similar shades. Such variations will not be considered as material defects.\n\n4. Payment Terms\ni. Token Advance Payment: 20% of the total amount including taxes is required for the order confirmation.\nii. Order Punching Payment: 30% of the total amount (excluding 20% token advance payment), including taxes is due at the time of order punching.\niii. Final Payment: 50% of the total amount, including taxes is to be paid 10 days before the dispatch of the order.\niv. Appliances, Counter Top, dado Tiles, Sink, Faucets and others: 100% payment is required during order finalization.\nv. Urban Ladder Products: 100% payment is required during order confirmation.\nvi. Outstation Deliveries:\n• Special packing, Transportation, freight, insurance and unloading charges will be applicable.\n• Travel, boarding and lodging charges for the installation team for all outstation executions will be billed on an actual basis.\n\nProduction Timeline (approx.): Plain laminate, Grain laminate & High Gloss Finishes delivered in 30 days. Soft Extra Matt & Classic Lacquer delivered in 45 days.\n\n5. Delivery & Installation Terms\na. Delivery Period: The estimated product delivery period is 30 to 45 days, depending on the finish.\nb. Delivery Acceptance: Delivery date must be confirmed and accepted within the first 14 days following the notification of the scheduled dispatch date.\nc. Warehousing: Free warehousing for the material is provided only for up to 14 days following the notification of the scheduled dispatch date. Any additional storage days required beyond this period will incur additional charges, which will be communicated via email and will be at the client's risk.",
      quotationTemplateId: "default",
      presentationTemplateId: "default",
      updatedAt: new Date()
    };
    
    // Add a demo customer
    const customer: Customer = {
      id: this.customerIdCounter++,
      name: "Demo Customer",
      email: "demo@example.com",
      phone: "9988776655",
      address: "123 Demo Street",
      createdAt: new Date(),
    };
    this.customers.set(customer.id, customer);
    
    // Add admin user
    const adminUser: User = {
      id: this.userIdCounter++,
      username: "admin",
      password: "AdminPass123", // This would be hashed in a real application
      email: "admin@example.com",
      fullName: "Administrator",
      role: "admin",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);
    
    // Add a design team
    const designTeam: Team = {
      id: this.teamIdCounter++,
      name: "Core Design Team",
      description: "Main team of designers working on all projects",
      createdAt: new Date()
    };
    this.teams.set(designTeam.id, designTeam);
    
    // Add admin to the design team
    const teamMember: TeamMember = {
      id: this.teamMemberIdCounter++,
      teamId: designTeam.id,
      userId: adminUser.id,
      createdAt: new Date()
    };
    this.teamMembers.set(teamMember.id, teamMember);
    
    // Add a sample follow-up for the demo customer
    const followUp: FollowUp = {
      id: this.followUpIdCounter++,
      customerId: customer.id,
      notes: "Initial meeting to discuss requirements",
      interactionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      nextFollowUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days in future
      completed: false,
      userId: adminUser.id,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    };
    this.followUps.set(followUp.id, followUp);
    
    // Create a demo quotation for project timeline
    const now = new Date();
    const quotation: Quotation = {
      id: this.quotationIdCounter++,
      customerId: customer.id,
      quotationNumber: "Q-2025-001",
      status: "draft",
      title: "Kitchen Renovation Demo",
      description: "Complete kitchen redesign with modern appliances",
      gstPercentage: 7,
      globalDiscount: 5,
      installationHandling: 500,
      totalSellingPrice: 15000,
      totalDiscountedPrice: 14250,
      gstAmount: 1032.5,
      finalPrice: 15782.5,
      validUntil: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
      terms: "Standard terms and conditions apply",
      createdAt: now,
      updatedAt: now
    };
    this.quotations.set(quotation.id, quotation);
    
    // Add project timeline milestones for the demo quotation
    const milestones = this.createDefaultProjectMilestones(quotation.id, now);
    
    // Add milestones to the storage
    milestones.forEach(milestone => {
      this.milestones.set(milestone.id, milestone);
    });
    
    // Add sample accessory catalog items
    const accessoryCatalogItems = [
      {
        id: this.accessoryCatalogIdCounter++,
        category: "handle" as const,
        code: "LH-101",
        name: "Modern Chrome Pull Handle",
        description: "Sleek chrome finish handle for modern cabinet designs",
        sellingPrice: 850,
        kitchenPrice: 850,
        wardrobePrice: 850,
        size: "128mm",
        image: "handle-chrome.jpg",
        createdAt: new Date()
      },
      {
        id: this.accessoryCatalogIdCounter++,
        category: "handle" as const,
        code: "LH-203",
        name: "Brushed Gold Cabinet Handle",
        description: "Elegant brushed gold finish for luxury cabinets",
        sellingPrice: 1200,
        kitchenPrice: 1200,
        wardrobePrice: 1200,
        size: "160mm",
        image: "handle-gold.jpg",
        createdAt: new Date()
      },
      {
        id: this.accessoryCatalogIdCounter++,
        category: "kitchen" as const,
        code: "LK-305",
        name: "Pull-Out Spice Rack",
        description: "Space-saving pull-out spice rack for kitchen cabinets",
        sellingPrice: 3500,
        kitchenPrice: 3500,
        wardrobePrice: null,
        size: "400mm width",
        image: "kitchen-spice-rack.jpg",
        createdAt: new Date()
      },
      {
        id: this.accessoryCatalogIdCounter++,
        category: "light" as const,
        code: "LL-405",
        name: "LED Cabinet Light Strip",
        description: "Energy-efficient LED strip for under-cabinet lighting",
        sellingPrice: 1800,
        kitchenPrice: 1800,
        wardrobePrice: 1800,
        size: "1m",
        image: "light-led-strip.jpg",
        createdAt: new Date()
      },
      {
        id: this.accessoryCatalogIdCounter++,
        category: "wardrobe" as const,
        code: "LW-503",
        name: "Pull-Out Trouser Rack",
        description: "Extendable rack for organizing trousers and pants",
        sellingPrice: 2600,
        kitchenPrice: null,
        wardrobePrice: 2600,
        size: "600mm width",
        image: "wardrobe-trouser-rack.jpg",
        createdAt: new Date()
      }
    ];
    
    // Add accessory catalog items to storage
    accessoryCatalogItems.forEach(item => {
      this.accessoryCatalogItems.set(item.id, item);
    });
  }
  
  // Settings operations
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    return this.companySettings;
  }

  async updateCompanySettings(settings: Partial<InsertCompanySettings>): Promise<CompanySettings> {
    if (!this.companySettings) {
      this.companySettings = {
        id: 1,
        name: settings.name || "Company Name",
        address: settings.address || "Company Address",
        phone: settings.phone || "Phone Number",
        email: settings.email || "email@example.com",
        website: settings.website || "",
        logo: settings.logo || null,
        taxId: settings.taxId || "",
        updatedAt: new Date()
      };
    } else {
      this.companySettings = {
        ...this.companySettings,
        ...settings,
        updatedAt: new Date()
      };
    }
    return this.companySettings;
  }

  async getAppSettings(): Promise<AppSettings | undefined> {
    return this.appSettings;
  }

  async updateCompanyLogo(logoUrl: string): Promise<CompanySettings> {
    // Make sure we have company settings first
    if (!this.companySettings) {
      await this.getCompanySettings();
    }
    
    // Update just the logo field
    return this.updateCompanySettings({
      logo: logoUrl
    });
  }

  async updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings> {
    if (!this.appSettings) {
      this.appSettings = {
        id: 1,
        defaultGlobalDiscount: settings.defaultGlobalDiscount || 0,
        defaultGstPercentage: settings.defaultGstPercentage || 18,
        defaultTermsAndConditions: settings.defaultTermsAndConditions || "",
        receiptTermsAndConditions: settings.receiptTermsAndConditions || "",
        presentationTermsAndConditions: settings.presentationTermsAndConditions || "",
        quotationTemplateId: settings.quotationTemplateId || "default",
        presentationTemplateId: settings.presentationTemplateId || "default",
        requiredAccessories: settings.requiredAccessories || "skirting,handles,sliding mechanism,t profile",
        leadSourceOptions: settings.leadSourceOptions || "walk-in,website,referral,social media,other",
        updatedAt: new Date()
      };
    } else {
      this.appSettings = {
        ...this.appSettings,
        ...settings,
        updatedAt: new Date()
      };
    }
    return this.appSettings;
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async getCustomersByStage(stage: string): Promise<Customer[]> {
    if (!stage || stage === 'all') {
      return this.getCustomers();
    }
    return Array.from(this.customers.values()).filter(customer => 
      customer.stage === stage
    );
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async getCustomerByEmailOrPhone(email: string, phone: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      c => c.email.toLowerCase() === email.toLowerCase() || c.phone === phone
    );
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    // Check for duplicate email
    const customerWithSameEmail = Array.from(this.customers.values()).find(
      c => c.email.toLowerCase() === customer.email.toLowerCase()
    );
    if (customerWithSameEmail) {
      throw new Error(`The email "${customer.email}" is already associated with customer "${customerWithSameEmail.name}"`);
    }

    // Check for duplicate phone
    const customerWithSamePhone = Array.from(this.customers.values()).find(
      c => c.phone === customer.phone
    );
    if (customerWithSamePhone) {
      throw new Error(`The phone number "${customer.phone}" is already associated with customer "${customerWithSamePhone.name}"`);
    }

    const id = this.customerIdCounter++;
    const newCustomer: Customer = {
      ...customer,
      id,
      createdAt: new Date(),
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }
  
  async updateCustomer(id: number, customer: InsertCustomer): Promise<Customer | undefined> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) return undefined;
    
    // Check for duplicate email (ignoring the current customer)
    const customerWithSameEmail = Array.from(this.customers.values()).find(
      c => c.id !== id && c.email.toLowerCase() === customer.email.toLowerCase()
    );
    if (customerWithSameEmail) {
      throw new Error(`The email "${customer.email}" is already associated with customer "${customerWithSameEmail.name}"`);
    }

    // Check for duplicate phone (ignoring the current customer)
    const customerWithSamePhone = Array.from(this.customers.values()).find(
      c => c.id !== id && c.phone === customer.phone
    );
    if (customerWithSamePhone) {
      throw new Error(`The phone number "${customer.phone}" is already associated with customer "${customerWithSamePhone.name}"`);
    }
    
    const updatedCustomer: Customer = {
      ...existingCustomer,
      ...customer,
    };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async updateCustomerStage(id: number, stage: string): Promise<Customer | undefined> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) return undefined;
    
    const validStages = ["new", "pipeline", "cold", "warm", "booked", "lost"];
    if (!validStages.includes(stage)) {
      throw new Error("Invalid customer stage");
    }
    
    const updatedCustomer: Customer = {
      ...existingCustomer,
      stage: stage as "new" | "pipeline" | "cold" | "warm" | "booked" | "lost"
    };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }
  
  // Customer Follow-up operations
  async getAllFollowUps(): Promise<FollowUp[]> {
    return Array.from(this.followUps.values())
      .sort((a, b) => b.interactionDate.getTime() - a.interactionDate.getTime()); // Most recent first
  }
  
  async getFollowUps(customerId: number): Promise<FollowUp[]> {
    return Array.from(this.followUps.values())
      .filter(followUp => followUp.customerId === customerId)
      .sort((a, b) => b.interactionDate.getTime() - a.interactionDate.getTime()); // Most recent first
  }
  
  async getFollowUp(id: number): Promise<FollowUp | undefined> {
    return this.followUps.get(id);
  }
  
  async createFollowUp(followUp: InsertFollowUp): Promise<FollowUp> {
    const id = this.followUpIdCounter++;
    
    // Convert date strings to Date objects if needed
    const interactionDate = typeof followUp.interactionDate === 'string' 
      ? new Date(followUp.interactionDate) 
      : followUp.interactionDate;
      
    const nextFollowUpDate = followUp.nextFollowUpDate
      ? (typeof followUp.nextFollowUpDate === 'string' 
        ? new Date(followUp.nextFollowUpDate) 
        : followUp.nextFollowUpDate)
      : null;
    
    const newFollowUp: FollowUp = {
      id,
      customerId: followUp.customerId,
      notes: followUp.notes,
      interactionDate: interactionDate,
      nextFollowUpDate: nextFollowUpDate,
      completed: followUp.completed || false,
      userId: followUp.userId || null,
      createdAt: new Date(),
    };
    
    this.followUps.set(id, newFollowUp);
    return newFollowUp;
  }
  
  async updateFollowUp(id: number, followUp: Partial<InsertFollowUp>): Promise<FollowUp | undefined> {
    const existingFollowUp = this.followUps.get(id);
    if (!existingFollowUp) return undefined;
    
    // Handle date conversions
    let interactionDate = existingFollowUp.interactionDate;
    if (followUp.interactionDate) {
      interactionDate = typeof followUp.interactionDate === 'string'
        ? new Date(followUp.interactionDate)
        : followUp.interactionDate;
    }
    
    let nextFollowUpDate = existingFollowUp.nextFollowUpDate;
    if (followUp.nextFollowUpDate !== undefined) {
      nextFollowUpDate = followUp.nextFollowUpDate
        ? (typeof followUp.nextFollowUpDate === 'string'
          ? new Date(followUp.nextFollowUpDate)
          : followUp.nextFollowUpDate)
        : null;
    }
    
    const updatedFollowUp: FollowUp = {
      ...existingFollowUp,
      ...followUp,
      interactionDate,
      nextFollowUpDate,
    };
    
    this.followUps.set(id, updatedFollowUp);
    return updatedFollowUp;
  }
  
  async deleteFollowUp(id: number): Promise<boolean> {
    return this.followUps.delete(id);
  }
  
  async getPendingFollowUps(): Promise<Array<FollowUp & { customer: Customer }>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const pendingFollowUps = Array.from(this.followUps.values())
      .filter(followUp => 
        followUp.nextFollowUpDate && 
        followUp.nextFollowUpDate <= today && 
        !followUp.completed
      )
      .sort((a, b) => {
        // Sort by date - oldest first
        if (a.nextFollowUpDate && b.nextFollowUpDate) {
          return a.nextFollowUpDate.getTime() - b.nextFollowUpDate.getTime();
        }
        return 0;
      });
    
    // Attach customer data to each follow-up
    return pendingFollowUps.map(followUp => {
      const customer = this.customers.get(followUp.customerId);
      if (!customer) {
        throw new Error(`Customer with ID ${followUp.customerId} not found`);
      }
      return { ...followUp, customer };
    });
  }
  
  async markFollowUpComplete(id: number, completionNotes?: string, nextFollowUpDate?: Date | null, nextFollowUpNotes?: string, userId?: number): Promise<FollowUp | undefined> {
    const followUp = this.followUps.get(id);
    if (!followUp) return undefined;
    
    // Create the updated follow-up record to mark it complete
    const updatedFollowUp = {
      ...followUp,
      completed: true,
      completionNotes: completionNotes || null,
      // Only update nextFollowUpDate if explicitly provided (including null)
      nextFollowUpDate: nextFollowUpDate !== undefined ? nextFollowUpDate : followUp.nextFollowUpDate,
      // Update the userId if provided
      userId: userId !== undefined ? userId : followUp.userId
    };
    
    this.followUps.set(id, updatedFollowUp);
    
    // If nextFollowUpDate is provided and not null, create a new follow-up
    if (nextFollowUpDate && followUp.customerId) {
      const newFollowUpId = this.followUpIdCounter++;
      
      const newFollowUp: FollowUp = {
        id: newFollowUpId,
        customerId: followUp.customerId,
        notes: nextFollowUpNotes || "",
        interactionDate: new Date(),
        nextFollowUpDate: nextFollowUpDate,
        completed: false,
        completionNotes: null,
        userId: followUp.userId,
        createdAt: new Date(),
      };
      
      this.followUps.set(newFollowUpId, newFollowUp);
    }
    
    return updatedFollowUp;
  }
  
  // Accessory Catalog operations
  async getAccessoryCatalog(): Promise<AccessoryCatalog[]> {
    return Array.from(this.accessoryCatalogItems.values());
  }
  
  async getAccessoryCatalogByCategory(category: "handle" | "kitchen" | "light" | "wardrobe"): Promise<AccessoryCatalog[]> {
    return Array.from(this.accessoryCatalogItems.values())
      .filter(item => item.category === category);
  }
  
  async getAccessoryCatalogItem(id: number): Promise<AccessoryCatalog | undefined> {
    return this.accessoryCatalogItems.get(id);
  }
  
  async createAccessoryCatalogItem(item: InsertAccessoryCatalog): Promise<AccessoryCatalog> {
    const id = this.accessoryCatalogIdCounter++;
    
    const newItem: AccessoryCatalog = {
      id,
      category: item.category,
      code: item.code,
      name: item.name,
      description: item.description || null,
      sellingPrice: item.sellingPrice,
      kitchenPrice: item.kitchenPrice || null,
      wardrobePrice: item.wardrobePrice || null,
      size: item.size || null,
      image: item.image || null,
      createdAt: new Date()
    };
    
    this.accessoryCatalogItems.set(id, newItem);
    return newItem;
  }
  
  async updateAccessoryCatalogItem(id: number, item: Partial<InsertAccessoryCatalog>): Promise<AccessoryCatalog | undefined> {
    const existingItem = this.accessoryCatalogItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem: AccessoryCatalog = {
      ...existingItem,
      category: item.category || existingItem.category,
      code: item.code || existingItem.code,
      name: item.name || existingItem.name,
      description: item.description !== undefined ? item.description : existingItem.description,
      sellingPrice: item.sellingPrice !== undefined ? item.sellingPrice : existingItem.sellingPrice,
      kitchenPrice: item.kitchenPrice !== undefined ? item.kitchenPrice : existingItem.kitchenPrice,
      wardrobePrice: item.wardrobePrice !== undefined ? item.wardrobePrice : existingItem.wardrobePrice,
      size: item.size !== undefined ? item.size : existingItem.size,
      image: item.image !== undefined ? item.image : existingItem.image,
    };
    
    this.accessoryCatalogItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteAccessoryCatalogItem(id: number): Promise<boolean> {
    return this.accessoryCatalogItems.delete(id);
  }

  // Sales Order operations
  async getSalesOrders(): Promise<SalesOrder[]> {
    return Array.from(this.salesOrders.values());
  }

  async getSalesOrdersByCustomer(customerId: number): Promise<SalesOrder[]> {
    return Array.from(this.salesOrders.values())
      .filter(order => order.customerId === customerId);
  }

  async getSalesOrder(id: number): Promise<SalesOrder | undefined> {
    return this.salesOrders.get(id);
  }

  async getSalesOrderByQuotation(quotationId: number): Promise<SalesOrder | undefined> {
    return Array.from(this.salesOrders.values())
      .find(order => order.quotationId === quotationId);
  }

  async getSalesOrderWithDetails(id: number): Promise<SalesOrder & { 
    customer: Customer, 
    quotation: QuotationWithDetails, 
    payments: Payment[] 
  } | undefined> {
    const salesOrder = await this.getSalesOrder(id);
    if (!salesOrder) return undefined;

    const customer = await this.getCustomer(salesOrder.customerId);
    if (!customer) return undefined;

    // Get the quotation with all details (rooms, products, accessories)
    const quotation = await this.getQuotationWithDetails(salesOrder.quotationId);
    if (!quotation) return undefined;

    const payments = await this.getPayments(salesOrder.id);

    // Debug logging to help troubleshoot
    console.log(`Sales order data:`, {
      id: salesOrder.id,
      orderNumber: salesOrder.orderNumber,
      customerId: salesOrder.customerId,
      quotationId: salesOrder.quotationId,
      totalAmount: salesOrder.totalAmount,
      amountPaid: salesOrder.amountPaid,
      amountDue: salesOrder.amountDue,
      customerName: customer.name
    });

    return {
      ...salesOrder,
      customer,
      quotation,
      payments
    };
  }

  async createSalesOrderFromQuotation(quotationId: number, data?: Partial<InsertSalesOrder>): Promise<SalesOrder> {
    const quotation = await this.getQuotation(quotationId);
    if (!quotation) {
      throw new Error(`Quotation with id ${quotationId} not found`);
    }

    // Update quotation status to converted
    await this.updateQuotationStatus(quotationId, "converted");

    // Generate a new order number
    const now = new Date();
    const orderNumber = `SO-${now.getFullYear()}-${String(this.salesOrderIdCounter).padStart(3, '0')}`;

    // Create the sales order
    const salesOrder: SalesOrder = {
      id: this.salesOrderIdCounter++,
      orderNumber,
      quotationId: quotation.id,
      customerId: quotation.customerId,
      totalAmount: quotation.finalPrice,
      amountPaid: 0,
      amountDue: quotation.finalPrice,
      status: "pending",
      paymentStatus: "unpaid",
      orderDate: now,
      expectedDeliveryDate: data?.expectedDeliveryDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now by default
      notes: data?.notes || "",
      createdAt: now,
      updatedAt: now
    };

    this.salesOrders.set(salesOrder.id, salesOrder);
    return salesOrder;
  }

  async updateSalesOrderStatus(id: number, status: "pending" | "confirmed" | "in_production" | "ready_for_delivery" | "delivered" | "completed" | "cancelled"): Promise<SalesOrder | undefined> {
    const salesOrder = this.salesOrders.get(id);
    if (!salesOrder) return undefined;

    const updatedSalesOrder: SalesOrder = {
      ...salesOrder,
      status,
      updatedAt: new Date()
    };

    this.salesOrders.set(id, updatedSalesOrder);
    return updatedSalesOrder;
  }

  async updateSalesOrder(id: number, salesOrder: Partial<InsertSalesOrder>): Promise<SalesOrder | undefined> {
    const existingSalesOrder = this.salesOrders.get(id);
    if (!existingSalesOrder) return undefined;

    const updatedSalesOrder: SalesOrder = {
      ...existingSalesOrder,
      ...salesOrder,
      updatedAt: new Date()
    };

    this.salesOrders.set(id, updatedSalesOrder);
    return updatedSalesOrder;
  }

  async cancelSalesOrder(id: number): Promise<SalesOrder | undefined> {
    return this.updateSalesOrderStatus(id, "cancelled");
  }

  // Payment operations
  async getPayments(salesOrderId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.salesOrderId === salesOrderId);
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined> {
    return Array.from(this.payments.values())
      .find(payment => payment.transactionId === transactionId);
  }

  async getPaymentByReceiptNumber(receiptNumber: string): Promise<Payment | undefined> {
    return Array.from(this.payments.values())
      .find(payment => payment.receiptNumber === receiptNumber);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const newPayment: Payment = {
      ...payment,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.payments.set(id, newPayment);

    // Update sales order payment status and amount paid/due
    await this.updateSalesOrderPaymentStatus(payment.salesOrderId);

    return newPayment;
  }

  async recordPayment(
    salesOrderId: number, 
    amount: number, 
    paymentMethod: "cash" | "bank_transfer" | "check" | "card" | "upi" | "other", 
    notes?: string,
    paymentDate?: Date,
    createdBy?: number
  ): Promise<Payment> {
    const salesOrder = await this.getSalesOrder(salesOrderId);
    if (!salesOrder) {
      throw new Error(`Sales order with id ${salesOrderId} not found`);
    }

    // Generate unique transaction ID and receipt number
    const now = new Date();
    const timestamp = now.getTime().toString();
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    const transactionId = `TXN-${timestamp}-${randomString}`;
    const receiptNumber = `RCPT-${now.getFullYear()}-${String(this.paymentIdCounter).padStart(3, '0')}`;

    // Create the payment
    const payment: InsertPayment = {
      salesOrderId,
      transactionId,
      amount,
      paymentMethod,
      paymentDate: paymentDate || now,
      notes: notes || "",
      receiptNumber,
      createdBy,
    };

    return this.createPayment(payment);
  }

  async deletePayment(id: number): Promise<boolean> {
    const payment = this.payments.get(id);
    if (!payment) return false;
    
    const result = this.payments.delete(id);
    
    // Update the sales order payment status
    if (result) {
      await this.updateSalesOrderPaymentStatus(payment.salesOrderId);
    }
    
    return result;
  }
  
  // Helper method to update sales order payment status
  private async updateSalesOrderPaymentStatus(salesOrderId: number): Promise<void> {
    const salesOrder = await this.getSalesOrder(salesOrderId);
    if (!salesOrder) return;
    
    // Get all payments for this sales order
    const payments = await this.getPayments(salesOrderId);
    
    // Calculate total amount paid
    const amountPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate remaining amount due
    const amountDue = Math.max(0, salesOrder.totalAmount - amountPaid);
    
    // Determine payment status
    let paymentStatus: "unpaid" | "partially_paid" | "paid" = "unpaid";
    if (amountPaid >= salesOrder.totalAmount) {
      paymentStatus = "paid";
    } else if (amountPaid > 0) {
      paymentStatus = "partially_paid";
    }
    
    // Update the sales order
    await this.updateSalesOrder(salesOrderId, {
      amountPaid,
      amountDue,
      paymentStatus
    });
  }

  // Customer Payment operations (direct payments without sales orders)
  async getCustomerPayments(): Promise<CustomerPayment[]> {
    return Array.from(this.customerPayments.values());
  }
  
  async getCustomerPaymentsByCustomer(customerId: number): Promise<CustomerPayment[]> {
    return Array.from(this.customerPayments.values())
      .filter(payment => payment.customerId === customerId)
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime()); // Most recent first
  }
  
  async getCustomerPayment(id: number): Promise<CustomerPayment | undefined> {
    return this.customerPayments.get(id);
  }
  
  async getCustomerPaymentByTransactionId(transactionId: string): Promise<CustomerPayment | undefined> {
    return Array.from(this.customerPayments.values()).find(
      (payment) => payment.transactionId === transactionId
    );
  }
  
  async createCustomerPayment(payment: InsertCustomerPayment): Promise<CustomerPayment> {
    const id = this.customerPaymentIdCounter++;
    
    // Generate a receipt number if not provided
    const receiptNumber = payment.receiptNumber || `CP-${new Date().getFullYear()}-${id.toString().padStart(4, '0')}`;
    
    const newPayment: CustomerPayment = {
      ...payment,
      id,
      receiptNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.customerPayments.set(id, newPayment);
    
    // Find any sales orders for this customer and update their payment status
    await this.updateSalesOrdersForCustomerPayment(payment.customerId, payment.amount);
    
    return newPayment;
  }
  
  // Helper method to update sales orders when a customer payment is made
  private async updateSalesOrdersForCustomerPayment(customerId: number, paymentAmount: number): Promise<void> {
    // Get all sales orders for this customer that aren't fully paid
    const salesOrders = Array.from(this.salesOrders.values())
      .filter(order => 
        order.customerId === customerId && 
        order.paymentStatus !== 'paid'
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Oldest first
    
    console.log(`Updating ${salesOrders.length} sales orders for customer ${customerId} with payment amount ${paymentAmount}`);
    
    // If no sales orders, nothing to update
    if (salesOrders.length === 0) return;
    
    // Use the first sales order that isn't fully paid
    const salesOrder = salesOrders[0];
    console.log(`Applying payment to sales order ${salesOrder.id} (${salesOrder.orderNumber})`);
    
    // Get current payment amount
    const currentAmountPaid = salesOrder.amountPaid || 0;
    const totalAmount = salesOrder.totalAmount;
    
    // Calculate new payment amount
    const newAmountPaid = Math.min(currentAmountPaid + paymentAmount, totalAmount);
    const newAmountDue = Math.max(0, totalAmount - newAmountPaid);
    
    // Determine payment status
    let paymentStatus: "unpaid" | "partially_paid" | "paid" = "unpaid";
    if (newAmountPaid >= totalAmount) {
      paymentStatus = "paid";
    } else if (newAmountPaid > 0) {
      paymentStatus = "partially_paid";
    }
    
    console.log(`Updating payment amounts - Previous: ${currentAmountPaid}, New: ${newAmountPaid}, Due: ${newAmountDue}, Status: ${paymentStatus}`);
    
    // Update the sales order
    await this.updateSalesOrder(salesOrder.id, {
      amountPaid: newAmountPaid,
      amountDue: newAmountDue,
      paymentStatus
    });
  }
  
  async updateCustomerPayment(id: number, payment: Partial<InsertCustomerPayment>): Promise<CustomerPayment | undefined> {
    const existingPayment = this.customerPayments.get(id);
    if (!existingPayment) return undefined;
    
    // Save the old amount for comparison
    const oldAmount = existingPayment.amount;
    
    const updatedPayment: CustomerPayment = {
      ...existingPayment,
      ...payment,
      updatedAt: new Date(),
    };
    
    this.customerPayments.set(id, updatedPayment);
    
    // If amount was changed, update associated sales orders
    if (payment.amount !== undefined && payment.amount !== oldAmount) {
      try {
        const amountDifference = payment.amount - oldAmount;
        
        // Find any sales orders for this customer that aren't fully paid
        const salesOrders = Array.from(this.salesOrders.values())
          .filter(order => 
            order.customerId === existingPayment.customerId && 
            order.paymentStatus !== 'paid'
          )
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Oldest first
        
        // If no sales orders, nothing to update
        if (salesOrders.length > 0) {
          const salesOrder = salesOrders[0];
          console.log(`Updating sales order ${salesOrder.id} due to payment change. Old amount: ${oldAmount}, New amount: ${payment.amount}`);
          
          // Get current payment amount
          const currentAmountPaid = salesOrder.amountPaid || 0;
          const totalAmount = salesOrder.totalAmount;
          
          // Calculate new payment amount
          const newAmountPaid = Math.max(0, currentAmountPaid + amountDifference);
          const newAmountDue = Math.max(0, totalAmount - newAmountPaid);
          
          // Determine payment status
          let paymentStatus: "unpaid" | "partially_paid" | "paid" = "unpaid";
          if (newAmountPaid >= totalAmount) {
            paymentStatus = "paid";
          } else if (newAmountPaid > 0) {
            paymentStatus = "partially_paid";
          }
          
          // Update the sales order
          await this.updateSalesOrder(salesOrder.id, {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            paymentStatus
          });
        }
      } catch (error) {
        console.error("Error updating sales order after payment modification:", error);
      }
    }
    
    return updatedPayment;
  }
  
  async deleteCustomerPayment(id: number): Promise<boolean> {
    const payment = this.customerPayments.get(id);
    if (!payment) return false;
    
    const result = this.customerPayments.delete(id);
    
    // Reverse the payment effect on sales orders if payment is deleted
    if (result) {
      try {
        // Find the sales order for this customer
        const salesOrders = Array.from(this.salesOrders.values())
          .filter(order => order.customerId === payment.customerId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        if (salesOrders.length > 0) {
          const salesOrder = salesOrders[0];
          const currentAmountPaid = salesOrder.amountPaid || 0;
          
          // Only subtract if there's enough paid already
          if (currentAmountPaid >= payment.amount) {
            const newAmountPaid = currentAmountPaid - payment.amount;
            const newAmountDue = salesOrder.totalAmount - newAmountPaid;
            
            // Determine payment status
            let paymentStatus: "unpaid" | "partially_paid" | "paid" = "unpaid";
            if (newAmountPaid >= salesOrder.totalAmount) {
              paymentStatus = "paid";
            } else if (newAmountPaid > 0) {
              paymentStatus = "partially_paid";
            }
            
            // Update the sales order
            await this.updateSalesOrder(salesOrder.id, {
              amountPaid: newAmountPaid,
              amountDue: newAmountDue,
              paymentStatus
            });
          }
        }
      } catch (error) {
        console.error("Error updating sales order after payment deletion:", error);
      }
    }
    
    return result;
  }

  // Update quotation status
  async updateQuotationStatus(id: number, status: "draft" | "sent" | "approved" | "rejected" | "expired" | "converted"): Promise<Quotation | undefined> {
    const quotation = await this.getQuotation(id);
    if (!quotation) return undefined;
    
    // Update the quotation status
    const updatedQuotation = await this.updateQuotation(id, {
      status
    });
    
    return updatedQuotation;
  }
  
  // Quotation operations
  async getQuotations(): Promise<Quotation[]> {
    return Array.from(this.quotations.values());
  }
  
  async getQuotation(id: number): Promise<Quotation | undefined> {
    return this.quotations.get(id);
  }
  
  async getQuotationWithDetails(id: number): Promise<QuotationWithDetails | undefined> {
    const quotation = this.quotations.get(id);
    if (!quotation) return undefined;
    
    const customer = this.customers.get(quotation.customerId);
    if (!customer) return undefined;
    
    const roomsList = Array.from(this.rooms.values())
      .filter(room => room.quotationId === id)
      .sort((a, b) => a.order - b.order);
    
    const roomsWithItems: RoomWithItems[] = roomsList.map(room => {
      const roomProducts = Array.from(this.products.values())
        .filter(product => product.roomId === room.id);
      
      const roomAccessories = Array.from(this.accessories.values())
        .filter(accessory => accessory.roomId === room.id);
      
      const roomImages = Array.from(this.images.values())
        .filter(image => image.roomId === room.id)
        .sort((a, b) => a.order - b.order);
        
      const roomInstallationCharges = Array.from(this.installationCharges.values())
        .filter(charge => charge.roomId === room.id);
      
      return {
        ...room,
        products: roomProducts,
        accessories: roomAccessories,
        images: roomImages,
        installationCharges: roomInstallationCharges,
      };
    });
    
    return {
      ...quotation,
      customer,
      rooms: roomsWithItems,
    };
  }
  
  async getQuotationsByCustomer(customerId: number): Promise<Quotation[]> {
    return Array.from(this.quotations.values())
      .filter(quotation => quotation.customerId === customerId);
  }
  
  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const id = this.quotationIdCounter++;
    const now = new Date();
    const newQuotation: Quotation = {
      id,
      customerId: quotation.customerId,
      quotationNumber: quotation.quotationNumber || `Q-${now.getFullYear()}-${id.toString().padStart(3, '0')}`,
      status: quotation.status || "draft",
      title: quotation.title || "",
      description: quotation.description || null,
      totalSellingPrice: quotation.totalSellingPrice || 0,
      totalDiscountedPrice: quotation.totalDiscountedPrice || 0,
      totalInstallationCharges: 0,
      installationHandling: quotation.installationHandling || 0,
      globalDiscount: quotation.globalDiscount || 0,
      gstPercentage: quotation.gstPercentage || 0,
      gstAmount: quotation.gstAmount || 0,
      finalPrice: quotation.finalPrice || 0,
      validUntil: quotation.validUntil || new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
      terms: quotation.terms || "Standard terms and conditions apply",
      createdAt: now,
      updatedAt: now,
    };
    this.quotations.set(id, newQuotation);
    
    // Create default project milestones for the new quotation
    const milestones = this.createDefaultProjectMilestones(id, now);
    
    // Add milestones to storage
    milestones.forEach(milestone => {
      this.milestones.set(milestone.id, milestone);
    });
    
    return newQuotation;
  }
  
  async updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined> {
    const existingQuotation = this.quotations.get(id);
    if (!existingQuotation) return undefined;
    
    // Preserve the totalInstallationCharges from the existing quotation
    const totalInstallationCharges = 
      ('totalInstallationCharges' in existingQuotation) 
        ? existingQuotation.totalInstallationCharges 
        : 0;
    
    const updatedQuotation: any = {
      ...existingQuotation,
      ...quotation,
      totalInstallationCharges, // Make sure we keep this field
      updatedAt: new Date(),
    };
    
    this.quotations.set(id, updatedQuotation);
    return updatedQuotation;
  }
  
  async deleteQuotation(id: number): Promise<boolean> {
    // Delete associated rooms, products, accessories, and images
    const roomsToDelete = Array.from(this.rooms.values())
      .filter(room => room.quotationId === id);
    
    for (const room of roomsToDelete) {
      await this.deleteRoom(room.id);
    }
    
    return this.quotations.delete(id);
  }
  
  async duplicateQuotation(id: number, newCustomerId?: number): Promise<Quotation> {
    // Get the original quotation
    const originalQuotation = await this.getQuotation(id);
    if (!originalQuotation) {
      throw new Error("Original quotation not found");
    }
    
    // Get all rooms, products, accessories, images, and installation charges for original quotation
    const originalRooms = await this.getRooms(originalQuotation.id);
    
    // Create a new quotation with the same details but a new ID
    const now = new Date();
    const quotationNumber = `Q-${now.getFullYear()}-${String(this.quotationIdCounter).padStart(3, '0')}`;
    
    const newQuotation: any = {
      id: this.quotationIdCounter++,
      customerId: newCustomerId || originalQuotation.customerId,
      quotationNumber: quotationNumber,
      status: "draft",
      title: `${originalQuotation.title} (Copy)`,
      description: originalQuotation.description,
      gstPercentage: originalQuotation.gstPercentage,
      globalDiscount: originalQuotation.globalDiscount,
      installationHandling: originalQuotation.installationHandling,
      totalSellingPrice: originalQuotation.totalSellingPrice,
      totalDiscountedPrice: originalQuotation.totalDiscountedPrice,
      totalInstallationCharges: 0, // Initialize with 0, will be updated later
      gstAmount: originalQuotation.gstAmount,
      finalPrice: originalQuotation.finalPrice,
      validUntil: originalQuotation.validUntil,
      terms: originalQuotation.terms,
      createdAt: now,
      updatedAt: now
    };
    
    this.quotations.set(newQuotation.id, newQuotation);
    
    // Create rooms for the new quotation
    for (const originalRoom of originalRooms) {
      const roomDetails = await this.getRoomWithItems(originalRoom.id);
      if (!roomDetails) continue;
      
      // Create the new room
      const newRoom = await this.createRoom({
        quotationId: newQuotation.id,
        name: roomDetails.name,
        description: roomDetails.description,
        order: roomDetails.order
      });
      
      // Create products for the new room
      for (const product of roomDetails.products) {
        // Recalculate discounted price to ensure it's correct
        const discountedPrice = this.calculateDiscountedPrice(
          product.sellingPrice,
          product.discount || 0,
          product.discountType || "percentage"
        );
        
        await this.createProduct({
          name: product.name,
          description: product.description,
          sellingPrice: product.sellingPrice,
          discount: product.discount || 0,
          discountType: product.discountType || "percentage",
          discountedPrice: discountedPrice, // Use the recalculated price
          quantity: product.quantity || 1,
          roomId: newRoom.id
        });
      }
      
      // Create accessories for the new room
      for (const accessory of roomDetails.accessories) {
        // Recalculate discounted price to ensure it's correct
        const discountedPrice = this.calculateDiscountedPrice(
          accessory.sellingPrice,
          accessory.discount || 0,
          accessory.discountType || "percentage"
        );
        
        await this.createAccessory({
          name: accessory.name,
          description: accessory.description,
          sellingPrice: accessory.sellingPrice,
          discount: accessory.discount || 0,
          discountType: accessory.discountType || "percentage",
          discountedPrice: discountedPrice, // Use the recalculated price
          roomId: newRoom.id,
          quantity: accessory.quantity || 1
        });
      }
      
      // Create images for the new room
      for (const image of roomDetails.images) {
        await this.createImage({
          roomId: newRoom.id,
          path: image.path,
          caption: image.caption,
          order: image.order
        });
      }
      
      // Create installation charges for the new room
      for (const charge of roomDetails.installationCharges) {
        await this.createInstallationCharge({
          id: this.installationChargeIdCounter++,
          roomId: newRoom.id,
          description: charge.description,
          amount: charge.amount
        });
      }
    }
    
    // Create default milestones for the new quotation
    const milestones = this.createDefaultProjectMilestones(newQuotation.id, now);
    
    // Add milestones to storage
    milestones.forEach(milestone => {
      this.milestones.set(milestone.id, milestone);
    });
    
    // Update the prices
    await this.updateQuotationPrices(newQuotation.id);
    
    return this.getQuotation(newQuotation.id) as Promise<Quotation>;
  }
  
  // Room operations
  async getRooms(quotationId: number): Promise<Room[]> {
    return Array.from(this.rooms.values())
      .filter(room => room.quotationId === quotationId)
      .sort((a, b) => a.order - b.order);
  }
  
  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }
  
  async getRoomWithItems(id: number): Promise<RoomWithItems | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const roomProducts = Array.from(this.products.values())
      .filter(product => product.roomId === id);
    
    const roomAccessories = Array.from(this.accessories.values())
      .filter(accessory => accessory.roomId === id);
    
    const roomImages = Array.from(this.images.values())
      .filter(image => image.roomId === id)
      .sort((a, b) => a.order - b.order);
    
    const roomInstallationCharges = Array.from(this.installationCharges.values())
      .filter(charge => charge.roomId === id);
    
    return {
      ...room,
      products: roomProducts,
      accessories: roomAccessories,
      images: roomImages,
      installationCharges: roomInstallationCharges,
    };
  }
  
  async createRoom(room: InsertRoom): Promise<Room> {
    const id = this.roomIdCounter++;
    
    // Get the current highest order value for rooms in this quotation
    const currentRooms = await this.getRooms(room.quotationId);
    const maxOrder = currentRooms.length > 0 
      ? Math.max(...currentRooms.map(r => r.order))
      : -1;
    
    const newRoom: Room = {
      id,
      quotationId: room.quotationId,
      name: room.name,
      order: room.order ?? maxOrder + 1,
      description: room.description ?? null,
      sellingPrice: room.sellingPrice ?? 0,
      discountedPrice: room.discountedPrice ?? 0,
      installDescription: room.installDescription ?? null,
      widthMm: room.widthMm ?? null, 
      heightMm: room.heightMm ?? null,
      areaSqft: room.areaSqft ?? null,
      pricePerSqft: room.pricePerSqft ?? null,
      installAmount: room.installAmount ?? null
    };
    this.rooms.set(id, newRoom);
    
    // Update quotation prices
    await this.updateQuotationPrices(room.quotationId);
    
    return newRoom;
  }
  
  async updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room | undefined> {
    const existingRoom = this.rooms.get(id);
    if (!existingRoom) return undefined;
    
    const updatedRoom: Room = {
      ...existingRoom,
      ...room,
    };
    this.rooms.set(id, updatedRoom);
    
    // Update quotation prices
    await this.updateQuotationPrices(existingRoom.quotationId);
    
    return updatedRoom;
  }
  
  async deleteRoom(id: number): Promise<boolean> {
    const room = this.rooms.get(id);
    if (!room) return false;
    
    // Delete associated products, accessories, images, and installation charges
    const productsToDelete = Array.from(this.products.values())
      .filter(product => product.roomId === id);
    
    for (const product of productsToDelete) {
      this.products.delete(product.id);
    }
    
    const accessoriesToDelete = Array.from(this.accessories.values())
      .filter(accessory => accessory.roomId === id);
    
    for (const accessory of accessoriesToDelete) {
      this.accessories.delete(accessory.id);
    }
    
    const imagesToDelete = Array.from(this.images.values())
      .filter(image => image.roomId === id);
    
    for (const image of imagesToDelete) {
      this.images.delete(image.id);
    }
    
    const chargesToDelete = Array.from(this.installationCharges.values())
      .filter(charge => charge.roomId === id);
    
    for (const charge of chargesToDelete) {
      if (charge.id !== undefined) {
        this.installationCharges.delete(charge.id);
      }
    }
    
    const quotationId = room.quotationId;
    const result = this.rooms.delete(id);
    
    // Reorder remaining rooms
    const remainingRooms = await this.getRooms(quotationId);
    remainingRooms.forEach((room, index) => {
      this.rooms.set(room.id, { ...room, order: index });
    });
    
    // Update quotation prices
    await this.updateQuotationPrices(quotationId);
    
    return result;
  }
  
  async reorderRooms(roomIds: number[]): Promise<boolean> {
    if (roomIds.length === 0) return false;
    
    // Verify all rooms exist
    const rooms = roomIds.map(id => this.rooms.get(id));
    if (rooms.some(room => !room)) return false;
    
    // Update order
    roomIds.forEach((id, index) => {
      const room = this.rooms.get(id);
      if (room) {
        this.rooms.set(id, { ...room, order: index });
      }
    });
    
    return true;
  }
  
  // Product operations
  async getProducts(roomId: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.roomId === roomId);
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  // Helper function to generate default project milestones for a quotation
  private createDefaultProjectMilestones(quotationId: number, startDate: Date = new Date()): Milestone[] {
    const milestones: Milestone[] = [];
    let currentDate = new Date(startDate);
    
    // Phase 1: Initial Consultation & Design (1-2 weeks)
    // Day 1: Initial customer contact and preliminary design concept with quotation provided
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Initial Consultation",
      description: "Initial customer contact and preliminary design concept with quotation provided",
      startDate: new Date(currentDate),
      endDate: new Date(currentDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    // Day 3-7: Design meeting(s) with customer
    currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 3);
    const designMeetingEndDate = new Date(startDate);
    designMeetingEndDate.setDate(designMeetingEndDate.getDate() + 7);
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Design Meetings",
      description: "Design meeting(s) with customer to finalize details",
      startDate: new Date(currentDate),
      endDate: new Date(designMeetingEndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    // Day 5-10: Laser measurements of the site
    currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 5);
    const measurementsEndDate = new Date(startDate);
    measurementsEndDate.setDate(measurementsEndDate.getDate() + 10);
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Site Measurements",
      description: "Laser measurements of the site",
      startDate: new Date(currentDate),
      endDate: new Date(measurementsEndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    // Day 10-14: Finalization of designs
    currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 10);
    const finalizationEndDate = new Date(startDate);
    finalizationEndDate.setDate(finalizationEndDate.getDate() + 14);
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Design Finalization",
      description: "Finalization of designs",
      startDate: new Date(currentDate),
      endDate: new Date(finalizationEndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    // Phase 2: Design Confirmation & Production Initiation (1-3 days)
    currentDate = new Date(finalizationEndDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const phase2EndDate = new Date(currentDate);
    phase2EndDate.setDate(phase2EndDate.getDate() + 3);
    
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Detailed Design Document",
      description: "Provide detailed document with finalized design and accessories",
      startDate: new Date(currentDate),
      endDate: new Date(phase2EndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Customer Confirmation",
      description: "Customer confirmation and 50% advance payment",
      startDate: new Date(currentDate),
      endDate: new Date(phase2EndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Production Order",
      description: "Production order sent to factory",
      startDate: new Date(currentDate),
      endDate: new Date(phase2EndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    // Phase 3: Production (30-45 days)
    currentDate = new Date(phase2EndDate);
    currentDate.setDate(currentDate.getDate() + 1);
    
    const standardFinishEndDate = new Date(currentDate);
    standardFinishEndDate.setDate(standardFinishEndDate.getDate() + 30);
    
    const premiumFinishEndDate = new Date(currentDate);
    premiumFinishEndDate.setDate(premiumFinishEndDate.getDate() + 45);
    
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Production Phase",
      description: "30 days: Standard finishes (Highgloss, Matt, Softmat, Laminates), 45 days: Premium finishes (Classic Lacquer)",
      startDate: new Date(currentDate),
      endDate: new Date(premiumFinishEndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Production Completion",
      description: "Production completion notification",
      startDate: new Date(premiumFinishEndDate),
      endDate: new Date(premiumFinishEndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    // Phase 4: Payment & Logistics (1-3 days)
    currentDate = new Date(premiumFinishEndDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const phase4EndDate = new Date(currentDate);
    phase4EndDate.setDate(phase4EndDate.getDate() + 3);
    
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Remaining Payment",
      description: "Remaining 50% payment collection",
      startDate: new Date(currentDate),
      endDate: new Date(phase4EndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Dispatch Confirmation",
      description: "Dispatch confirmation from factory",
      startDate: new Date(currentDate),
      endDate: new Date(phase4EndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    // Phase 5: Delivery & Installation (15 days)
    currentDate = new Date(phase4EndDate);
    currentDate.setDate(currentDate.getDate() + 1);
    
    const transportEndDate = new Date(currentDate);
    transportEndDate.setDate(transportEndDate.getDate() + 10);
    
    const installationEndDate = new Date(transportEndDate);
    installationEndDate.setDate(installationEndDate.getDate() + 5);
    
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Transport to Site",
      description: "Transport from factory to project site (Days 1-10)",
      startDate: new Date(currentDate),
      endDate: new Date(transportEndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Installation",
      description: "Installation of modular components (Days 11-15)",
      startDate: new Date(transportEndDate),
      endDate: new Date(installationEndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    milestones.push({
      id: this.milestoneIdCounter++,
      quotationId,
      title: "Project Handover",
      description: "Project handover to customer",
      startDate: new Date(installationEndDate),
      endDate: new Date(installationEndDate),
      status: "pending" as const,
      completedDate: null,
      order: milestones.length,
      createdAt: new Date()
    });
    
    return milestones;
  }

  // Helper function to calculate discounted price
  private calculateDiscountedPrice(sellingPrice: number, discount: number, discountType: string): number {
    if (!discount) return sellingPrice;
    
    if (discountType === "percentage") {
      return sellingPrice * (1 - discount / 100);
    } else if (discountType === "fixed") {
      return Math.max(0, sellingPrice - discount);
    }
    
    return sellingPrice;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    
    // Calculate the discounted price based on the discount
    const discountedPrice = this.calculateDiscountedPrice(
      product.sellingPrice,
      product.discount || 0,
      product.discountType || "percentage"
    );
    
    const newProduct: Product = {
      id,
      name: product.name,
      description: product.description,
      quantity: product.quantity || 1,
      sellingPrice: product.sellingPrice,
      discount: product.discount || 0,
      discountType: product.discountType || "percentage",
      discountedPrice: discountedPrice,
      roomId: product.roomId
    };
    this.products.set(id, newProduct);
    
    // Update room price after adding a product
    await this.updateRoomPrices(product.roomId);
    
    return newProduct;
  }
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    // If selling price, discount or discount type is being updated, recalculate discounted price
    let discountedPrice = existingProduct.discountedPrice;
    if (product.sellingPrice !== undefined || product.discount !== undefined || product.discountType !== undefined) {
      const sellingPrice = product.sellingPrice !== undefined ? product.sellingPrice : existingProduct.sellingPrice;
      const discount = product.discount !== undefined ? product.discount : (existingProduct.discount || 0);
      const discountType = product.discountType !== undefined ? product.discountType : (existingProduct.discountType || "percentage");
      
      discountedPrice = this.calculateDiscountedPrice(sellingPrice, discount, discountType);
    }
    
    const updatedProduct: Product = {
      ...existingProduct,
      ...product,
      discountedPrice: discountedPrice
    };
    
    this.products.set(id, updatedProduct);
    
    // Update room price after updating a product
    await this.updateRoomPrices(existingProduct.roomId);
    
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    
    const result = this.products.delete(id);
    
    // Update room price after deleting a product
    await this.updateRoomPrices(product.roomId);
    
    return result;
  }
  
  // Accessory operations
  async getAccessories(roomId: number): Promise<Accessory[]> {
    return Array.from(this.accessories.values())
      .filter(accessory => accessory.roomId === roomId);
  }
  
  async getAccessory(id: number): Promise<Accessory | undefined> {
    return this.accessories.get(id);
  }
  
  async createAccessory(accessory: InsertAccessory): Promise<Accessory> {
    const id = this.accessoryIdCounter++;
    
    // Calculate the discounted price based on the discount
    const discountedPrice = this.calculateDiscountedPrice(
      accessory.sellingPrice,
      accessory.discount || 0,
      accessory.discountType || "percentage"
    );
    
    const newAccessory: Accessory = {
      id,
      name: accessory.name,
      description: accessory.description,
      quantity: accessory.quantity || 1,
      sellingPrice: accessory.sellingPrice,
      discount: accessory.discount || 0,
      discountType: accessory.discountType || "percentage",
      discountedPrice: discountedPrice,
      roomId: accessory.roomId
    };
    this.accessories.set(id, newAccessory);
    
    // Update room price after adding an accessory
    await this.updateRoomPrices(accessory.roomId);
    
    return newAccessory;
  }
  
  async updateAccessory(id: number, accessory: Partial<InsertAccessory>): Promise<Accessory | undefined> {
    const existingAccessory = this.accessories.get(id);
    if (!existingAccessory) return undefined;
    
    // If selling price, discount or discount type is being updated, recalculate discounted price
    let discountedPrice = existingAccessory.discountedPrice;
    if (accessory.sellingPrice !== undefined || accessory.discount !== undefined || accessory.discountType !== undefined) {
      const sellingPrice = accessory.sellingPrice !== undefined ? accessory.sellingPrice : existingAccessory.sellingPrice;
      const discount = accessory.discount !== undefined ? accessory.discount : (existingAccessory.discount || 0);
      const discountType = accessory.discountType !== undefined ? accessory.discountType : (existingAccessory.discountType || "percentage");
      
      discountedPrice = this.calculateDiscountedPrice(sellingPrice, discount, discountType);
    }
    
    const updatedAccessory: Accessory = {
      ...existingAccessory,
      ...accessory,
      discountedPrice: discountedPrice
    };
    
    this.accessories.set(id, updatedAccessory);
    
    // Update room price after updating an accessory
    await this.updateRoomPrices(existingAccessory.roomId);
    
    return updatedAccessory;
  }
  
  async deleteAccessory(id: number): Promise<boolean> {
    const accessory = this.accessories.get(id);
    if (!accessory) return false;
    
    const result = this.accessories.delete(id);
    
    // Update room price after deleting an accessory
    await this.updateRoomPrices(accessory.roomId);
    
    return result;
  }
  
  // Image operations
  async getImages(roomId: number): Promise<Image[]> {
    return Array.from(this.images.values())
      .filter(image => image.roomId === roomId)
      .sort((a, b) => a.order - b.order);
  }
  
  async getImage(id: number): Promise<Image | undefined> {
    return this.images.get(id);
  }
  
  async createImage(image: InsertImage): Promise<Image> {
    const id = this.imageIdCounter++;
    
    // Get the current highest order value for images in this room
    const currentImages = await this.getImages(image.roomId);
    const maxOrder = currentImages.length > 0 
      ? Math.max(...currentImages.map(i => i.order))
      : -1;
    
    const newImage: Image = {
      id,
      roomId: image.roomId,
      filename: image.filename,
      path: image.path,
      order: image.order ?? maxOrder + 1
    };
    this.images.set(id, newImage);
    return newImage;
  }
  
  async deleteImage(id: number): Promise<boolean> {
    const image = this.images.get(id);
    if (!image) return false;
    
    const result = this.images.delete(id);
    
    // Reorder remaining images
    const remainingImages = await this.getImages(image.roomId);
    remainingImages.forEach((image, index) => {
      this.images.set(image.id, { ...image, order: index });
    });
    
    return result;
  }
  
  async reorderImages(imageIds: number[]): Promise<boolean> {
    if (imageIds.length === 0) return false;
    
    // Verify all images exist
    const images = imageIds.map(id => this.images.get(id));
    if (images.some(image => !image)) return false;
    
    // Update order
    imageIds.forEach((id, index) => {
      const image = this.images.get(id);
      if (image) {
        this.images.set(id, { ...image, order: index });
      }
    });
    
    return true;
  }
  
  // Installation charge operations
  async getInstallationCharges(roomId: number): Promise<InstallationCharge[]> {
    return Array.from(this.installationCharges.values())
      .filter(charge => charge.roomId === roomId);
  }
  
  async getInstallationCharge(id: number): Promise<InstallationCharge | undefined> {
    return this.installationCharges.get(id);
  }
  
  async createInstallationCharge(charge: InstallationCharge): Promise<InstallationCharge> {
    const id = this.installationChargeIdCounter++;
    const newCharge: InstallationCharge = {
      ...charge,
      id
    };
    this.installationCharges.set(id, newCharge);
    
    // Get the room to get the quotation ID
    const room = this.rooms.get(charge.roomId);
    
    // Update quotation prices
    if (room) {
      await this.updateQuotationPrices(room.quotationId);
      newCharge.quotationId = room.quotationId; // Add quotationId for the client
    }
    
    return newCharge;
  }
  
  async updateInstallationCharge(id: number, charge: Partial<InstallationCharge>): Promise<InstallationCharge | undefined> {
    const existingCharge = this.installationCharges.get(id);
    if (!existingCharge) return undefined;
    
    const updatedCharge: InstallationCharge = {
      ...existingCharge,
      ...charge
    };
    this.installationCharges.set(id, updatedCharge);
    
    // Get the room to get the quotation ID
    const room = this.rooms.get(existingCharge.roomId);
    
    // Update quotation prices
    if (room) {
      await this.updateQuotationPrices(room.quotationId);
      updatedCharge.quotationId = room.quotationId; // Add quotationId for the client
    }
    
    return updatedCharge;
  }
  
  async deleteInstallationCharge(id: number): Promise<boolean> {
    const charge = this.installationCharges.get(id);
    if (!charge) return false;
    
    const result = this.installationCharges.delete(id);
    
    // Get the room to get the quotation ID
    const room = this.rooms.get(charge.roomId);
    
    // Update quotation prices
    if (room) {
      await this.updateQuotationPrices(room.quotationId);
    }
    
    return result;
  }
  
  private async updateRoomPrices(roomId: number) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    const products = await this.getProducts(roomId);
    const accessories = await this.getAccessories(roomId);
    
    // Calculate room prices
    let sellingPrice = 0;
    let discountedPrice = 0;
    
    // Add product prices
    for (const product of products) {
      sellingPrice += product.sellingPrice * (product.quantity || 1);
      discountedPrice += product.discountedPrice * (product.quantity || 1);
    }
    
    // Add accessory prices with quantity
    for (const accessory of accessories) {
      sellingPrice += accessory.sellingPrice * (accessory.quantity || 1);
      discountedPrice += accessory.discountedPrice * (accessory.quantity || 1);
    }
    
    // Update room
    this.rooms.set(roomId, {
      ...room,
      sellingPrice,
      discountedPrice
    });
    
    // Update quotation prices
    await this.updateQuotationPrices(room.quotationId);
  }
  
  private async updateQuotationPrices(quotationId: number) {
    const quotation = this.quotations.get(quotationId);
    if (!quotation) return;
    
    const rooms = await this.getRooms(quotationId);
    
    // Calculate quotation prices
    let totalSellingPrice = 0;
    let totalDiscountedPrice = 0;
    
    // Add room prices
    for (const room of rooms) {
      totalSellingPrice += room.sellingPrice;
      totalDiscountedPrice += room.discountedPrice;
    }
    
    // Apply global discount
    const discountMultiplier = 1 - (quotation.globalDiscount / 100);
    const priceAfterGlobalDiscount = quotation.globalDiscount > 0 
      ? totalDiscountedPrice * discountMultiplier 
      : totalDiscountedPrice;
    
    // Calculate total installation charges
    let totalInstallationCharges = 0;
    for (const room of rooms) {
      const charges = await this.getInstallationCharges(room.id);
      for (const charge of charges) {
        const amount = typeof charge.amount === 'number' 
          ? charge.amount 
          : parseFloat(String(charge.amount));
        totalInstallationCharges += amount;
      }
    }
    
    console.log(`Updating quotation ${quotationId} with totalInstallationCharges: ${totalInstallationCharges}`);
    
    // Apply GST
    const subtotal = priceAfterGlobalDiscount + totalInstallationCharges + quotation.installationHandling;
    const gstAmount = subtotal * (quotation.gstPercentage / 100);
    const finalPrice = subtotal + gstAmount;
    
    // Create a new quotation object with all the updated fields
    const updatedQuotation = {
      ...quotation,
      totalSellingPrice,
      totalDiscountedPrice,
      totalInstallationCharges,
      gstAmount,
      finalPrice,
      updatedAt: new Date()
    };
    
    // Update the quotation in the storage
    this.quotations.set(quotationId, updatedQuotation);
  }
  
  // User operations
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const newUser: User = {
      id,
      username: user.username,
      password: user.password,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      active: user.active !== undefined ? user.active : true,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser: User = {
      ...existingUser,
      ...user,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Remove from teams first
    const teamMembers = Array.from(this.teamMembers.values())
      .filter(member => member.userId === id);
    
    for (const member of teamMembers) {
      this.teamMembers.delete(member.id);
    }
    
    return this.users.delete(id);
  }
  
  // Team operations
  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }
  
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }
  
  async getTeamWithMembers(id: number): Promise<Team & { members: User[] }> {
    const team = this.teams.get(id);
    if (!team) {
      throw new Error(`Team with ID ${id} not found`);
    }
    
    const memberIds = Array.from(this.teamMembers.values())
      .filter(member => member.teamId === id)
      .map(member => member.userId);
    
    const members = memberIds.map(userId => this.users.get(userId))
      .filter((user): user is User => !!user);
    
    return {
      ...team,
      members
    };
  }
  
  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.teamIdCounter++;
    const newTeam: Team = {
      id,
      name: team.name,
      description: team.description || null,
      createdAt: new Date()
    };
    this.teams.set(id, newTeam);
    return newTeam;
  }
  
  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined> {
    const existingTeam = this.teams.get(id);
    if (!existingTeam) return undefined;
    
    const updatedTeam: Team = {
      ...existingTeam,
      ...team
    };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }
  
  async deleteTeam(id: number): Promise<boolean> {
    // Delete team members first
    const teamMembers = Array.from(this.teamMembers.values())
      .filter(member => member.teamId === id);
    
    for (const member of teamMembers) {
      this.teamMembers.delete(member.id);
    }
    
    return this.teams.delete(id);
  }
  
  // Team Member operations
  async getTeamMembers(teamId: number): Promise<User[]> {
    const memberIds = Array.from(this.teamMembers.values())
      .filter(member => member.teamId === teamId)
      .map(member => member.userId);
    
    return memberIds.map(userId => this.users.get(userId))
      .filter((user): user is User => !!user);
  }
  
  async addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    // Check if team and user exist
    const team = this.teams.get(teamMember.teamId);
    const user = this.users.get(teamMember.userId);
    
    if (!team || !user) {
      throw new Error("Team or user not found");
    }
    
    // Check if user is already in team
    const existingMember = Array.from(this.teamMembers.values())
      .find(member => member.teamId === teamMember.teamId && member.userId === teamMember.userId);
    
    if (existingMember) {
      return existingMember;
    }
    
    const id = this.teamMemberIdCounter++;
    const newTeamMember: TeamMember = {
      id,
      teamId: teamMember.teamId,
      userId: teamMember.userId,
      createdAt: new Date()
    };
    this.teamMembers.set(id, newTeamMember);
    return newTeamMember;
  }
  
  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    const teamMember = Array.from(this.teamMembers.values())
      .find(tm => tm.teamId === teamId && tm.userId === userId);
    
    if (!teamMember) return false;
    
    return this.teamMembers.delete(teamMember.id);
  }
  
  // Project Timeline operations
  async getMilestones(quotationId: number): Promise<Milestone[]> {
    return Array.from(this.milestones.values())
      .filter(milestone => milestone.quotationId === quotationId)
      .sort((a, b) => a.order - b.order);
  }
  
  async getMilestone(id: number): Promise<Milestone | undefined> {
    return this.milestones.get(id);
  }
  
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const id = this.milestoneIdCounter++;
    
    // Convert date strings to Date objects if needed
    const startDate = typeof milestone.startDate === 'string' 
      ? new Date(milestone.startDate) 
      : milestone.startDate;
      
    const endDate = typeof milestone.endDate === 'string' 
      ? new Date(milestone.endDate) 
      : milestone.endDate;
      
    const completedDate = milestone.completedDate
      ? (typeof milestone.completedDate === 'string' 
          ? new Date(milestone.completedDate) 
          : milestone.completedDate)
      : null;
    
    // Find the highest order for milestones with the same quotationId
    const existingMilestones = await this.getMilestones(milestone.quotationId);
    const maxOrder = existingMilestones.length > 0
      ? Math.max(...existingMilestones.map(m => m.order))
      : -1;
    
    const newMilestone: Milestone = {
      id,
      quotationId: milestone.quotationId,
      title: milestone.title,
      description: milestone.description || null,
      startDate,
      endDate,
      status: milestone.status,
      completedDate,
      order: milestone.order !== undefined ? milestone.order : maxOrder + 1,
      createdAt: new Date(),
    };
    
    this.milestones.set(id, newMilestone);
    return newMilestone;
  }
  
  async updateMilestone(id: number, milestone: Partial<InsertMilestone>): Promise<Milestone | undefined> {
    const existingMilestone = this.milestones.get(id);
    if (!existingMilestone) return undefined;
    
    // Handle date conversions
    let startDate = existingMilestone.startDate;
    if (milestone.startDate) {
      startDate = typeof milestone.startDate === 'string'
        ? new Date(milestone.startDate)
        : milestone.startDate;
    }
    
    let endDate = existingMilestone.endDate;
    if (milestone.endDate) {
      endDate = typeof milestone.endDate === 'string'
        ? new Date(milestone.endDate)
        : milestone.endDate;
    }
    
    let completedDate = existingMilestone.completedDate;
    if (milestone.completedDate !== undefined) {
      completedDate = milestone.completedDate
        ? (typeof milestone.completedDate === 'string'
            ? new Date(milestone.completedDate)
            : milestone.completedDate)
        : null;
    }
    
    const updatedMilestone: Milestone = {
      ...existingMilestone,
      ...milestone,
      startDate,
      endDate,
      completedDate,
      description: milestone.description !== undefined ? milestone.description : existingMilestone.description,
    };
    
    this.milestones.set(id, updatedMilestone);
    return updatedMilestone;
  }
  
  async deleteMilestone(id: number): Promise<boolean> {
    return this.milestones.delete(id);
  }
  
  async reorderMilestones(milestoneIds: number[]): Promise<boolean> {
    try {
      // Validate all IDs exist
      for (const id of milestoneIds) {
        if (!this.milestones.has(id)) {
          return false;
        }
      }
      
      // Update order for each milestone
      milestoneIds.forEach((id, index) => {
        const milestone = this.milestones.get(id);
        if (milestone) {
          this.milestones.set(id, {
            ...milestone,
            order: index
          });
        }
      });
      
      return true;
    } catch (error) {
      console.error("Error reordering milestones:", error);
      return false;
    }
  }
  
  async updateMilestoneStatus(id: number, status: "pending" | "in_progress" | "completed" | "delayed", completedDate?: Date): Promise<Milestone | undefined> {
    const milestone = this.milestones.get(id);
    if (!milestone) return undefined;
    
    let newCompletedDate = milestone.completedDate;
    if (status === "completed" && !milestone.completedDate) {
      newCompletedDate = completedDate || new Date();
    } else if (status !== "completed") {
      newCompletedDate = null;
    }
    
    const updatedMilestone: Milestone = {
      ...milestone,
      status,
      completedDate: newCompletedDate
    };
    
    this.milestones.set(id, updatedMilestone);
    return updatedMilestone;
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter(invoice => invoice.customerId === customerId);
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoiceByQuotation(quotationId: number): Promise<Invoice | undefined> {
    return Array.from(this.invoices.values())
      .find(invoice => invoice.quotationId === quotationId);
  }
  
  async getInvoiceBySalesOrder(salesOrderId: number): Promise<Invoice | undefined> {
    // First get the sales order to find its quotation ID
    const salesOrder = await this.getSalesOrder(salesOrderId);
    if (!salesOrder) {
      return undefined;
    }
    
    // Then use the quotation ID to find the invoice
    return this.getInvoiceByQuotation(salesOrder.quotationId);
  }

  async getInvoiceWithDetails(id: number): Promise<Invoice & { 
    customer: Customer, 
    quotation: QuotationWithDetails 
  } | undefined> {
    const invoice = this.invoices.get(id);
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
  }

  async createInvoiceFromQuotation(quotationId: number, data?: Partial<InsertInvoice>): Promise<Invoice> {
    const quotation = await this.getQuotationWithDetails(quotationId);
    if (!quotation) {
      throw new Error(`Quotation with ID ${quotationId} not found`);
    }
    
    if (quotation.status !== 'approved') {
      throw new Error(`Quotation with ID ${quotationId} is not approved. Current status: ${quotation.status}`);
    }
    
    // Check if quotation is already converted to an invoice
    const existingInvoice = await this.getInvoiceByQuotation(quotationId);
    if (existingInvoice) {
      throw new Error(`Quotation with ID ${quotationId} is already converted to Invoice #${existingInvoice.id}`);
    }
    
    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(this.invoiceIdCounter).padStart(3, '0')}`;
    
    // Create invoice with 30 days due date by default
    const dueDate = data?.dueDate ? new Date(data.dueDate) : new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Default due date is 30 days from now
    
    const invoice: Invoice = {
      id: this.invoiceIdCounter++,
      invoiceNumber,
      quotationId,
      customerId: quotation.customerId,
      totalAmount: quotation.finalPrice,
      amountPaid: 0,
      amountDue: quotation.finalPrice,
      status: 'pending',
      dueDate,
      invoiceDate: new Date(),
      notes: data?.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save the invoice
    this.invoices.set(invoice.id, invoice);
    
    // Mark quotation as converted
    await this.updateQuotationStatus(quotationId, 'converted');
    
    return invoice;
  }

  async updateInvoiceStatus(id: number, status: "pending" | "paid" | "partially_paid" | "overdue" | "cancelled"): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice: Invoice = {
      ...invoice,
      status,
      updatedAt: new Date()
    };
    
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    if (!existingInvoice) return undefined;
    
    const updatedInvoice: Invoice = {
      ...existingInvoice,
      ...invoice,
      updatedAt: new Date()
    };
    
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async cancelInvoice(id: number): Promise<Invoice | undefined> {
    return this.updateInvoiceStatus(id, 'cancelled');
  }
  
  async createInvoiceFromSalesOrder(salesOrderId: number, data?: Partial<InsertInvoice>): Promise<Invoice> {
    // Get the sales order with details
    const salesOrder = await this.getSalesOrder(salesOrderId);
    if (!salesOrder) {
      throw new Error(`Sales Order with ID ${salesOrderId} not found`);
    }
    
    // Get the quotation
    const quotation = await this.getQuotationWithDetails(salesOrder.quotationId);
    if (!quotation) {
      throw new Error(`Quotation with ID ${salesOrder.quotationId} not found`);
    }
    
    // Check if the original quotation is already converted to an invoice
    const existingInvoice = await this.getInvoiceByQuotation(quotation.id);
    if (existingInvoice) {
      throw new Error(`Quotation with ID ${quotation.id} is already converted to Invoice #${existingInvoice.id}`);
    }
    
    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(this.invoiceIdCounter).padStart(3, '0')}`;
    
    // Create invoice with 30 days due date by default
    const dueDate = data?.dueDate ? new Date(data.dueDate) : new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Default due date is 30 days from now
    
    const invoice: Invoice = {
      id: this.invoiceIdCounter++,
      invoiceNumber,
      quotationId: quotation.id,
      customerId: quotation.customerId,
      totalAmount: salesOrder.totalAmount,
      amountPaid: salesOrder.amountPaid,
      amountDue: salesOrder.amountDue,
      status: salesOrder.paymentStatus === 'paid' ? 'paid' : (salesOrder.paymentStatus === 'partially_paid' ? 'partially_paid' : 'pending'),
      dueDate,
      invoiceDate: new Date(),
      notes: data?.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save the invoice
    this.invoices.set(invoice.id, invoice);
    
    // We don't update the status of the quotation as it's already marked as converted when the sales order was created
    
    return invoice;
  }
}

export const storage = new MemStorage();