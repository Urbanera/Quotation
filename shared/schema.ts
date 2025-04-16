import { pgTable, text, serial, integer, doublePrecision, timestamp, json, boolean } from "drizzle-orm/pg-core";
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
  gstPercentage: z.number().min(0, "GST percentage must be a positive number"),
});

export const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  address: z.string().min(1, "Address is required"),
});
