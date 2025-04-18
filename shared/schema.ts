import { pgTable, text, serial, integer, doublePrecision, timestamp, json, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Customer schema
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

// Quotation schema
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  totalSellingPrice: doublePrecision("total_selling_price").notNull(),
  totalDiscountedPrice: doublePrecision("total_discounted_price").notNull(),
  installationHandling: doublePrecision("installation_handling").notNull(),
  globalDiscount: doublePrecision("global_discount").notNull().default(0),
  gstPercentage: doublePrecision("gst_percentage").notNull().default(18),
  gstAmount: doublePrecision("gst_amount").notNull(),
  finalPrice: doublePrecision("final_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Room schema
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sellingPrice: doublePrecision("selling_price").notNull().default(0),
  discountedPrice: doublePrecision("discounted_price").notNull().default(0),
  order: integer("order").notNull().default(0),
  // Installation charge calculator fields
  installDescription: text("install_description"),
  widthMm: integer("width_mm"),
  heightMm: integer("height_mm"),
  areaSqft: doublePrecision("area_sqft"),
  pricePerSqft: doublePrecision("price_per_sqft").default(130),
  installAmount: doublePrecision("install_amount").default(0),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
});

// Product schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sellingPrice: doublePrecision("selling_price").notNull(),
  discountedPrice: doublePrecision("discounted_price").notNull().default(0),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

// Accessory schema
export const accessories = pgTable("accessories", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sellingPrice: doublePrecision("selling_price").notNull(),
  discountedPrice: doublePrecision("discounted_price").notNull().default(0),
});

export const insertAccessorySchema = createInsertSchema(accessories).omit({
  id: true,
});

// Image schema
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  filename: text("filename").notNull(),
  path: text("path").notNull(),
  order: integer("order").notNull().default(0),
});

export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
});

// Types for DB operations
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Accessory = typeof accessories.$inferSelect;
export type InsertAccessory = z.infer<typeof insertAccessorySchema>;

export type Image = typeof images.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

// Installation charge schema
export const installationCharges = pgTable("installation_charges", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  cabinetType: text("cabinet_type").notNull(),
  widthMm: integer("width_mm").notNull(),
  heightMm: integer("height_mm").notNull(), 
  areaSqft: doublePrecision("area_sqft").notNull(),
  pricePerSqft: doublePrecision("price_per_sqft").notNull(),
  amount: doublePrecision("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInstallationChargeSchema = createInsertSchema(installationCharges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export interface InstallationCharge {
  id?: number;
  roomId: number;
  cabinetType: string;
  widthMm: number;
  heightMm: number;
  areaSqft: number;
  pricePerSqft: number;
  amount: number;
}

// Define extended types for client-side use
export interface RoomWithItems extends Room {
  products: Product[];
  accessories: Accessory[];
  images: Image[];
  installationCharges?: InstallationCharge[];
}

export interface QuotationWithDetails extends Quotation {
  customer: Customer;
  rooms: RoomWithItems[];
}

// Role and user management schemas
export const roleEnum = pgEnum('role', ['admin', 'manager', 'designer', 'viewer']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: roleEnum("role").notNull().default('designer'),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
});

// Custom schemas for client-side validation
export const roomFormSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  description: z.string().optional(),
});

export const installationFormSchema = z.object({
  cabinetType: z.string().min(1, "Type of cabinets is required"),
  widthMm: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0, 
    { message: "Width must be a positive number" }
  ),
  heightMm: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0, 
    { message: "Height must be a positive number" }
  ),
  pricePerSqft: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0, 
    { message: "Price per sq.ft must be a positive number" }
  ).default("130"),
});

export const productAccessoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sellingPrice: z.number().min(0, "Selling price must be a positive number"),
});

export const quotationFormSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  installationHandling: z.number().min(0, "Installation & handling must be a positive number"),
  globalDiscount: z.number().min(0, "Global discount must be a positive number"),
  gstPercentage: z.number().min(0, "GST percentage must be a positive number"),
});

export const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  address: z.string().min(1, "Address is required"),
});

// User role management validation schemas
export const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(['admin', 'manager', 'designer', 'viewer']),
  active: z.boolean().default(true),
});

export const teamFormSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
});

export const teamMemberFormSchema = z.object({
  teamId: z.number().min(1, "Team is required"),
  userId: z.number().min(1, "User is required"),
});

// Customer Follow-up schema
export const followUps = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  notes: text("notes").notNull(),
  interactionDate: timestamp("interaction_date").defaultNow().notNull(),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  completed: boolean("completed").default(false).notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFollowUpSchema = createInsertSchema(followUps).omit({
  id: true,
  createdAt: true,
});

export type FollowUp = typeof followUps.$inferSelect;
export type InsertFollowUp = z.infer<typeof insertFollowUpSchema>;

export const followUpFormSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  notes: z.string().min(1, "Notes are required"),
  interactionDate: z.string().or(z.date()),
  nextFollowUpDate: z.string().or(z.date()).optional().nullable(),
  completed: z.boolean().default(false),
  userId: z.number().optional().nullable(),
});
