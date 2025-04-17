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
  teamMembers, TeamMember, InsertTeamMember
} from "@shared/schema";

export interface IStorage {
  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: InsertCustomer): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
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
}

export class MemStorage implements IStorage {
  private customers: Map<number, Customer>;
  private quotations: Map<number, Quotation>;
  private rooms: Map<number, Room>;
  private products: Map<number, Product>;
  private accessories: Map<number, Accessory>;
  private images: Map<number, Image>;
  private installationCharges: Map<number, InstallationCharge>;
  
  private customerIdCounter: number;
  private quotationIdCounter: number;
  private roomIdCounter: number;
  private productIdCounter: number;
  private accessoryIdCounter: number;
  private imageIdCounter: number;
  private installationChargeIdCounter: number;
  
  constructor() {
    this.customers = new Map();
    this.quotations = new Map();
    this.rooms = new Map();
    this.products = new Map();
    this.accessories = new Map();
    this.images = new Map();
    this.installationCharges = new Map();
    
    this.customerIdCounter = 1;
    this.quotationIdCounter = 1;
    this.roomIdCounter = 1;
    this.productIdCounter = 1;
    this.accessoryIdCounter = 1;
    this.imageIdCounter = 1;
    this.installationChargeIdCounter = 1;
    
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
      
      return {
        ...room,
        products: roomProducts,
        accessories: roomAccessories,
        images: roomImages,
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
      description: product.description === undefined ? null : product.description,
      sellingPrice: product.sellingPrice,
      discountedPrice: typeof product.discountedPrice === 'number' ? product.discountedPrice : 0,
      roomId: product.roomId
    };
    this.products.set(id, newProduct);
    
    // Update room and quotation prices
    const room = this.rooms.get(product.roomId);
    if (room) {
      await this.updateRoomPrices(room.id);
      await this.updateQuotationPrices(room.quotationId);
    }
    
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
    
    // Update room and quotation prices
    const room = this.rooms.get(existingProduct.roomId);
    if (room) {
      await this.updateRoomPrices(room.id);
      await this.updateQuotationPrices(room.quotationId);
    }
    
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    
    const result = this.products.delete(id);
    
    // Update room and quotation prices
    const room = this.rooms.get(product.roomId);
    if (room) {
      await this.updateRoomPrices(room.id);
      await this.updateQuotationPrices(room.quotationId);
    }
    
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
      description: accessory.description === undefined ? null : accessory.description,
      sellingPrice: accessory.sellingPrice,
      discountedPrice: typeof accessory.discountedPrice === 'number' ? accessory.discountedPrice : 0,
      roomId: accessory.roomId
    };
    this.accessories.set(id, newAccessory);
    
    // Update room and quotation prices
    const room = this.rooms.get(accessory.roomId);
    if (room) {
      await this.updateRoomPrices(room.id);
      await this.updateQuotationPrices(room.quotationId);
    }
    
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
    
    // Update room and quotation prices
    const room = this.rooms.get(existingAccessory.roomId);
    if (room) {
      await this.updateRoomPrices(room.id);
      await this.updateQuotationPrices(room.quotationId);
    }
    
    return updatedAccessory;
  }
  
  async deleteAccessory(id: number): Promise<boolean> {
    const accessory = this.accessories.get(id);
    if (!accessory) return false;
    
    const result = this.accessories.delete(id);
    
    // Update room and quotation prices
    const room = this.rooms.get(accessory.roomId);
    if (room) {
      await this.updateRoomPrices(room.id);
      await this.updateQuotationPrices(room.quotationId);
    }
    
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
      ...image,
      id,
      order: image.order ?? maxOrder + 1,
    };
    this.images.set(id, newImage);
    return newImage;
  }
  
  async deleteImage(id: number): Promise<boolean> {
    const image = this.images.get(id);
    if (!image) return false;
    
    const roomId = image.roomId;
    const result = this.images.delete(id);
    
    // Reorder remaining images
    const remainingImages = await this.getImages(roomId);
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
    
    // Update room and quotation prices
    const room = this.rooms.get(charge.roomId);
    if (room) {
      await this.updateRoomPrices(room.id);
      await this.updateQuotationPrices(room.quotationId);
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
    
    // Update room and quotation prices
    const room = this.rooms.get(existingCharge.roomId);
    if (room) {
      await this.updateRoomPrices(room.id);
      await this.updateQuotationPrices(room.quotationId);
    }
    
    return updatedCharge;
  }
  
  async deleteInstallationCharge(id: number): Promise<boolean> {
    const charge = this.installationCharges.get(id);
    if (!charge) return false;
    
    const result = this.installationCharges.delete(id);
    
    // Update room and quotation prices
    const room = this.rooms.get(charge.roomId);
    if (room) {
      await this.updateRoomPrices(room.id);
      await this.updateQuotationPrices(room.quotationId);
    }
    
    return result;
  }
  
  // Helper methods for price calculations
  private async updateRoomPrices(roomId: number) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    const products = await this.getProducts(roomId);
    const accessories = await this.getAccessories(roomId);
    
    const sellingPrice = [
      ...products.map(p => p.sellingPrice),
      ...accessories.map(a => a.sellingPrice),
    ].reduce((sum, price) => sum + price, 0);
    
    const discountedPrice = [
      ...products.map(p => p.discountedPrice),
      ...accessories.map(a => a.discountedPrice),
    ].reduce((sum, price) => sum + price, 0);
    
    this.rooms.set(roomId, {
      ...room,
      sellingPrice,
      discountedPrice,
    });
  }
  
  private async updateQuotationPrices(quotationId: number) {
    const quotation = this.quotations.get(quotationId);
    if (!quotation) return;
    
    const rooms = await this.getRooms(quotationId);
    
    const totalSellingPrice = rooms
      .reduce((sum, room) => sum + room.sellingPrice, 0);
    
    const totalDiscountedPrice = rooms
      .reduce((sum, room) => sum + room.discountedPrice, 0);
    
    // Calculate total installation charges
    let totalInstallationCharges = 0;
    for (const room of rooms) {
      const charges = await this.getInstallationCharges(room.id);
      totalInstallationCharges += charges.reduce((sum, charge) => sum + charge.amount, 0);
    }
    
    // Apply global discount to the already discounted price
    const globalDiscountAmount = quotation.globalDiscount > 0 
      ? totalDiscountedPrice * (quotation.globalDiscount / 100)
      : 0;
    
    const priceAfterGlobalDiscount = totalDiscountedPrice - globalDiscountAmount;
    
    // Include installation charges and handling in GST calculation
    const totalChargesAndHandling = totalInstallationCharges + quotation.installationHandling;
    
    // Calculate GST
    const gstAmount = (priceAfterGlobalDiscount + totalChargesAndHandling) * (quotation.gstPercentage / 100);
    
    // Calculate final price
    const finalPrice = priceAfterGlobalDiscount + totalChargesAndHandling + gstAmount;
    
    this.quotations.set(quotationId, {
      ...quotation,
      totalSellingPrice,
      totalDiscountedPrice,
      gstAmount,
      finalPrice,
      updatedAt: new Date(),
    });
  }
}

export const storage = new MemStorage();
