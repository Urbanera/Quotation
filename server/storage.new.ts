import { users, userPermissions, type User, type InsertUser, type UserPermission } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Keep IStorage interface the same, but implement DatabaseStorage
export class DatabaseStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateUser)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.count > 0;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserPermissions(role: string, module: string): Promise<UserPermission | undefined> {
    const [permission] = await db
      .select()
      .from(userPermissions)
      .where(and(
        eq(userPermissions.role, role as any),
        eq(userPermissions.module, module as any)
      ));
    return permission || undefined;
  }

  async getAllUserPermissions(): Promise<UserPermission[]> {
    return await db.select().from(userPermissions);
  }

  async bulkUpdateUserPermissions(permissions: Array<{role: string, module: string, permissions: {canView: boolean, canCreate: boolean, canEdit: boolean, canDelete: boolean}}>): Promise<boolean> {
    try {
      for (const perm of permissions) {
        // Try to update existing permission first
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

        // If no rows were updated, create a new permission
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

  async seedInitialPermissions(): Promise<void> {
    try {
      // Check if permissions already exist
      const existingPermissions = await db.select().from(userPermissions).limit(1);
      if (existingPermissions.length > 0) {
        console.log('Initial permissions already exist, skipping seed');
        return;
      }

      console.log('Seeding initial permissions...');
      
      // Default permissions for different roles and modules
      const defaultPermissions = [
        // Admin permissions - full access to everything
        { role: 'admin', module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'admin', module: 'quotations', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'admin', module: 'sales-orders', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'admin', module: 'invoices', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'admin', module: 'payments', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'admin', module: 'products', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'admin', module: 'accessories', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'admin', module: 'teams', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'admin', module: 'users', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'admin', module: 'settings', canView: true, canCreate: true, canEdit: true, canDelete: true },

        // Manager permissions - access up to payments
        { role: 'manager', module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'manager', module: 'quotations', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'manager', module: 'sales-orders', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'manager', module: 'invoices', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { role: 'manager', module: 'payments', canView: true, canCreate: true, canEdit: true, canDelete: true },

        // Designer permissions - access up to payments
        { role: 'designer', module: 'customers', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { role: 'designer', module: 'quotations', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { role: 'designer', module: 'sales-orders', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { role: 'designer', module: 'invoices', canView: true, canCreate: true, canEdit: true, canDelete: false },
        { role: 'designer', module: 'payments', canView: true, canCreate: true, canEdit: true, canDelete: false },
      ];

      // Insert all default permissions
      for (const permission of defaultPermissions) {
        await db.insert(userPermissions).values({
          role: permission.role as any,
          module: permission.module as any,
          canView: permission.canView,
          canCreate: permission.canCreate,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      console.log('Initial permissions seeded successfully');
    } catch (error) {
      console.error('Error seeding initial permissions:', error);
    }
  }
}

// For now, we'll use the existing MemStorage for other operations
// and only implement user management with database
export const dbStorage = new DatabaseStorage();