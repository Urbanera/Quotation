import {
  customers, Customer, InsertCustomer,
  quotations, Quotation, InsertQuotation,
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
  accessoryCatalog, AccessoryCatalog, InsertAccessoryCatalog
} from "@shared/schema";

export interface IStorage {
  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: InsertCustomer): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Customer Follow-up operations
  getFollowUps(customerId: number): Promise<FollowUp[]>;
  getFollowUp(id: number): Promise<FollowUp | undefined>;
  createFollowUp(followUp: InsertFollowUp): Promise<FollowUp>;
  updateFollowUp(id: number, followUp: Partial<InsertFollowUp>): Promise<FollowUp | undefined>;
  deleteFollowUp(id: number): Promise<boolean>;
  getPendingFollowUps(): Promise<Array<FollowUp & { customer: Customer }>>;
  markFollowUpComplete(id: number): Promise<FollowUp | undefined>;
  
  // Quotation operations
  getQuotations(): Promise<Quotation[]>;
  getQuotation(id: number): Promise<Quotation | undefined>;
  getQuotationWithDetails(id: number): Promise<QuotationWithDetails | undefined>;
  getQuotationsByCustomer(customerId: number): Promise<Quotation[]>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined>;
  deleteQuotation(id: number): Promise<boolean>;
  
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
  
  // Accessory Catalog operations
  getAccessoryCatalog(): Promise<AccessoryCatalog[]>;
  getAccessoryCatalogByCategory(category: string): Promise<AccessoryCatalog[]>;
  getAccessoryCatalogItem(id: number): Promise<AccessoryCatalog | undefined>;
  createAccessoryCatalogItem(item: InsertAccessoryCatalog): Promise<AccessoryCatalog>;
  updateAccessoryCatalogItem(id: number, item: Partial<InsertAccessoryCatalog>): Promise<AccessoryCatalog | undefined>;
  deleteAccessoryCatalogItem(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
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
  private accessoryCatalog: Map<number, AccessoryCatalog>;
  
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
  private accessoryCatalogIdCounter: number;
  
  constructor() {
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
    this.accessoryCatalog = new Map();
    
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
    this.accessoryCatalogIdCounter = 1;
    
    // Add some initial data
    this.initializeData();
  }

  private initializeData() {
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
    
    // Add sample accessory catalog items
    
    // Handle accessories
    const handleItems = [
      {
        category: "handle" as const,
        code: "LH-101",
        name: "Lecco Aluminium Handle",
        description: "Modern aluminium profile handle",
        sellingPrice: 120,
        size: "196mm",
        image: ""
      },
      {
        category: "handle" as const,
        code: "LH-202",
        name: "Lecco SS Profile Handle",
        description: "Stainless steel profile handle",
        sellingPrice: 220,
        size: "320mm",
        image: ""
      }
    ];
    
    // Kitchen accessories
    const kitchenItems = [
      {
        category: "kitchen" as const,
        code: "LA-101",
        name: "Corner Carousel Unit",
        description: "Quality rotary corner unit for kitchen storage",
        sellingPrice: 4800,
        kitchenPrice: 4800,
        wardrobePrice: null,
        image: ""
      },
      {
        category: "kitchen" as const,
        code: "LA-102",
        name: "Pull-Out Pantry Unit",
        description: "Sleek pull-out pantry storage",
        sellingPrice: 12500,
        kitchenPrice: 12500,
        wardrobePrice: null,
        image: ""
      }
    ];
    
    // Light accessories
    const lightItems = [
      {
        category: "light" as const,
        code: "LL-101",
        name: "Profile LED Light",
        description: "Aluminum profile with LED strip",
        sellingPrice: 1800,
        size: "1m",
        image: ""
      },
      {
        category: "light" as const,
        code: "LL-202",
        name: "Sensor Cabinet Light",
        description: "Motion activated cabinet light",
        sellingPrice: 980,
        size: "300mm",
        image: ""
      }
    ];
    
    // Wardrobe accessories
    const wardrobeItems = [
      {
        category: "wardrobe" as const,
        code: "LW-101",
        name: "Pull-Down Hanging Rail",
        description: "Adjustable pull-down rail system",
        sellingPrice: 3200,
        wardrobePrice: 3200,
        kitchenPrice: null,
        image: ""
      },
      {
        category: "wardrobe" as const,
        code: "LW-202",
        name: "Trouser Rack",
        description: "Pull-out rack for trousers",
        sellingPrice: 2500,
        wardrobePrice: 2500,
        kitchenPrice: null,
        image: ""
      }
    ];
    
    // Add all items to catalog
    const allItems = [...handleItems, ...kitchenItems, ...lightItems, ...wardrobeItems];
    
    for (const item of allItems) {
      const catalogItem: AccessoryCatalog = {
        id: this.accessoryCatalogIdCounter++,
        ...item,
        createdAt: new Date()
      };
      this.accessoryCatalog.set(catalogItem.id, catalogItem);
    }
  }
  
  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
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
    
    const updatedCustomer: Customer = {
      ...existingCustomer,
      ...customer,
    };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }
  
  // Customer Follow-up operations
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
  
  async markFollowUpComplete(id: number): Promise<FollowUp | undefined> {
    const followUp = this.followUps.get(id);
    if (!followUp) return undefined;
    
    const updatedFollowUp = {
      ...followUp,
      completed: true
    };
    
    this.followUps.set(id, updatedFollowUp);
    return updatedFollowUp;
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
      totalSellingPrice: quotation.totalSellingPrice || 0,
      totalDiscountedPrice: quotation.totalDiscountedPrice || 0,
      installationHandling: quotation.installationHandling || 0,
      globalDiscount: quotation.globalDiscount || 0,
      gstPercentage: quotation.gstPercentage || 0,
      gstAmount: quotation.gstAmount || 0,
      finalPrice: quotation.finalPrice || 0,
      createdAt: now,
      updatedAt: now,
    };
    this.quotations.set(id, newQuotation);
    return newQuotation;
  }
  
  async updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation | undefined> {
    const existingQuotation = this.quotations.get(id);
    if (!existingQuotation) return undefined;
    
    const updatedQuotation: Quotation = {
      ...existingQuotation,
      ...quotation,
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
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const newProduct: Product = {
      id,
      name: product.name,
      description: product.description,
      quantity: product.quantity,
      price: product.price,
      discount: product.discount,
      discountType: product.discountType,
      discountedPrice: product.discountedPrice,
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
    
    const updatedProduct: Product = {
      ...existingProduct,
      ...product,
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
    const newAccessory: Accessory = {
      id,
      name: accessory.name,
      description: accessory.description,
      quantity: accessory.quantity,
      price: accessory.price,
      discount: accessory.discount,
      discountType: accessory.discountType,
      discountedPrice: accessory.discountedPrice,
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
    
    const updatedAccessory: Accessory = {
      ...existingAccessory,
      ...accessory,
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
      sellingPrice += product.price * product.quantity;
      discountedPrice += product.discountedPrice * product.quantity;
    }
    
    // Add accessory prices
    for (const accessory of accessories) {
      sellingPrice += accessory.price * accessory.quantity;
      discountedPrice += accessory.discountedPrice * accessory.quantity;
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
        totalInstallationCharges += charge.amount;
      }
    }
    
    // Apply GST
    const subtotal = priceAfterGlobalDiscount + totalInstallationCharges + quotation.installationHandling;
    const gstAmount = subtotal * (quotation.gstPercentage / 100);
    const finalPrice = subtotal + gstAmount;
    
    // Update quotation
    this.quotations.set(quotationId, {
      ...quotation,
      totalSellingPrice,
      totalDiscountedPrice,
      gstAmount,
      finalPrice,
      updatedAt: new Date()
    });
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
  
  // Accessory Catalog operations
  async getAccessoryCatalog(): Promise<AccessoryCatalog[]> {
    return Array.from(this.accessoryCatalog.values());
  }
  
  async getAccessoryCatalogByCategory(category: string): Promise<AccessoryCatalog[]> {
    return Array.from(this.accessoryCatalog.values())
      .filter(item => item.category === category)
      .sort((a, b) => a.code.localeCompare(b.code));
  }
  
  async getAccessoryCatalogItem(id: number): Promise<AccessoryCatalog | undefined> {
    return this.accessoryCatalog.get(id);
  }
  
  async createAccessoryCatalogItem(item: InsertAccessoryCatalog): Promise<AccessoryCatalog> {
    const id = this.accessoryCatalogIdCounter++;
    const newItem: AccessoryCatalog = {
      ...item,
      id,
      createdAt: new Date()
    };
    this.accessoryCatalog.set(id, newItem);
    return newItem;
  }
  
  async updateAccessoryCatalogItem(id: number, item: Partial<InsertAccessoryCatalog>): Promise<AccessoryCatalog | undefined> {
    const existingItem = this.accessoryCatalog.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem: AccessoryCatalog = {
      ...existingItem,
      ...item,
    };
    
    this.accessoryCatalog.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteAccessoryCatalogItem(id: number): Promise<boolean> {
    return this.accessoryCatalog.delete(id);
  }
}

export const storage = new MemStorage();