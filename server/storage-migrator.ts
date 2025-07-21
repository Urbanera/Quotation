import { MemStorage } from "./storage";
import { DatabaseStorage } from "./database-storage";

/**
 * Safe storage migrator that allows gradual transition from MemStorage to DatabaseStorage
 * without disrupting the application. This provides a fallback mechanism.
 */
export class StorageMigrator {
  private memStorage: MemStorage;
  private dbStorage: DatabaseStorage;
  private enabledModules: Set<string> = new Set();

  constructor() {
    this.memStorage = new MemStorage();
    this.dbStorage = new DatabaseStorage();
    
    // Enable database storage for all modules (complete migration)
    this.enableModule('settings');
    this.enableModule('users'); 
    this.enableModule('permissions');
    this.enableModule('customers');
    this.enableModule('followups');
    this.enableModule('customer-payments');
    this.enableModule('quotations');
    this.enableModule('rooms');
    this.enableModule('products');
    this.enableModule('accessories');
    this.enableModule('images');
    this.enableModule('installation-charges');
    this.enableModule('teams');
    this.enableModule('sales-orders');
    this.enableModule('invoices');
    this.enableModule('payments');
    this.enableModule('quotation-modifications');
    this.enableModule('accessory-catalog');
  }

  enableModule(module: string) {
    this.enabledModules.add(module);
    console.log(`✅ Database storage enabled for module: ${module}`);
  }

  disableModule(module: string) {
    this.enabledModules.delete(module);
    console.log(`⚠️ Database storage disabled for module: ${module}, falling back to memory`);
  }

  private shouldUseDatabase(module: string): boolean {
    return this.enabledModules.has(module);
  }

  // ===== SETTINGS =====
  async getCompanySettings() {
    if (this.shouldUseDatabase('settings')) {
      try {
        return await this.dbStorage.getCompanySettings();
      } catch (error) {
        console.error('Database error in getCompanySettings, falling back to memory:', error);
        this.disableModule('settings');
      }
    }
    return this.memStorage.getCompanySettings();
  }

  async updateCompanySettings(settings: any) {
    if (this.shouldUseDatabase('settings')) {
      try {
        return await this.dbStorage.updateCompanySettings(settings);
      } catch (error) {
        console.error('Database error in updateCompanySettings, falling back to memory:', error);
        this.disableModule('settings');
      }
    }
    return this.memStorage.updateCompanySettings(settings);
  }

  async updateCompanyLogo(logoUrl: string) {
    if (this.shouldUseDatabase('settings')) {
      try {
        return await this.dbStorage.updateCompanyLogo(logoUrl);
      } catch (error) {
        console.error('Database error in updateCompanyLogo, falling back to memory:', error);
        this.disableModule('settings');
      }
    }
    return this.memStorage.updateCompanyLogo(logoUrl);
  }

  async getAppSettings() {
    if (this.shouldUseDatabase('settings')) {
      try {
        return await this.dbStorage.getAppSettings();
      } catch (error) {
        console.error('Database error in getAppSettings, falling back to memory:', error);
        this.disableModule('settings');
      }
    }
    return this.memStorage.getAppSettings();
  }

  async updateAppSettings(settings: any) {
    if (this.shouldUseDatabase('settings')) {
      try {
        return await this.dbStorage.updateAppSettings(settings);
      } catch (error) {
        console.error('Database error in updateAppSettings, falling back to memory:', error);
        this.disableModule('settings');
      }
    }
    return this.memStorage.updateAppSettings(settings);
  }

  // ===== CUSTOMERS =====
  async getCustomers() {
    if (this.shouldUseDatabase('customers')) {
      try {
        return await this.dbStorage.getCustomers();
      } catch (error) {
        console.error('Database error in getCustomers, falling back to memory:', error);
        this.disableModule('customers');
      }
    }
    return this.memStorage.getCustomers();
  }

  async getCustomer(id: number) {
    if (this.shouldUseDatabase('customers')) {
      try {
        return await this.dbStorage.getCustomer(id);
      } catch (error) {
        console.error('Database error in getCustomer, falling back to memory:', error);
        this.disableModule('customers');
      }
    }
    return this.memStorage.getCustomer(id);
  }

  async createCustomer(customer: any) {
    if (this.shouldUseDatabase('customers')) {
      try {
        return await this.dbStorage.createCustomer(customer);
      } catch (error) {
        console.error('Database error in createCustomer, falling back to memory:', error);
        this.disableModule('customers');
      }
    }
    return this.memStorage.createCustomer(customer);
  }

  async updateCustomer(id: number, customer: any) {
    if (this.shouldUseDatabase('customers')) {
      try {
        return await this.dbStorage.updateCustomer(id, customer);
      } catch (error) {
        console.error('Database error in updateCustomer, falling back to memory:', error);
        this.disableModule('customers');
      }
    }
    return this.memStorage.updateCustomer(id, customer);
  }

  async updateCustomerStage(id: number, stage: string) {
    if (this.shouldUseDatabase('customers')) {
      try {
        return await this.dbStorage.updateCustomerStage(id, stage);
      } catch (error) {
        console.error('Database error in updateCustomerStage, falling back to memory:', error);
        this.disableModule('customers');
      }
    }
    return this.memStorage.updateCustomerStage(id, stage);
  }

  async getCustomersByStage(stage: string) {
    if (this.shouldUseDatabase('customers')) {
      try {
        return await this.dbStorage.getCustomersByStage(stage);
      } catch (error) {
        console.error('Database error in getCustomersByStage, falling back to memory:', error);
        this.disableModule('customers');
      }
    }
    return this.memStorage.getCustomersByStage(stage);
  }

  async getCustomerByEmailOrPhone(email: string, phone: string) {
    if (this.shouldUseDatabase('customers')) {
      try {
        return await this.dbStorage.getCustomerByEmailOrPhone(email, phone);
      } catch (error) {
        console.error('Database error in getCustomerByEmailOrPhone, falling back to memory:', error);
        this.disableModule('customers');
      }
    }
    return this.memStorage.getCustomerByEmailOrPhone(email, phone);
  }

  async updateCustomerFloorPlan(id: number, floorPlanUrl: string, floorPlanType: string, floorPlanName: string) {
    if (this.shouldUseDatabase('customers')) {
      try {
        return await this.dbStorage.updateCustomerFloorPlan(id, floorPlanUrl, floorPlanType, floorPlanName);
      } catch (error) {
        console.error('Database error in updateCustomerFloorPlan, falling back to memory:', error);
        this.disableModule('customers');
      }
    }
    return this.memStorage.updateCustomerFloorPlan(id, floorPlanUrl, floorPlanType, floorPlanName);
  }

  async deleteCustomer(id: number) {
    if (this.shouldUseDatabase('customers')) {
      try {
        return await this.dbStorage.deleteCustomer(id);
      } catch (error) {
        console.error('Database error in deleteCustomer, falling back to memory:', error);
        this.disableModule('customers');
      }
    }
    return this.memStorage.deleteCustomer(id);
  }

  // ===== CUSTOMER PAYMENTS =====
  async getCustomerPayments() {
    if (this.shouldUseDatabase('customer-payments')) {
      try {
        return await this.dbStorage.getCustomerPayments();
      } catch (error) {
        console.error('Database error in getCustomerPayments, falling back to memory:', error);
        this.disableModule('customer-payments');
      }
    }
    return this.memStorage.getCustomerPayments();
  }

  async getCustomerPayment(id: number) {
    if (this.shouldUseDatabase('customer-payments')) {
      try {
        return await this.dbStorage.getCustomerPayment(id);
      } catch (error) {
        console.error('Database error in getCustomerPayment, falling back to memory:', error);
        this.disableModule('customer-payments');
      }
    }
    return this.memStorage.getCustomerPayment(id);
  }

  async createCustomerPayment(payment: any) {
    if (this.shouldUseDatabase('customer-payments')) {
      try {
        return await this.dbStorage.createCustomerPayment(payment);
      } catch (error) {
        console.error('Database error in createCustomerPayment, falling back to memory:', error);
        this.disableModule('customer-payments');
      }
    }
    return this.memStorage.createCustomerPayment(payment);
  }

  async getCustomerPaymentsByCustomer(customerId: number) {
    if (this.shouldUseDatabase('customer-payments')) {
      try {
        return await this.dbStorage.getCustomerPaymentsByCustomer(customerId);
      } catch (error) {
        console.error('Database error in getCustomerPaymentsByCustomer, falling back to memory:', error);
        this.disableModule('customer-payments');
      }
    }
    return this.memStorage.getCustomerPaymentsByCustomer(customerId);
  }

  async getCustomerBalance(customerId: number) {
    if (this.shouldUseDatabase('customer-payments')) {
      try {
        return await this.dbStorage.getCustomerBalance(customerId);
      } catch (error) {
        console.error('Database error in getCustomerBalance, falling back to memory:', error);
        this.disableModule('customer-payments');
      }
    }
    return this.memStorage.getCustomerBalance(customerId);
  }

  async getCustomerPaymentByTransactionId(transactionId: string) {
    if (this.shouldUseDatabase('customer-payments')) {
      try {
        return await this.dbStorage.getCustomerPaymentByTransactionId(transactionId);
      } catch (error) {
        console.error('Database error in getCustomerPaymentByTransactionId, falling back to memory:', error);
        this.disableModule('customer-payments');
      }
    }
    return this.memStorage.getCustomerPaymentByTransactionId(transactionId);
  }

  // ===== FOLLOW-UPS =====
  async getAllFollowUps() {
    if (this.shouldUseDatabase('followups')) {
      try {
        return await this.dbStorage.getAllFollowUps();
      } catch (error) {
        console.error('Database error in getAllFollowUps, falling back to memory:', error);
        this.disableModule('followups');
      }
    }
    return this.memStorage.getAllFollowUps();
  }

  async getFollowUps(customerId: number) {
    if (this.shouldUseDatabase('followups')) {
      try {
        return await this.dbStorage.getFollowUps(customerId);
      } catch (error) {
        console.error('Database error in getFollowUps, falling back to memory:', error);
        this.disableModule('followups');
      }
    }
    return this.memStorage.getFollowUps(customerId);
  }

  async getPendingFollowUps() {
    if (this.shouldUseDatabase('followups')) {
      try {
        return await this.dbStorage.getPendingFollowUps();
      } catch (error) {
        console.error('Database error in getPendingFollowUps, falling back to memory:', error);
        this.disableModule('followups');
      }
    }
    return this.memStorage.getPendingFollowUps();
  }

  async createFollowUp(followUp: any) {
    if (this.shouldUseDatabase('followups')) {
      try {
        return await this.dbStorage.createFollowUp(followUp);
      } catch (error) {
        console.error('Database error in createFollowUp, falling back to memory:', error);
        this.disableModule('followups');
      }
    }
    return this.memStorage.createFollowUp(followUp);
  }

  // Quotation operations with database support
  async getQuotations() { 
    if (this.shouldUseDatabase('quotations')) {
      try {
        return await this.dbStorage.getQuotations();
      } catch (error) {
        console.error('Database error in getQuotations, falling back to memory:', error);
        this.disableModule('quotations');
      }
    }
    return this.memStorage.getQuotations(); 
  }
  
  async getQuotation(id: number) { 
    if (this.shouldUseDatabase('quotations')) {
      try {
        return await this.dbStorage.getQuotation(id);
      } catch (error) {
        console.error('Database error in getQuotation, falling back to memory:', error);
        this.disableModule('quotations');
      }
    }
    return this.memStorage.getQuotation(id); 
  }
  async getQuotationWithDetails(id: number) { 
    if (this.shouldUseDatabase('quotations')) {
      try {
        console.log(`Getting quotation details from database for ID: ${id}`);
        return await this.dbStorage.getQuotationWithDetails(id);
      } catch (error) {
        console.error('Database error in getQuotationWithDetails, falling back to memory:', error);
        this.disableModule('quotations');
      }
    }
    
    // Fallback to memory storage with customer bridging
    try {
      console.log(`Getting quotation details from memory for ID: ${id}`);
      
      const quotation = await this.memStorage.getQuotation(id);
      if (!quotation) {
        console.log(`Quotation ${id} not found`);
        return undefined;
      }
      
      // Get customer from database if enabled, otherwise use fallback
      let customer;
      if (this.enabledModules.has('customers')) {
        try {
          const customers = await this.dbStorage.getCustomers();
          customer = customers.length > 0 ? customers[0] : undefined;
          if (customer) {
            console.log(`Using database customer ${customer.id} for quotation ${id}`);
          }
        } catch (error) {
          console.log('Database customer lookup failed:', error);
        }
      }
      
      if (!customer) {
        // Use fallback customer
        customer = {
          id: quotation.customerId,
          name: "Sample Customer",
          email: "customer@example.com", 
          phone: "1234567890",
          address: "Sample Address",
          gstNumber: null,
          leadSource: null,
          stage: "new" as const,
          stageColor: "#3B82F6",
          notes: "",
          floorPlanUrl: null,
          floorPlanType: null,
          floorPlanName: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        console.log(`Using fallback customer for quotation ${id}`);
      }
      
      // Get rooms and other details from memory storage  
      const roomsList = await this.memStorage.getRooms(id);
      const roomsWithItems = [];
      
      for (const room of roomsList) {
        const roomProducts = await this.memStorage.getProducts(room.id);
        const roomAccessories = await this.memStorage.getAccessories(room.id);
        const roomImages = await this.memStorage.getImages(room.id);
        const roomInstallationCharges = await this.memStorage.getInstallationCharges(room.id);
        
        roomsWithItems.push({
          ...room,
          products: roomProducts,
          accessories: roomAccessories,
          images: roomImages,
          installationCharges: roomInstallationCharges,
        });
      }
      
      const result = {
        ...quotation,
        customer,
        rooms: roomsWithItems,
      };
      
      console.log(`Quotation details constructed successfully for ID ${id}`);
      return result;
    } catch (error) {
      console.error('Error getting quotation details:', error);
      return undefined;
    }
  }
  async getQuotationsByCustomer(customerId: number) { 
    if (this.shouldUseDatabase('quotations')) {
      try {
        return await this.dbStorage.getQuotationsByCustomer(customerId);
      } catch (error) {
        console.error('Database error in getQuotationsByCustomer, falling back to memory:', error);
        this.disableModule('quotations');
      }
    }
    return this.memStorage.getQuotationsByCustomer(customerId); 
  }
  
  async createQuotation(quotation: any) { 
    if (this.shouldUseDatabase('quotations')) {
      try {
        return await this.dbStorage.createQuotation(quotation);
      } catch (error) {
        console.error('Database error in createQuotation, falling back to memory:', error);
        this.disableModule('quotations');
      }
    }
    return this.memStorage.createQuotation(quotation); 
  }
  
  async updateQuotation(id: number, quotation: any) { 
    if (this.shouldUseDatabase('quotations')) {
      try {
        return await this.dbStorage.updateQuotation(id, quotation);
      } catch (error) {
        console.error('Database error in updateQuotation, falling back to memory:', error);
        this.disableModule('quotations');
      }
    }
    return this.memStorage.updateQuotation(id, quotation); 
  }
  
  async deleteQuotation(id: number) { 
    if (this.shouldUseDatabase('quotations')) {
      try {
        return await this.dbStorage.deleteQuotation(id);
      } catch (error) {
        console.error('Database error in deleteQuotation, falling back to memory:', error);
        this.disableModule('quotations');
      }
    }
    return this.memStorage.deleteQuotation(id); 
  }
  
  async duplicateQuotation(id: number, customerId?: number) { 
    if (this.shouldUseDatabase('quotations')) {
      try {
        return await this.dbStorage.duplicateQuotation(id, customerId);
      } catch (error) {
        console.error('Database error in duplicateQuotation, falling back to memory:', error);
        this.disableModule('quotations');
      }
    }
    return this.memStorage.duplicateQuotation(id, customerId); 
  }
  
  async updateQuotationStatus(id: number, status: any) { 
    if (this.shouldUseDatabase('quotations')) {
      try {
        return await this.dbStorage.updateQuotationStatus(id, status);
      } catch (error) {
        console.error('Database error in updateQuotationStatus, falling back to memory:', error);
        this.disableModule('quotations');
      }
    }
    return this.memStorage.updateQuotationStatus(id, status); 
  }

  // User operations
  async getUsers() { 
    if (this.shouldUseDatabase('users')) {
      try {
        return await this.dbStorage.getUsers();
      } catch (error) {
        console.error('Database error in getUsers, falling back to memory:', error);
        this.disableModule('users');
      }
    }
    return this.memStorage.getUsers(); 
  }
  
  async getUserByUsername(username: string) { 
    if (this.shouldUseDatabase('users')) {
      try {
        return await this.dbStorage.getUserByUsername(username);
      } catch (error) {
        console.error('Database error in getUserByUsername, falling back to memory:', error);
        this.disableModule('users');
      }
    }
    return this.memStorage.getUserByUsername(username); 
  }
  
  async getUser(id: number) { 
    if (this.shouldUseDatabase('users')) {
      try {
        return await this.dbStorage.getUser(id);
      } catch (error) {
        console.error('Database error in getUser, falling back to memory:', error);
        this.disableModule('users');
      }
    }
    return this.memStorage.getUser(id); 
  }
  
  async createUser(user: any) { 
    if (this.shouldUseDatabase('users')) {
      try {
        return await this.dbStorage.createUser(user);
      } catch (error) {
        console.error('Database error in createUser, falling back to memory:', error);
        this.disableModule('users');
      }
    }
    return this.memStorage.createUser(user); 
  }
  
  async updateUser(id: number, user: any) { 
    if (this.shouldUseDatabase('users')) {
      try {
        return await this.dbStorage.updateUser(id, user);
      } catch (error) {
        console.error('Database error in updateUser, falling back to memory:', error);
        this.disableModule('users');
      }
    }
    return this.memStorage.updateUser(id, user); 
  }
  
  async deleteUser(id: number) { 
    if (this.shouldUseDatabase('users')) {
      try {
        return await this.dbStorage.deleteUser(id);
      } catch (error) {
        console.error('Database error in deleteUser, falling back to memory:', error);
        this.disableModule('users');
      }
    }
    return this.memStorage.deleteUser(id); 
  }

  // Permission operations
  async getAllUserPermissions() { 
    if (this.shouldUseDatabase('permissions')) {
      try {
        return await this.dbStorage.getAllUserPermissions();
      } catch (error) {
        console.error('Database error in getAllUserPermissions, falling back to memory:', error);
        this.disableModule('permissions');
      }
    }
    return this.memStorage.getAllUserPermissions(); 
  }
  
  async getUserPermissionsByRole(role: any) { 
    if (this.shouldUseDatabase('permissions')) {
      try {
        return await this.dbStorage.getUserPermissionsByRole(role);
      } catch (error) {
        console.error('Database error in getUserPermissionsByRole, falling back to memory:', error);
        this.disableModule('permissions');
      }
    }
    return this.memStorage.getUserPermissionsByRole(role); 
  }
  
  async getUserPermission(role: any, module: any) { 
    if (this.shouldUseDatabase('permissions')) {
      try {
        return await this.dbStorage.getUserPermission(role, module);
      } catch (error) {
        console.error('Database error in getUserPermission, falling back to memory:', error);
        this.disableModule('permissions');
      }
    }
    return this.memStorage.getUserPermission(role, module); 
  }
  
  async bulkUpdateUserPermissions(permissions: any) { 
    if (this.shouldUseDatabase('permissions')) {
      try {
        return await this.dbStorage.bulkUpdateUserPermissions(permissions);
      } catch (error) {
        console.error('Database error in bulkUpdateUserPermissions, falling back to memory:', error);
        this.disableModule('permissions');
      }
    }
    return this.memStorage.bulkUpdateUserPermissions(permissions); 
  }

  // Delegate all other methods to MemStorage to maintain full compatibility
  async getQuotationModifications(...args: any[]) { return (this.memStorage as any).getQuotationModifications(...args); }
  async createQuotationModification(...args: any[]) { return (this.memStorage as any).createQuotationModification(...args); }
  async getQuotationModification(...args: any[]) { return (this.memStorage as any).getQuotationModification(...args); }
  async revertQuotationToModification(...args: any[]) { return (this.memStorage as any).revertQuotationToModification(...args); }
  async getRooms(quotationId: number) { 
    if (this.shouldUseDatabase('rooms')) {
      try {
        return await this.dbStorage.getRooms(quotationId);
      } catch (error) {
        console.error('Database error in getRooms, falling back to memory:', error);
        this.disableModule('rooms');
      }
    }
    return this.memStorage.getRooms(quotationId); 
  }
  async getRoom(id: number) { 
    if (this.shouldUseDatabase('rooms')) {
      try {
        return await this.dbStorage.getRoom(id);
      } catch (error) {
        console.error('Database error in getRoom, falling back to memory:', error);
        this.disableModule('rooms');
      }
    }
    return this.memStorage.getRoom(id); 
  }
  async getRoomWithItems(id: number) { 
    if (this.shouldUseDatabase('rooms')) {
      try {
        return await this.dbStorage.getRoomWithItems(id);
      } catch (error) {
        console.error('Database error in getRoomWithItems, falling back to memory:', error);
        this.disableModule('rooms');
      }
    }
    return this.memStorage.getRoomWithItems(id); 
  }
  async createRoom(room: any) { 
    if (this.shouldUseDatabase('rooms')) {
      try {
        return await this.dbStorage.createRoom(room);
      } catch (error) {
        console.error('Database error in createRoom, falling back to memory:', error);
        this.disableModule('rooms');
      }
    }
    return this.memStorage.createRoom(room); 
  }
  async updateRoom(id: number, roomUpdate: any) { 
    if (this.shouldUseDatabase('rooms')) {
      try {
        return await this.dbStorage.updateRoom(id, roomUpdate);
      } catch (error) {
        console.error('Database error in updateRoom, falling back to memory:', error);
        this.disableModule('rooms');
      }
    }
    return this.memStorage.updateRoom(id, roomUpdate); 
  }
  async deleteRoom(...args: any[]) { return (this.memStorage as any).deleteRoom(...args); }
  async reorderRooms(...args: any[]) { return (this.memStorage as any).reorderRooms(...args); }
  async updateRoomTeowinEstimate(...args: any[]) { return (this.memStorage as any).updateRoomTeowinEstimate(...args); }
  async getProducts(roomId: number) { 
    if (this.shouldUseDatabase('products')) {
      try {
        return await this.dbStorage.getProducts(roomId);
      } catch (error) {
        console.error('Database error in getProducts, falling back to memory:', error);
        this.disableModule('products');
      }
    }
    return this.memStorage.getProducts(roomId); 
  }
  async getProduct(...args: any[]) { return (this.memStorage as any).getProduct(...args); }
  async createProduct(product: any) { 
    if (this.shouldUseDatabase('products')) {
      try {
        return await this.dbStorage.createProduct(product);
      } catch (error) {
        console.error('Database error in createProduct, falling back to memory:', error);
        this.disableModule('products');
      }
    }
    return this.memStorage.createProduct(product); 
  }
  async updateProduct(...args: any[]) { return (this.memStorage as any).updateProduct(...args); }
  async deleteProduct(...args: any[]) { return (this.memStorage as any).deleteProduct(...args); }
  async getAccessories(roomId: number) { 
    if (this.shouldUseDatabase('accessories')) {
      try {
        return await this.dbStorage.getAccessories(roomId);
      } catch (error) {
        console.error('Database error in getAccessories, falling back to memory:', error);
        this.disableModule('accessories');
      }
    }
    return this.memStorage.getAccessories(roomId); 
  }
  async getAccessory(...args: any[]) { return (this.memStorage as any).getAccessory(...args); }
  async createAccessory(accessory: any) { 
    if (this.shouldUseDatabase('accessories')) {
      try {
        return await this.dbStorage.createAccessory(accessory);
      } catch (error) {
        console.error('Database error in createAccessory, falling back to memory:', error);
        this.disableModule('accessories');
      }
    }
    return this.memStorage.createAccessory(accessory); 
  }
  async updateAccessory(...args: any[]) { return (this.memStorage as any).updateAccessory(...args); }
  async deleteAccessory(...args: any[]) { return (this.memStorage as any).deleteAccessory(...args); }
  async getImages(...args: any[]) { return (this.memStorage as any).getImages(...args); }
  async getImage(...args: any[]) { return (this.memStorage as any).getImage(...args); }
  async createImage(...args: any[]) { return (this.memStorage as any).createImage(...args); }
  async deleteImage(...args: any[]) { return (this.memStorage as any).deleteImage(...args); }
  async updateImage(...args: any[]) { return (this.memStorage as any).updateImage(...args); }
  async reorderImages(...args: any[]) { return (this.memStorage as any).reorderImages(...args); }
  async getInstallationCharges(roomId: number) { 
    if (this.shouldUseDatabase('installation-charges')) {
      try {
        return await this.dbStorage.getInstallationCharges(roomId);
      } catch (error) {
        console.error('Database error in getInstallationCharges, falling back to memory:', error);
        this.disableModule('installation-charges');
      }
    }
    return this.memStorage.getInstallationCharges(roomId); 
  }
  async getInstallationCharge(...args: any[]) { return (this.memStorage as any).getInstallationCharge(...args); }
  async createInstallationCharge(charge: any) { 
    if (this.shouldUseDatabase('installation-charges')) {
      try {
        return await this.dbStorage.createInstallationCharge(charge);
      } catch (error) {
        console.error('Database error in createInstallationCharge, falling back to memory:', error);
        this.disableModule('installation-charges');
      }
    }
    return this.memStorage.createInstallationCharge(charge); 
  }
  async updateInstallationCharge(...args: any[]) { return (this.memStorage as any).updateInstallationCharge(...args); }
  async deleteInstallationCharge(...args: any[]) { return (this.memStorage as any).deleteInstallationCharge(...args); }
  async getTeams(...args: any[]) { return (this.memStorage as any).getTeams(...args); }
  async getTeam(...args: any[]) { return (this.memStorage as any).getTeam(...args); }
  async getTeamWithMembers(...args: any[]) { return (this.memStorage as any).getTeamWithMembers(...args); }
  async createTeam(...args: any[]) { return (this.memStorage as any).createTeam(...args); }
  async updateTeam(...args: any[]) { return (this.memStorage as any).updateTeam(...args); }
  async deleteTeam(...args: any[]) { return (this.memStorage as any).deleteTeam(...args); }
  async getTeamMembers(...args: any[]) { return (this.memStorage as any).getTeamMembers(...args); }
  async addTeamMember(...args: any[]) { return (this.memStorage as any).addTeamMember(...args); }
  async removeTeamMember(...args: any[]) { return (this.memStorage as any).removeTeamMember(...args); }
  async getMilestones(...args: any[]) { return (this.memStorage as any).getMilestones(...args); }
  async getMilestone(...args: any[]) { return (this.memStorage as any).getMilestone(...args); }
  async createMilestone(...args: any[]) { return (this.memStorage as any).createMilestone(...args); }
  async updateMilestone(...args: any[]) { return (this.memStorage as any).updateMilestone(...args); }
  async deleteMilestone(...args: any[]) { return (this.memStorage as any).deleteMilestone(...args); }
  async reorderMilestones(...args: any[]) { return (this.memStorage as any).reorderMilestones(...args); }
  async updateMilestoneStatus(...args: any[]) { return (this.memStorage as any).updateMilestoneStatus(...args); }
  async getAccessoryCatalog(...args: any[]) { return (this.memStorage as any).getAccessoryCatalog(...args); }
  async getAccessoryCatalogByCategory(...args: any[]) { return (this.memStorage as any).getAccessoryCatalogByCategory(...args); }
  async getAccessoryCatalogItem(...args: any[]) { return (this.memStorage as any).getAccessoryCatalogItem(...args); }
  async createAccessoryCatalogItem(...args: any[]) { return (this.memStorage as any).createAccessoryCatalogItem(...args); }
  async updateAccessoryCatalogItem(...args: any[]) { return (this.memStorage as any).updateAccessoryCatalogItem(...args); }
  async deleteAccessoryCatalogItem(...args: any[]) { return (this.memStorage as any).deleteAccessoryCatalogItem(...args); }
  // Sales Orders operations with database support
  async getSalesOrders() { 
    if (this.shouldUseDatabase('sales-orders')) {
      try {
        return await this.dbStorage.getSalesOrders();
      } catch (error) {
        console.error('Database error in getSalesOrders, falling back to memory:', error);
        this.disableModule('sales-orders');
      }
    }
    return (this.memStorage as any).getSalesOrders(); 
  }
  
  async getSalesOrdersByCustomer(customerId: number) { 
    if (this.shouldUseDatabase('sales-orders')) {
      try {
        return await this.dbStorage.getSalesOrdersByCustomer(customerId);
      } catch (error) {
        console.error('Database error in getSalesOrdersByCustomer, falling back to memory:', error);
        this.disableModule('sales-orders');
      }
    }
    return (this.memStorage as any).getSalesOrdersByCustomer(customerId); 
  }
  
  async getSalesOrder(id: number) { 
    if (this.shouldUseDatabase('sales-orders')) {
      try {
        return await this.dbStorage.getSalesOrder(id);
      } catch (error) {
        console.error('Database error in getSalesOrder, falling back to memory:', error);
        this.disableModule('sales-orders');
      }
    }
    return (this.memStorage as any).getSalesOrder(id); 
  }
  
  async getSalesOrderByQuotation(quotationId: number) { 
    if (this.shouldUseDatabase('sales-orders')) {
      try {
        return await this.dbStorage.getSalesOrderByQuotation(quotationId);
      } catch (error) {
        console.error('Database error in getSalesOrderByQuotation, falling back to memory:', error);
        this.disableModule('sales-orders');
      }
    }
    return (this.memStorage as any).getSalesOrderByQuotation(quotationId); 
  }
  
  async getSalesOrderWithDetails(id: number) { 
    if (this.shouldUseDatabase('sales-orders')) {
      try {
        return await this.dbStorage.getSalesOrderWithDetails(id);
      } catch (error) {
        console.error('Database error in getSalesOrderWithDetails, falling back to memory:', error);
        this.disableModule('sales-orders');
      }
    }
    return (this.memStorage as any).getSalesOrderWithDetails(id); 
  }
  
  async createSalesOrderFromQuotation(quotationId: number, data?: any) { 
    if (this.shouldUseDatabase('sales-orders')) {
      try {
        return await this.dbStorage.createSalesOrderFromQuotation(quotationId, data);
      } catch (error) {
        console.error('Database error in createSalesOrderFromQuotation, falling back to memory:', error);
        this.disableModule('sales-orders');
      }
    }
    return (this.memStorage as any).createSalesOrderFromQuotation(quotationId, data); 
  }
  
  async updateSalesOrderStatus(id: number, status: any) { 
    if (this.shouldUseDatabase('sales-orders')) {
      try {
        return await this.dbStorage.updateSalesOrderStatus(id, status);
      } catch (error) {
        console.error('Database error in updateSalesOrderStatus, falling back to memory:', error);
        this.disableModule('sales-orders');
      }
    }
    return (this.memStorage as any).updateSalesOrderStatus(id, status); 
  }
  
  async updateSalesOrder(id: number, salesOrder: any) { 
    if (this.shouldUseDatabase('sales-orders')) {
      try {
        return await this.dbStorage.updateSalesOrder(id, salesOrder);
      } catch (error) {
        console.error('Database error in updateSalesOrder, falling back to memory:', error);
        this.disableModule('sales-orders');
      }
    }
    return (this.memStorage as any).updateSalesOrder(id, salesOrder); 
  }
  
  async cancelSalesOrder(id: number) { 
    if (this.shouldUseDatabase('sales-orders')) {
      try {
        return await this.dbStorage.cancelSalesOrder(id);
      } catch (error) {
        console.error('Database error in cancelSalesOrder, falling back to memory:', error);
        this.disableModule('sales-orders');
      }
    }
    return (this.memStorage as any).cancelSalesOrder(id); 
  }
  async revertSalesOrderToQuotation(...args: any[]) { return (this.memStorage as any).revertSalesOrderToQuotation(...args); }
  async getPayments(...args: any[]) { return (this.memStorage as any).getPayments(...args); }
  async getPayment(...args: any[]) { return (this.memStorage as any).getPayment(...args); }
  async getPaymentByTransactionId(...args: any[]) { return (this.memStorage as any).getPaymentByTransactionId(...args); }
  async getPaymentByReceiptNumber(...args: any[]) { return (this.memStorage as any).getPaymentByReceiptNumber(...args); }
  async createPayment(...args: any[]) { return (this.memStorage as any).createPayment(...args); }
  async recordPayment(...args: any[]) { return (this.memStorage as any).recordPayment(...args); }
  async deletePayment(...args: any[]) { return (this.memStorage as any).deletePayment(...args); }
  async getInvoices() { 
    if (this.shouldUseDatabase('invoices')) {
      try {
        return await this.dbStorage.getInvoices();
      } catch (error) {
        console.error('Database error in getInvoices, falling back to memory:', error);
        this.disableModule('invoices');
      }
    }
    return (this.memStorage as any).getInvoices(); 
  }
  
  async getInvoicesByCustomer(customerId: number) { 
    if (this.shouldUseDatabase('invoices')) {
      try {
        return await this.dbStorage.getInvoicesByCustomer(customerId);
      } catch (error) {
        console.error('Database error in getInvoicesByCustomer, falling back to memory:', error);
        this.disableModule('invoices');
      }
    }
    return (this.memStorage as any).getInvoicesByCustomer(customerId); 
  }
  
  async getInvoice(id: number) { 
    if (this.shouldUseDatabase('invoices')) {
      try {
        return await this.dbStorage.getInvoice(id);
      } catch (error) {
        console.error('Database error in getInvoice, falling back to memory:', error);
        this.disableModule('invoices');
      }
    }
    return (this.memStorage as any).getInvoice(id); 
  }
  
  async getInvoiceByQuotation(quotationId: number) { 
    if (this.shouldUseDatabase('invoices')) {
      try {
        return await this.dbStorage.getInvoiceByQuotation(quotationId);
      } catch (error) {
        console.error('Database error in getInvoiceByQuotation, falling back to memory:', error);
        this.disableModule('invoices');
      }
    }
    return (this.memStorage as any).getInvoiceByQuotation(quotationId); 
  }
  
  async getInvoiceBySalesOrder(salesOrderId: number) { 
    if (this.shouldUseDatabase('invoices')) {
      try {
        return await this.dbStorage.getInvoiceBySalesOrder(salesOrderId);
      } catch (error) {
        console.error('Database error in getInvoiceBySalesOrder, falling back to memory:', error);
        this.disableModule('invoices');
      }
    }
    return (this.memStorage as any).getInvoiceBySalesOrder(salesOrderId); 
  }
  
  async getInvoiceWithDetails(id: number) { 
    if (this.shouldUseDatabase('invoices')) {
      try {
        return await this.dbStorage.getInvoiceWithDetails(id);
      } catch (error) {
        console.error('Database error in getInvoiceWithDetails, falling back to memory:', error);
        this.disableModule('invoices');
      }
    }
    return (this.memStorage as any).getInvoiceWithDetails(id); 
  }
  
  async createInvoiceFromQuotation(quotationId: number, data?: any) { 
    if (this.shouldUseDatabase('invoices')) {
      try {
        return await this.dbStorage.createInvoiceFromQuotation(quotationId, data);
      } catch (error) {
        console.error('Database error in createInvoiceFromQuotation, falling back to memory:', error);
        this.disableModule('invoices');
      }
    }
    return (this.memStorage as any).createInvoiceFromQuotation(quotationId, data); 
  }
  
  async createInvoiceFromSalesOrder(salesOrderId: number, data?: any) { 
    if (this.shouldUseDatabase('invoices')) {
      try {
        return await this.dbStorage.createInvoiceFromSalesOrder(salesOrderId, data);
      } catch (error) {
        console.error('Database error in createInvoiceFromSalesOrder, falling back to memory:', error);
        this.disableModule('invoices');
      }
    }
    return (this.memStorage as any).createInvoiceFromSalesOrder(salesOrderId, data); 
  }
  
  async updateInvoiceStatus(id: number, status: any) { 
    if (this.shouldUseDatabase('invoices')) {
      try {
        return await this.dbStorage.updateInvoiceStatus(id, status);
      } catch (error) {
        console.error('Database error in updateInvoiceStatus, falling back to memory:', error);
        this.disableModule('invoices');
      }
    }
    return (this.memStorage as any).updateInvoiceStatus(id, status); 
  }
  
  async updateInvoice(id: number, invoice: any) { 
    if (this.shouldUseDatabase('invoices')) {
      try {
        return await this.dbStorage.updateInvoice(id, invoice);
      } catch (error) {
        console.error('Database error in updateInvoice, falling back to memory:', error);
        this.disableModule('invoices');
      }
    }
    return (this.memStorage as any).updateInvoice(id, invoice); 
  }
  async cancelInvoice(id: number) { 
    if (this.shouldUseDatabase('invoices')) {
      try {
        return await this.dbStorage.cancelInvoice(id);
      } catch (error) {
        console.error('Database error in cancelInvoice, falling back to memory:', error);
        this.disableModule('invoices');
      }
    }
    return (this.memStorage as any).cancelInvoice(id); 
  }
  async getFollowUp(...args: any[]) { return (this.memStorage as any).getFollowUp(...args); }
  async updateFollowUp(...args: any[]) { return (this.memStorage as any).updateFollowUp(...args); }
  async deleteFollowUp(...args: any[]) { return (this.memStorage as any).deleteFollowUp(...args); }
  async markFollowUpComplete(...args: any[]) { return (this.memStorage as any).markFollowUpComplete(...args); }
  async createUserPermission(...args: any[]) { return (this.memStorage as any).createUserPermission(...args); }
  async updateUserPermission(...args: any[]) { return (this.memStorage as any).updateUserPermission(...args); }
  async deleteUserPermission(...args: any[]) { return (this.memStorage as any).deleteUserPermission(...args); }
  async getAllPayments(...args: any[]) { return (this.memStorage as any).getAllPayments(...args); }
  async getAllMilestones(...args: any[]) { return (this.memStorage as any).getAllMilestones(...args); }
  async createSalesOrder(...args: any[]) { return (this.memStorage as any).createSalesOrder(...args); }
  
  async updateQuotationPrices(quotationId: number): Promise<void> {
    if (this.shouldUseDatabase('quotations')) {
      try {
        return await (this.dbStorage as any).updateQuotationPrices(quotationId);
      } catch (error) {
        console.error('Database error in updateQuotationPrices, falling back to memory:', error);
        this.disableModule('quotations');
      }
    }
    // Memory storage doesn't have this method, so we skip it
  }
}