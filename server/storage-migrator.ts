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
    
    // Start with these safe modules enabled
    this.enableModule('settings');
    this.enableModule('users'); 
    this.enableModule('permissions');
    this.enableModule('customers');
    this.enableModule('followups');
    this.enableModule('customer-payments');
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

  // For all other methods, delegate to MemStorage (unchanged behavior)
  async getQuotations() { return this.memStorage.getQuotations(); }
  async getQuotation(id: number) { return this.memStorage.getQuotation(id); }
  async getQuotationWithDetails(id: number) { 
    try {
      return await this.memStorage.getQuotationWithDetails(id);
    } catch (error) {
      console.error('Error getting quotation details:', error);
      return undefined;
    }
  }
  async getQuotationsByCustomer(customerId: number) { return this.memStorage.getQuotationsByCustomer(customerId); }
  async createQuotation(quotation: any) { return this.memStorage.createQuotation(quotation); }
  async updateQuotation(id: number, quotation: any) { return this.memStorage.updateQuotation(id, quotation); }
  async deleteQuotation(id: number) { return this.memStorage.deleteQuotation(id); }
  async duplicateQuotation(id: number, customerId?: number) { return this.memStorage.duplicateQuotation(id, customerId); }
  async updateQuotationStatus(id: number, status: any) { return this.memStorage.updateQuotationStatus(id, status); }

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
  async getRooms(...args: any[]) { return (this.memStorage as any).getRooms(...args); }
  async getRoom(...args: any[]) { return (this.memStorage as any).getRoom(...args); }
  async getRoomWithItems(...args: any[]) { return (this.memStorage as any).getRoomWithItems(...args); }
  async createRoom(...args: any[]) { return (this.memStorage as any).createRoom(...args); }
  async updateRoom(...args: any[]) { return (this.memStorage as any).updateRoom(...args); }
  async deleteRoom(...args: any[]) { return (this.memStorage as any).deleteRoom(...args); }
  async reorderRooms(...args: any[]) { return (this.memStorage as any).reorderRooms(...args); }
  async updateRoomTeowinEstimate(...args: any[]) { return (this.memStorage as any).updateRoomTeowinEstimate(...args); }
  async getProducts(...args: any[]) { return (this.memStorage as any).getProducts(...args); }
  async getProduct(...args: any[]) { return (this.memStorage as any).getProduct(...args); }
  async createProduct(...args: any[]) { return (this.memStorage as any).createProduct(...args); }
  async updateProduct(...args: any[]) { return (this.memStorage as any).updateProduct(...args); }
  async deleteProduct(...args: any[]) { return (this.memStorage as any).deleteProduct(...args); }
  async getAccessories(...args: any[]) { return (this.memStorage as any).getAccessories(...args); }
  async getAccessory(...args: any[]) { return (this.memStorage as any).getAccessory(...args); }
  async createAccessory(...args: any[]) { return (this.memStorage as any).createAccessory(...args); }
  async updateAccessory(...args: any[]) { return (this.memStorage as any).updateAccessory(...args); }
  async deleteAccessory(...args: any[]) { return (this.memStorage as any).deleteAccessory(...args); }
  async getImages(...args: any[]) { return (this.memStorage as any).getImages(...args); }
  async getImage(...args: any[]) { return (this.memStorage as any).getImage(...args); }
  async createImage(...args: any[]) { return (this.memStorage as any).createImage(...args); }
  async deleteImage(...args: any[]) { return (this.memStorage as any).deleteImage(...args); }
  async updateImage(...args: any[]) { return (this.memStorage as any).updateImage(...args); }
  async reorderImages(...args: any[]) { return (this.memStorage as any).reorderImages(...args); }
  async getInstallationCharges(...args: any[]) { return (this.memStorage as any).getInstallationCharges(...args); }
  async getInstallationCharge(...args: any[]) { return (this.memStorage as any).getInstallationCharge(...args); }
  async createInstallationCharge(...args: any[]) { return (this.memStorage as any).createInstallationCharge(...args); }
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
  async getSalesOrders(...args: any[]) { return (this.memStorage as any).getSalesOrders(...args); }
  async getSalesOrdersByCustomer(...args: any[]) { return (this.memStorage as any).getSalesOrdersByCustomer(...args); }
  async getSalesOrder(...args: any[]) { return (this.memStorage as any).getSalesOrder(...args); }
  async getSalesOrderByQuotation(...args: any[]) { return (this.memStorage as any).getSalesOrderByQuotation(...args); }
  async getSalesOrderWithDetails(...args: any[]) { return (this.memStorage as any).getSalesOrderWithDetails(...args); }
  async createSalesOrderFromQuotation(...args: any[]) { return (this.memStorage as any).createSalesOrderFromQuotation(...args); }
  async updateSalesOrderStatus(...args: any[]) { return (this.memStorage as any).updateSalesOrderStatus(...args); }
  async updateSalesOrder(...args: any[]) { return (this.memStorage as any).updateSalesOrder(...args); }
  async cancelSalesOrder(...args: any[]) { return (this.memStorage as any).cancelSalesOrder(...args); }
  async revertSalesOrderToQuotation(...args: any[]) { return (this.memStorage as any).revertSalesOrderToQuotation(...args); }
  async getPayments(...args: any[]) { return (this.memStorage as any).getPayments(...args); }
  async getPayment(...args: any[]) { return (this.memStorage as any).getPayment(...args); }
  async getPaymentByTransactionId(...args: any[]) { return (this.memStorage as any).getPaymentByTransactionId(...args); }
  async getPaymentByReceiptNumber(...args: any[]) { return (this.memStorage as any).getPaymentByReceiptNumber(...args); }
  async createPayment(...args: any[]) { return (this.memStorage as any).createPayment(...args); }
  async recordPayment(...args: any[]) { return (this.memStorage as any).recordPayment(...args); }
  async deletePayment(...args: any[]) { return (this.memStorage as any).deletePayment(...args); }
  async getInvoices(...args: any[]) { return (this.memStorage as any).getInvoices(...args); }
  async getInvoicesByCustomer(...args: any[]) { return (this.memStorage as any).getInvoicesByCustomer(...args); }
  async getInvoice(...args: any[]) { return (this.memStorage as any).getInvoice(...args); }
  async getInvoiceByQuotation(...args: any[]) { return (this.memStorage as any).getInvoiceByQuotation(...args); }
  async getInvoiceBySalesOrder(...args: any[]) { return (this.memStorage as any).getInvoiceBySalesOrder(...args); }
  async getInvoiceWithDetails(...args: any[]) { return (this.memStorage as any).getInvoiceWithDetails(...args); }
  async createInvoiceFromQuotation(...args: any[]) { return (this.memStorage as any).createInvoiceFromQuotation(...args); }
  async createInvoiceFromSalesOrder(...args: any[]) { return (this.memStorage as any).createInvoiceFromSalesOrder(...args); }
  async updateInvoiceStatus(...args: any[]) { return (this.memStorage as any).updateInvoiceStatus(...args); }
  async updateInvoice(...args: any[]) { return (this.memStorage as any).updateInvoice(...args); }
  async cancelInvoice(...args: any[]) { return (this.memStorage as any).cancelInvoice(...args); }
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
}