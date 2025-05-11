import { pgTable, text, serial, integer, doublePrecision, timestamp, json, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Customer stage enum
export const customerStageEnum = pgEnum('customer_stage', [
  'new',
  'pipeline',
  'cold',
  'warm',
  'booked',
  'lost'
]);

// Company Settings schema
export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  logo: text("logo"),
  taxId: text("tax_id"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  updatedAt: true,
});

// App Settings schema
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  defaultGlobalDiscount: doublePrecision("default_global_discount").notNull().default(0),
  defaultGstPercentage: doublePrecision("default_gst_percentage").notNull().default(18),
  defaultTermsAndConditions: text("default_terms_and_conditions"),
  receiptTermsAndConditions: text("receipt_terms_and_conditions"),
  presentationTermsAndConditions: text("presentation_terms_and_conditions"),
  quotationTemplateId: text("quotation_template_id").default("default"),
  presentationTemplateId: text("presentation_template_id").default("default"),
  requiredAccessories: text("required_accessories").default("skirting,handles,sliding mechanism,t profile"),
  leadSourceOptions: text("lead_source_options").default("walk-in,website,referral,social media,other"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

// Customer schema
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  gstNumber: text("gst_number"),
  leadSource: text("lead_source"),
  stage: customerStageEnum("stage").notNull().default('new'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

// Quotation status enum
export const quotationStatusEnum = pgEnum('quotation_status', ['draft', 'saved', 'sent', 'approved', 'rejected', 'expired', 'converted']);

// Quotation schema
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  quotationNumber: text("quotation_number").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  totalSellingPrice: doublePrecision("total_selling_price").notNull(),
  totalDiscountedPrice: doublePrecision("total_discounted_price").notNull(),
  totalInstallationCharges: doublePrecision("total_installation_charges").notNull().default(0),
  installationHandling: doublePrecision("installation_handling").notNull(),
  globalDiscount: doublePrecision("global_discount").notNull().default(0),
  gstPercentage: doublePrecision("gst_percentage").notNull().default(18),
  gstAmount: doublePrecision("gst_amount").notNull(),
  finalPrice: doublePrecision("final_price").notNull(),
  status: quotationStatusEnum("status").notNull().default('draft'),
  title: text("title").default(""),
  description: text("description"),
  validUntil: timestamp("valid_until"),
  terms: text("terms"),
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
  discount: doublePrecision("discount").notNull().default(0),
  discountType: text("discount_type").default("percentage"),
  discountedPrice: doublePrecision("discounted_price").notNull().default(0),
  quantity: integer("quantity").notNull().default(1),
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
  discount: doublePrecision("discount").notNull().default(0),
  discountType: text("discount_type").default("percentage"),
  discountedPrice: doublePrecision("discounted_price").notNull().default(0),
  quantity: integer("quantity").notNull().default(1),
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

// Accessory Catalog schema (for Lecco handles, lights, etc.)
export const accessoryCategoryEnum = pgEnum('accessory_category', [
  'handle',
  'kitchen',
  'light',
  'wardrobe'
]);

export const accessoryCatalog = pgTable("accessory_catalog", {
  id: serial("id").primaryKey(),
  category: accessoryCategoryEnum("category").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  sellingPrice: doublePrecision("selling_price").notNull(),
  kitchenPrice: doublePrecision("kitchen_price"),
  wardrobePrice: doublePrecision("wardrobe_price"),
  size: text("size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAccessoryCatalogSchema = createInsertSchema(accessoryCatalog).omit({
  id: true,
  createdAt: true,
});

// Types for DB operations
export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;

export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;

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

export type AccessoryCatalog = typeof accessoryCatalog.$inferSelect;
export type InsertAccessoryCatalog = z.infer<typeof insertAccessoryCatalogSchema>;

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
export const companySettingsFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Company address is required"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  email: z.string().email("Invalid email address"),
  website: z.string().url("Website must be a valid URL").optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
});

export const appSettingsFormSchema = z.object({
  defaultGlobalDiscount: z.number().min(0, "Default discount must be a positive number"),
  defaultGstPercentage: z.number().min(0, "Default GST percentage must be a positive number"),
  defaultTermsAndConditions: z.string().optional().or(z.literal("")),
  receiptTermsAndConditions: z.string().optional().or(z.literal("")),
  presentationTermsAndConditions: z.string().optional().or(z.literal("")),
  quotationTemplateId: z.string().default("default"),
  presentationTemplateId: z.string().default("default"),
  requiredAccessories: z.string().default("skirting,handles,sliding mechanism,t profile")
    .describe("Comma-separated list of required accessories to check in quotation validation"),
  leadSourceOptions: z.string().default("walk-in,website,referral,social media,other")
    .describe("Comma-separated list of lead sources"),
});

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

// Payment method enum for both sales order payments and direct customer payments
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'bank_transfer',
  'check',
  'card',
  'upi',
  'other'
]);

// Payment type enum for categorizing payment purposes
export const paymentTypeEnum = pgEnum('payment_type', [
  'token_advance',
  'starting_production',
  'final_payment',
  'other'
]);

export const productAccessoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sellingPrice: z.number().min(0, "Selling price must be a positive number"),
  quantity: z.number().min(1, "Quantity must be at least 1").default(1),
});

export const quotationFormSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  title: z.string().optional().default(""),
  description: z.string().optional(),
  installationHandling: z.number().min(0, "Installation & handling must be a positive number"),
  globalDiscount: z.number().min(0, "Global discount must be a positive number"),
  gstPercentage: z.number().min(0, "GST percentage must be a positive number"),
  status: z.enum(['draft', 'sent', 'approved', 'rejected', 'expired', 'converted']).default('draft'),
  validUntil: z.string().or(z.date()).optional().nullable(),
  terms: z.string().optional(),
});

export const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  address: z.string().min(1, "Address is required"),
  gstNumber: z.string().optional(),
  leadSource: z.string().optional(),
  stage: z.enum(['new', 'pipeline', 'cold', 'warm', 'booked', 'lost']).default('new'),
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
  completionNotes: text("completion_notes"),
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

// Project Timeline schema
export const milestoneStatusEnum = pgEnum('milestone_status', ['pending', 'in_progress', 'completed', 'delayed']);

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").notNull().references(() => quotations.id),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: milestoneStatusEnum("status").notNull().default('pending'),
  completedDate: timestamp("completed_date"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
});

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

export const milestoneFormSchema = z.object({
  quotationId: z.number().min(1, "Quotation is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  status: z.enum(['pending', 'in_progress', 'completed', 'delayed']).default('pending'),
});

// Accessory catalog validation schema
export const accessoryCatalogFormSchema = z.object({
  category: z.enum(['handle', 'kitchen', 'light', 'wardrobe']),
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  sellingPrice: z.union([
    z.number().min(0, "Selling price must be a positive number"),
    z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Selling price must be a positive number")
  ]),
  kitchenPrice: z.union([
    z.number().nullable().optional(),
    z.string().refine(val => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Kitchen price must be a positive number").nullable().optional()
  ]),
  wardrobePrice: z.union([
    z.number().nullable().optional(),
    z.string().refine(val => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Wardrobe price must be a positive number").nullable().optional()
  ]),
  size: z.string().optional().nullable(),
});

// Sales Order Management and Payment Tracking

// Order status enum for tracking sales order lifecycle
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'in_production', 'ready_for_delivery', 'delivered', 'completed', 'cancelled']);

// Payment status enum for tracking payment status
export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'partially_paid', 'paid']);

// Sales Orders schema - converted from approved quotations
export const salesOrders = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  quotationId: integer("quotation_id").notNull().references(() => quotations.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  totalAmount: doublePrecision("total_amount").notNull(),
  amountPaid: doublePrecision("amount_paid").notNull().default(0),
  amountDue: doublePrecision("amount_due").notNull(),
  status: orderStatusEnum("status").notNull().default('pending'),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default('unpaid'),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSalesOrderSchema = createInsertSchema(salesOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;

// Payments schema - to track payments against sales orders
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  salesOrderId: integer("sales_order_id").notNull().references(() => salesOrders.id),
  transactionId: text("transaction_id").notNull().unique(),
  amount: doublePrecision("amount").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  notes: text("notes"),
  receiptNumber: text("receipt_number").notNull().unique(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Invoice status enum
export const invoiceStatusEnum = pgEnum('invoice_status', ['pending', 'paid', 'partially_paid', 'overdue', 'cancelled']);

// Invoices schema - converted from approved quotations
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  quotationId: integer("quotation_id").notNull().references(() => quotations.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  totalAmount: doublePrecision("total_amount").notNull(),
  amountPaid: doublePrecision("amount_paid").notNull().default(0),
  amountDue: doublePrecision("amount_due").notNull(),
  status: invoiceStatusEnum("status").notNull().default('pending'),
  dueDate: timestamp("due_date").notNull(),
  invoiceDate: timestamp("invoice_date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export const invoiceFormSchema = z.object({
  quotationId: z.number().min(1, "Quotation is required"),
  dueDate: z.string().or(z.date()),
  notes: z.string().optional().nullable(),
});

// Form validation schemas
export const salesOrderFormSchema = z.object({
  quotationId: z.number().min(1, "Quotation is required"),
  expectedDeliveryDate: z.string().or(z.date()).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const paymentFormSchema = z.object({
  salesOrderId: z.number().min(1, "Sales order is required"),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'card', 'upi', 'other']),
  paymentDate: z.string().or(z.date()),
  notes: z.string().optional().nullable(),
});

// Customer Payments - direct payments from customers without requiring sales orders
export const customerPayments = pgTable("customer_payments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  transactionId: text("transaction_id").notNull().unique(),
  amount: doublePrecision("amount").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentType: paymentTypeEnum("payment_type").notNull().default('other'),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  description: text("description"),
  receiptNumber: text("receipt_number").notNull().unique(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomerPaymentSchema = createInsertSchema(customerPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CustomerPayment = typeof customerPayments.$inferSelect;
export type InsertCustomerPayment = z.infer<typeof insertCustomerPaymentSchema>;

export const customerPaymentFormSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'card', 'upi', 'other']),
  paymentType: z.enum(['token_advance', 'starting_production', 'final_payment', 'other']),
  paymentDate: z.string().or(z.date()),
  transactionId: z.string().min(1, "Transaction ID is required"),
  description: z.string().optional().nullable(),
});
