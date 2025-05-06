import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

import { storage } from "./storage";
import {
  customerFormSchema,
  quotationFormSchema,
  followUpFormSchema,
  userFormSchema,
  teamFormSchema,
  accessoryCatalogFormSchema,
  milestoneFormSchema,
  customerPaymentFormSchema,
  roomFormSchema as productFormSchema,
  installationFormSchema as installationChargeFormSchema,
  productAccessoryFormSchema as accessoryFormSchema,
  InsertInvoice,
} from "@shared/schema";

// Create search filters schema
const searchFiltersSchema = z.object({});

// Function to validate request body against a schema
function validateRequest(schema: z.ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ errors: error.errors });
    }
  };
}

// Configure multer for image uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: express.Express): Promise<Server> {
  // Set up CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Serve static files from the uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const stage = req.query.stage as string | undefined;
      const customers = stage 
        ? await storage.getCustomersByStage(stage)
        : await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", validateRequest(customerFormSchema), async (req, res) => {
    try {
      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", validateRequest(customerFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.updateCustomer(id, req.body);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.put("/api/customers/:id/stage", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { stage } = req.body;
      
      if (!stage || !["new", "pipeline", "cold", "warm", "booked"].includes(stage)) {
        return res.status(400).json({ message: "Invalid stage value" });
      }
      
      const customer = await storage.updateCustomerStage(id, stage);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer stage" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomer(id);
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });
  
  // Customer ledger - combined sales orders and payments
  app.get("/api/customers/:id/ledger", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get both sales orders and payments for this customer
      const salesOrders = await storage.getSalesOrdersByCustomer(id);
      const payments = await storage.getCustomerPaymentsByCustomer(id);
      
      console.log(`Retrieved ${salesOrders.length} sales orders and ${payments.length} payments`);
      console.log("Sales orders:", salesOrders);
      console.log("Payments:", payments);
      
      // Set proper content type
      res.setHeader('Content-Type', 'application/json');
      
      // Return combined data
      res.send(JSON.stringify({
        salesOrders,
        payments
      }));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer ledger entries" });
    }
  });
  
  // Get follow-ups for a customer
  app.get("/api/customers/:id/follow-ups", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const followUps = await storage.getFollowUps(id);
      res.json(followUps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  });
  
  // Follow-up routes
  app.get("/api/follow-ups/pending", async (req, res) => {
    try {
      const pendingFollowUps = await storage.getPendingFollowUps();
      res.json(pendingFollowUps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending follow-ups" });
    }
  });
  
  app.get("/api/follow-ups", async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      
      if (!customerId) {
        return res.status(400).json({ message: "Customer ID is required" });
      }
      
      const followUps = await storage.getFollowUps(customerId);
      res.json(followUps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  });
  
  app.get("/api/follow-ups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const followUp = await storage.getFollowUp(id);
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      res.json(followUp);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch follow-up" });
    }
  });
  
  app.post("/api/follow-ups", validateRequest(followUpFormSchema), async (req, res) => {
    try {
      const followUp = await storage.createFollowUp(req.body);
      res.status(201).json(followUp);
    } catch (error) {
      res.status(500).json({ message: "Failed to create follow-up" });
    }
  });
  
  app.put("/api/follow-ups/:id", validateRequest(followUpFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const followUp = await storage.updateFollowUp(id, req.body);
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      res.json(followUp);
    } catch (error) {
      res.status(500).json({ message: "Failed to update follow-up" });
    }
  });
  
  app.put("/api/follow-ups/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { updateCustomerStage, newCustomerStage } = req.body || {};
      const followUp = await storage.markFollowUpComplete(id);
      
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      
      // If requested, also update the customer stage
      if (updateCustomerStage && newCustomerStage) {
        const validStages = ["new", "pipeline", "cold", "warm", "booked"];
        if (!validStages.includes(newCustomerStage)) {
          return res.status(400).json({ message: "Invalid customer stage" });
        }
        
        await storage.updateCustomerStage(followUp.customerId, newCustomerStage);
      }
      
      res.json(followUp);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete follow-up" });
    }
  });
  
  app.delete("/api/follow-ups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFollowUp(id);
      if (!success) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete follow-up" });
    }
  });

  // Quotation routes
  app.get("/api/quotations", async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      
      if (customerId) {
        const quotations = await storage.getQuotationsByCustomer(customerId);
        return res.json(quotations);
      }
      
      const quotations = await storage.getQuotations();
      res.json(quotations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  app.get("/api/quotations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.getQuotation(id);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });
  
  app.get("/api/quotations/:id/details", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.getQuotationWithDetails(id);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotation details" });
    }
  });

  app.post("/api/quotations", validateRequest(quotationFormSchema), async (req, res) => {
    try {
      const quotation = await storage.createQuotation(req.body);
      res.status(201).json(quotation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });

  app.put("/api/quotations/:id", validateRequest(quotationFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.updateQuotation(id, req.body);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update quotation" });
    }
  });

  app.delete("/api/quotations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if quotation is approved or already converted
      const quotation = await storage.getQuotation(id);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      // Prevent deletion of approved, converted or any non-draft quotations
      if (quotation.status !== 'draft') {
        return res.status(400).json({ 
          message: `Cannot delete a quotation with status '${quotation.status}'. Only draft quotations can be deleted.` 
        });
      }
      
      const success = await storage.deleteQuotation(id);
      if (!success) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quotation", error: (error as Error).message });
    }
  });

  // Get installation charges summary for a quotation
  app.get("/api/quotations/:id/installation-charges", async (req, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      
      // Get all rooms for this quotation
      const rooms = await storage.getRooms(quotationId);
      const result = [];
      
      // For each room, get the installation charges
      for (const room of rooms) {
        const charges = await storage.getInstallationCharges(room.id);
        const totalCharges = charges.reduce((sum, charge) => sum + charge.amount, 0);
        
        result.push({
          roomId: room.id,
          roomName: room.name,
          charges: charges,
          totalCharges: totalCharges
        });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch installation charges" });
    }
  });
  
  // Room routes
  app.get("/api/quotations/:quotationId/rooms", async (req, res) => {
    try {
      const quotationId = parseInt(req.params.quotationId);
      const rooms = await storage.getRooms(quotationId);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.post("/api/quotations/:quotationId/rooms", async (req, res) => {
    try {
      const quotationId = parseInt(req.params.quotationId);
      const room = await storage.createRoom({
        ...req.body,
        quotationId
      });
      res.status(201).json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.get("/api/rooms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getRoomWithItems(id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.put("/api/rooms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.updateRoom(id, req.body);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to update room" });
    }
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRoom(id);
      if (!success) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete room" });
    }
  });

  app.post("/api/quotations/:quotationId/rooms/reorder", async (req, res) => {
    try {
      const { roomIds } = req.body;
      if (!Array.isArray(roomIds)) {
        return res.status(400).json({ message: "Room IDs must be an array" });
      }
      
      const success = await storage.reorderRooms(roomIds);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder rooms" });
    }
  });

  // Product routes
  app.get("/api/rooms/:roomId/products", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const products = await storage.getProducts(roomId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/rooms/:roomId/products", validateRequest(productFormSchema), async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const product = await storage.createProduct({
        ...req.body,
        roomId
      });
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.put("/api/products/:id", validateRequest(productFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.updateProduct(id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Accessory routes
  app.get("/api/rooms/:roomId/accessories", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const accessories = await storage.getAccessories(roomId);
      res.json(accessories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accessories" });
    }
  });

  app.post("/api/rooms/:roomId/accessories", validateRequest(accessoryFormSchema), async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const accessory = await storage.createAccessory({
        ...req.body,
        roomId
      });
      res.status(201).json(accessory);
    } catch (error) {
      res.status(500).json({ message: "Failed to create accessory" });
    }
  });

  app.get("/api/accessories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessory = await storage.getAccessory(id);
      if (!accessory) {
        return res.status(404).json({ message: "Accessory not found" });
      }
      res.json(accessory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accessory" });
    }
  });

  app.put("/api/accessories/:id", validateRequest(accessoryFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessory = await storage.updateAccessory(id, req.body);
      if (!accessory) {
        return res.status(404).json({ message: "Accessory not found" });
      }
      res.json(accessory);
    } catch (error) {
      res.status(500).json({ message: "Failed to update accessory" });
    }
  });

  app.delete("/api/accessories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccessory(id);
      if (!success) {
        return res.status(404).json({ message: "Accessory not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete accessory" });
    }
  });

  // Installation Charge routes
  app.get("/api/rooms/:roomId/installation-charges", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const charges = await storage.getInstallationCharges(roomId);
      res.json(charges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch installation charges" });
    }
  });

  app.post("/api/rooms/:roomId/installation-charges", validateRequest(installationChargeFormSchema), async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const charge = await storage.createInstallationCharge({
        ...req.body,
        roomId
      });
      res.status(201).json(charge);
    } catch (error) {
      res.status(500).json({ message: "Failed to create installation charge" });
    }
  });

  app.get("/api/installation-charges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const charge = await storage.getInstallationCharge(id);
      if (!charge) {
        return res.status(404).json({ message: "Installation charge not found" });
      }
      res.json(charge);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch installation charge" });
    }
  });

  app.put("/api/installation-charges/:id", validateRequest(installationChargeFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const charge = await storage.updateInstallationCharge(id, req.body);
      if (!charge) {
        return res.status(404).json({ message: "Installation charge not found" });
      }
      res.json(charge);
    } catch (error) {
      res.status(500).json({ message: "Failed to update installation charge" });
    }
  });

  app.delete("/api/installation-charges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInstallationCharge(id);
      if (!success) {
        return res.status(404).json({ message: "Installation charge not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete installation charge" });
    }
  });

  // Get all installation charges for a quotation
  app.get("/api/quotations/:quotationId/installation-charges", async (req, res) => {
    try {
      const quotationId = parseInt(req.params.quotationId);
      
      // First, get all rooms for this quotation
      const rooms = await storage.getRooms(quotationId);
      
      // For each room, get its installation charges
      const roomsWithCharges = await Promise.all(
        rooms.map(async (room) => {
          const charges = await storage.getInstallationCharges(room.id);
          return {
            roomId: room.id,
            charges
          };
        })
      );
      
      res.json(roomsWithCharges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch installation charges" });
    }
  });

  // Image routes
  app.get("/api/rooms/:roomId/images", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const images = await storage.getImages(roomId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  app.post("/api/rooms/:roomId/images", upload.single('image'), async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      const image = await storage.createImage({
        roomId,
        url: `/uploads/${req.file.filename}`,
        description: req.body.description || "",
        order: parseInt(req.body.order) || 0
      });
      
      res.status(201).json(image);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  app.get("/api/images/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const image = await storage.getImage(id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch image" });
    }
  });

  app.delete("/api/images/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the image first to find file path
      const image = await storage.getImage(id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Delete from storage
      const success = await storage.deleteImage(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete image from database" });
      }
      
      // Try to delete the file if it's a local file
      if (image.url.startsWith('/uploads/')) {
        const filename = image.url.replace('/uploads/', '');
        const filePath = path.join(uploadDir, filename);
        
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.error("Failed to delete image file:", fileError);
          // We still return success even if the file deletion fails
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  app.post("/api/rooms/:roomId/images/reorder", async (req, res) => {
    try {
      const { imageIds } = req.body;
      if (!Array.isArray(imageIds)) {
        return res.status(400).json({ message: "Image IDs must be an array" });
      }
      
      const success = await storage.reorderImages(imageIds);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder images" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", validateRequest(userFormSchema), async (req, res) => {
    try {
      // Check if the username is already taken
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", validateRequest(userFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if the username is already taken by another user
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser && existingUser.id !== id) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.updateUser(id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Team routes
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeamWithMembers(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post("/api/teams", validateRequest(teamFormSchema), async (req, res) => {
    try {
      const team = await storage.createTeam(req.body);
      res.status(201).json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to create team" });
    }
  });

  app.put("/api/teams/:id", validateRequest(teamFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.updateTeam(id, req.body);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to update team" });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTeam(id);
      if (!success) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Team member routes
  app.get("/api/teams/:teamId/members", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post("/api/teams/:teamId/members", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const member = await storage.addTeamMember({
        teamId,
        userId: parseInt(userId),
      });
      
      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to add team member" });
    }
  });

  app.delete("/api/teams/:teamId/members/:userId", async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      
      const success = await storage.removeTeamMember(teamId, userId);
      if (!success) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove team member" });
    }
  });

  // Project Timeline/Milestone routes
  app.get("/api/quotations/:quotationId/milestones", async (req, res) => {
    try {
      const quotationId = parseInt(req.params.quotationId);
      const milestones = await storage.getMilestones(quotationId);
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  app.get("/api/milestones/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const milestone = await storage.getMilestone(id);
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch milestone" });
    }
  });

  app.post("/api/quotations/:quotationId/milestones", validateRequest(milestoneFormSchema), async (req, res) => {
    try {
      const quotationId = parseInt(req.params.quotationId);
      const milestoneData = {
        ...req.body,
        quotationId,
      };
      
      const milestone = await storage.createMilestone(milestoneData);
      res.status(201).json(milestone);
    } catch (error) {
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });

  app.put("/api/milestones/:id", validateRequest(milestoneFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const milestone = await storage.updateMilestone(id, req.body);
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });

  app.put("/api/milestones/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, completedDate } = req.body;
      
      // Validate status
      const validStatuses = ["pending", "in_progress", "completed", "delayed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status. Must be one of: pending, in_progress, completed, delayed" 
        });
      }
      
      // Parse completedDate if provided
      let parsedCompletedDate: Date | undefined = undefined;
      if (completedDate) {
        parsedCompletedDate = new Date(completedDate);
      }
      
      const milestone = await storage.updateMilestoneStatus(id, status, parsedCompletedDate);
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      res.json(milestone);
    } catch (error) {
      res.status(500).json({ message: "Failed to update milestone status" });
    }
  });

  app.delete("/api/milestones/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMilestone(id);
      if (!success) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete milestone" });
    }
  });

  app.post("/api/quotations/:quotationId/milestones/reorder", async (req, res) => {
    try {
      const { milestoneIds } = req.body;
      if (!Array.isArray(milestoneIds)) {
        return res.status(400).json({ message: "Milestone IDs must be an array" });
      }
      
      const success = await storage.reorderMilestones(milestoneIds);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder milestones" });
    }
  });

  // Accessory Catalog routes
  app.get("/api/accessory-catalog", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      
      const accessories = category 
        ? await storage.getAccessoryCatalogByCategory(category)
        : await storage.getAccessoryCatalog();
      
      res.json(accessories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accessory catalog" });
    }
  });

  app.get("/api/accessory-catalog/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessory = await storage.getAccessoryCatalogItem(id);
      if (!accessory) {
        return res.status(404).json({ message: "Accessory catalog item not found" });
      }
      res.json(accessory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accessory catalog item" });
    }
  });

  app.post("/api/accessory-catalog", validateRequest(accessoryCatalogFormSchema), async (req, res) => {
    try {
      const accessory = await storage.createAccessoryCatalogItem(req.body);
      res.status(201).json(accessory);
    } catch (error) {
      res.status(500).json({ message: "Failed to create accessory catalog item" });
    }
  });

  app.post("/api/accessory-catalog/bulk-import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }
      
      // Read the CSV file
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const lines = fileContent.split('\n');
      
      // Skip header row
      const dataRows = lines.slice(1);
      
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const row of dataRows) {
        try {
          if (!row.trim()) continue; // Skip empty rows
          
          const columns = row.split(',');
          if (columns.length < 5) {
            results.failed++;
            results.errors.push(`Invalid row format: ${row}`);
            continue;
          }
          
          const [category, code, name, mrpStr, priceStr, descriptionStr = ""] = columns;
          const mrp = parseFloat(mrpStr);
          const price = parseFloat(priceStr);
          
          if (isNaN(mrp) || isNaN(price)) {
            results.failed++;
            results.errors.push(`Invalid price values in row: ${row}`);
            continue;
          }
          
          await storage.createAccessoryCatalogItem({
            category,
            code,
            name,
            mrp,
            price,
            description: descriptionStr
          });
          
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Error processing row: ${row}. ${error.message}`);
        }
      }
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(201).json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to import accessory catalog items", error: error.message });
    }
  });

  app.put("/api/accessory-catalog/:id", validateRequest(accessoryCatalogFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessory = await storage.updateAccessoryCatalogItem(id, req.body);
      if (!accessory) {
        return res.status(404).json({ message: "Accessory catalog item not found" });
      }
      res.json(accessory);
    } catch (error) {
      res.status(500).json({ message: "Failed to update accessory catalog item" });
    }
  });

  app.delete("/api/accessory-catalog/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccessoryCatalogItem(id);
      if (!success) {
        return res.status(404).json({ message: "Accessory catalog item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete accessory catalog item" });
    }
  });

  // Application settings routes
  app.get("/api/settings/app", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch application settings" });
    }
  });

  app.put("/api/settings/app", async (req, res) => {
    try {
      const settings = await storage.updateAppSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application settings" });
    }
  });

  // Company settings routes
  app.get("/api/settings/company", async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  app.put("/api/settings/company", async (req, res) => {
    try {
      const settings = await storage.updateCompanySettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update company settings" });
    }
  });

  // Logo upload route
  app.post("/api/settings/company/logo", upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No logo file provided" });
      }
      
      const logoUrl = `/uploads/${req.file.filename}`;
      const settings = await storage.updateCompanyLogo(logoUrl);
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload company logo" });
    }
  });

  // Sales Order routes
  app.get("/api/sales-orders", async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      
      if (customerId) {
        const salesOrders = await storage.getSalesOrdersByCustomer(customerId);
        return res.json(salesOrders);
      }
      
      const salesOrders = await storage.getSalesOrders();
      res.json(salesOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales orders" });
    }
  });

  app.get("/api/sales-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Fetching sales order with ID: ${id}`);
      
      const salesOrder = await storage.getSalesOrderWithDetails(id);
      console.log(`Sales order fetch result:`, JSON.stringify(salesOrder, null, 2));
      
      if (!salesOrder) {
        console.log(`Sales order with ID ${id} not found`);
        return res.status(404).json({ message: "Sales order not found" });
      }
      
      console.log(`Returning sales order data with customer:`, salesOrder.customer);
      res.json(salesOrder);
    } catch (error) {
      console.error(`Error fetching sales order:`, error);
      res.status(500).json({ message: "Failed to fetch sales order" });
    }
  });

  app.put("/api/sales-orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "confirmed", "in_production", "ready_for_delivery", "delivered", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const salesOrder = await storage.updateSalesOrderStatus(id, status);
      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      
      res.json(salesOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sales order status" });
    }
  });

  app.put("/api/sales-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const salesOrder = await storage.updateSalesOrder(id, req.body);
      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      res.json(salesOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sales order" });
    }
  });

  app.delete("/api/sales-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const salesOrder = await storage.cancelSalesOrder(id);
      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      res.json(salesOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel sales order" });
    }
  });

  // Payment routes
  app.get("/api/sales-orders/:salesOrderId/payments", async (req, res) => {
    try {
      const salesOrderId = parseInt(req.params.salesOrderId);
      const payments = await storage.getPayments(salesOrderId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getPayment(id);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  app.post("/api/sales-orders/:salesOrderId/payments", async (req, res) => {
    try {
      const salesOrderId = parseInt(req.params.salesOrderId);
      const { amount, paymentMethod, notes, paymentDate } = req.body;
      
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      const parsedDate = paymentDate ? new Date(paymentDate) : new Date();
      
      const payment = await storage.recordPayment(
        salesOrderId,
        parsedAmount,
        paymentMethod,
        notes,
        parsedDate
      );
      
      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  app.delete("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePayment(id);
      if (!success) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });

  // Customer Payment routes (direct payments without sales orders)
  app.get("/api/customer-payments", async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      
      if (customerId) {
        const payments = await storage.getCustomerPaymentsByCustomer(customerId);
        return res.json(payments);
      }
      
      const payments = await storage.getCustomerPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer payments" });
    }
  });

  app.get("/api/customer-payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getCustomerPayment(id);
      if (!payment) {
        return res.status(404).json({ message: "Customer payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer payment" });
    }
  });

  app.post("/api/customer-payments", validateRequest(customerPaymentFormSchema), async (req, res) => {
    try {
      const payment = await storage.createCustomerPayment({
        ...req.body,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : new Date(),
      });
      res.status(201).json(payment);
    } catch (error) {
      console.error("Failed to create customer payment:", error);
      res.status(500).json({ message: "Failed to create customer payment", error: error.message });
    }
  });

  app.put("/api/customer-payments/:id", validateRequest(customerPaymentFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.updateCustomerPayment(id, {
        ...req.body,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : undefined,
      });
      if (!payment) {
        return res.status(404).json({ message: "Customer payment not found" });
      }
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer payment" });
    }
  });

  app.delete("/api/customer-payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomerPayment(id);
      if (!success) {
        return res.status(404).json({ message: "Customer payment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer payment" });
    }
  });

  // Update quotation status route
  app.put("/api/quotations/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["draft", "sent", "approved", "rejected", "expired", "converted"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      // Check if quotation is already converted - don't allow status changes for converted quotations
      const existingQuotation = await storage.getQuotation(id);
      if (!existingQuotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (existingQuotation.status === "converted") {
        return res.status(400).json({ 
          message: "Cannot update status of a quotation that has already been converted to a sales order or invoice" 
        });
      }
      
      const quotation = await storage.updateQuotationStatus(id, status);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update quotation status" });
    }
  });

  // Convert quotation to sales order
  app.post("/api/quotations/:id/convert-to-order", async (req, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      
      // Check if quotation is already converted
      const quotation = await storage.getQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.status === "converted") {
        // Check if it's been converted to an invoice
        const existingInvoice = await storage.getInvoiceByQuotation(quotationId);
        if (existingInvoice) {
          return res.status(400).json({ 
            message: "Quotation has already been converted to an invoice",
            invoiceId: existingInvoice.id
          });
        }
        
        // Check if it's been converted to a sales order
        const salesOrders = await storage.getSalesOrders();
        const existingSalesOrder = salesOrders.find(so => so.quotationId === quotationId);
        if (existingSalesOrder) {
          return res.status(400).json({ 
            message: "Quotation has already been converted to a sales order",
            salesOrderId: existingSalesOrder.id
          });
        }
        
        return res.status(400).json({ message: "Quotation has already been converted" });
      }
      
      // Check if quotation is approved
      if (quotation.status !== "approved") {
        await storage.updateQuotationStatus(quotationId, "approved");
      }
      
      const salesOrder = await storage.createSalesOrderFromQuotation(quotationId, req.body);
      console.log("Created new sales order:", salesOrder);
      res.status(201).json(salesOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to convert quotation to sales order", error: error.message });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      
      if (customerId) {
        const invoices = await storage.getInvoicesByCustomer(customerId);
        return res.json(invoices);
      }
      
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });
  
  app.get("/api/invoices/:id/details", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoiceWithDetails(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice details" });
    }
  });

  // Convert quotation to invoice
  app.post("/api/quotations/:id/convert-to-invoice", async (req, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      
      // Check if quotation exists
      const quotation = await storage.getQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      // Check if quotation is already converted to an invoice
      const existingInvoice = await storage.getInvoiceByQuotation(quotationId);
      if (existingInvoice) {
        return res.status(400).json({ 
          message: "Quotation is already converted to an invoice", 
          invoiceId: existingInvoice.id 
        });
      }
      
      // Check if quotation has been converted to a sales order
      if (quotation.status === "converted") {
        const salesOrders = await storage.getSalesOrders();
        const existingSalesOrder = salesOrders.find(so => so.quotationId === quotationId);
        if (existingSalesOrder) {
          return res.status(400).json({ 
            message: "Quotation has already been converted to a sales order",
            salesOrderId: existingSalesOrder.id 
          });
        }
      }
      
      // Check if quotation is approved
      if (quotation.status !== "approved") {
        return res.status(400).json({ message: "Quotation must be approved before converting to invoice" });
      }
      
      const invoice = await storage.createInvoiceFromQuotation(quotationId, req.body);
      console.log("Created new invoice:", invoice);
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to convert quotation to invoice", error: error.message });
    }
  });
  
  // Update invoice status
  app.patch("/api/invoices/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "paid", "partially_paid", "overdue", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const invoice = await storage.updateInvoiceStatus(id, status);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to update invoice status" });
    }
  });

  // Update invoice
  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.updateInvoice(id, req.body);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });
  
  // Cancel invoice
  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.cancelInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel invoice" });
    }
  });
  
  // Convert Sales Order to Invoice
  app.post("/api/sales-orders/:id/convert-to-invoice", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const salesOrder = await storage.getSalesOrder(id);
      
      if (!salesOrder) {
        return res.status(404).json({ message: "Sales Order not found" });
      }
      
      // Check if the quotation is already converted to an invoice
      const existingInvoice = await storage.getInvoiceByQuotation(salesOrder.quotationId);
      if (existingInvoice) {
        return res.status(400).json({ 
          message: "This sales order's quotation is already converted to an invoice", 
          invoiceId: existingInvoice.id 
        });
      }
      
      // Convert to invoice
      const formData = req.body as Partial<InsertInvoice>;
      const invoice = await storage.createInvoiceFromSalesOrder(id, formData);
      
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to convert sales order to invoice", 
        error: (error as Error).message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}