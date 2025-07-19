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
}

// For now, we'll use the existing MemStorage for other operations
// and only implement user management with database
export const dbStorage = new DatabaseStorage();