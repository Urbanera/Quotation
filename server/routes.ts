import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  insertCustomerSchema,
  insertQuotationSchema,
  insertRoomSchema,
  insertProductSchema,
  insertAccessorySchema,
  insertImageSchema,
  roomFormSchema,
  productAccessoryFormSchema,
  quotationFormSchema,
  customerFormSchema,
  userFormSchema,
  teamFormSchema,
  teamMemberFormSchema,
  followUpFormSchema,
  insertUserSchema,
  insertTeamSchema,
  insertTeamMemberSchema,
  milestoneFormSchema,
  insertMilestoneSchema,
  companySettingsFormSchema,
  appSettingsFormSchema,
  insertCompanySettingsSchema,
  insertAppSettingsSchema,
  accessoryCatalogFormSchema,
  insertAccessoryCatalogSchema,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Set up multer storage for image uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage2 });

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to handle validation errors
  const validateRequest = (schema: z.ZodSchema<any>) => {
    return (req: Request, res: Response, next: Function) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({ message: fromZodError(error).toString() });
        } else {
          res.status(400).json({ message: "Invalid request data" });
        }
      }
    };
  };

  // Serve uploaded files
  app.use("/uploads", express.static(uploadsDir));

  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
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
      // Check if a customer with the same phone number already exists
      const customers = await storage.getCustomers();
      const existingCustomer = customers.find(c => c.phone === req.body.phone);
      
      if (existingCustomer) {
        return res.status(400).json({ 
          message: `Phone number already exists with customer "${existingCustomer.name}"`
        });
      }
      
      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", validateRequest(customerFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerId = id;
      
      // Check if a different customer already has this phone number
      const customers = await storage.getCustomers();
      const existingCustomer = customers.find(c => c.phone === req.body.phone && c.id !== customerId);
      
      if (existingCustomer) {
        return res.status(400).json({ 
          message: `Phone number already exists with customer "${existingCustomer.name}"`
        });
      }
      
      const customer = await storage.updateCustomer(id, req.body);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
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

  // Get quotations for a customer
  app.get("/api/customers/:id/quotations", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quotations = await storage.getQuotationsByCustomer(id);
      res.json(quotations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotations" });
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
      const followUp = await storage.markFollowUpComplete(id);
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      res.json(followUp);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark follow-up as complete" });
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
      const quotation = await storage.getQuotationWithDetails(id);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });

  app.post("/api/quotations", validateRequest(quotationFormSchema), async (req, res) => {
    try {
      // Set initial values for a new quotation
      const quotationData = {
        ...req.body,
        totalSellingPrice: 0,
        totalDiscountedPrice: 0,
        gstAmount: 0,
        finalPrice: 0,
      };
      
      const quotation = await storage.createQuotation(quotationData);
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
      const success = await storage.deleteQuotation(id);
      if (!success) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quotation" });
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

  app.put("/api/rooms/:id/installation", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const installationData = req.body;
      
      // Ensure we're getting valid data
      if (!id || isNaN(id)) {
        return res.status(400).json({ message: "Invalid room ID" });
      }
      
      // Check if the room exists first
      const existingRoom = await storage.getRoom(id);
      if (!existingRoom) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      // Ensure content type is set to JSON
      res.setHeader('Content-Type', 'application/json');
      
      const room = await storage.updateRoom(id, {
        installDescription: installationData.installDescription,
        widthMm: installationData.widthMm,
        heightMm: installationData.heightMm,
        areaSqft: installationData.areaSqft,
        pricePerSqft: installationData.pricePerSqft,
        installAmount: installationData.installAmount
      });
      
      return res.status(200).json(room);
    } catch (error) {
      console.error("Installation update error:", error);
      return res.status(500).json({ message: "Failed to update installation charges" });
    }
  });

  app.post("/api/quotations/:quotationId/rooms", validateRequest(roomFormSchema), async (req, res) => {
    try {
      const quotationId = parseInt(req.params.quotationId);
      const roomData = {
        ...req.body,
        quotationId,
        sellingPrice: 0,
        discountedPrice: 0,
      };
      
      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.put("/api/rooms/:id", validateRequest(roomFormSchema), async (req, res) => {
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
        return res.status(400).json({ message: "Invalid room IDs" });
      }
      
      const success = await storage.reorderRooms(roomIds);
      if (!success) {
        return res.status(400).json({ message: "Failed to reorder rooms" });
      }
      
      res.json({ success: true });
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

  app.post("/api/rooms/:roomId/products", validateRequest(productAccessoryFormSchema), async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const productData = {
        ...req.body,
        roomId,
      };
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", validateRequest(productAccessoryFormSchema), async (req, res) => {
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

  app.post("/api/rooms/:roomId/accessories", validateRequest(productAccessoryFormSchema), async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const accessoryData = {
        ...req.body,
        roomId,
      };
      
      const accessory = await storage.createAccessory(accessoryData);
      res.status(201).json(accessory);
    } catch (error) {
      res.status(500).json({ message: "Failed to create accessory" });
    }
  });

  app.put("/api/accessories/:id", validateRequest(productAccessoryFormSchema), async (req, res) => {
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

  app.post("/api/rooms/:roomId/images", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image provided" });
      }
      
      const roomId = parseInt(req.params.roomId);
      const imageData = {
        roomId,
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        order: 0, // Will be set automatically in the storage method
      };
      
      const image = await storage.createImage(imageData);
      res.status(201).json(image);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  app.delete("/api/images/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const image = await storage.getImage(id);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      const success = await storage.deleteImage(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete image record" });
      }
      
      // Delete the file
      const filePath = path.join(process.cwd(), image.path.replace(/^\/uploads/, "uploads"));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
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
        return res.status(400).json({ message: "Invalid image IDs" });
      }
      
      const success = await storage.reorderImages(imageIds);
      if (!success) {
        return res.status(400).json({ message: "Failed to reorder images" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder images" });
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
  
  app.post("/api/installation-charges", async (req, res) => {
    try {
      const charge = req.body;
      
      if (!charge.roomId || !charge.cabinetType || !charge.widthMm || 
          !charge.heightMm || !charge.areaSqft || !charge.pricePerSqft || !charge.amount) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const newCharge = await storage.createInstallationCharge(charge);
      res.status(201).json(newCharge);
    } catch (error) {
      res.status(500).json({ message: "Failed to create installation charge" });
    }
  });
  
  app.put("/api/installation-charges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const charge = req.body;
      
      const updatedCharge = await storage.updateInstallationCharge(id, charge);
      if (!updatedCharge) {
        return res.status(404).json({ message: "Installation charge not found" });
      }
      
      res.json(updatedCharge);
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
  
  // Get all installation charges for all rooms in a quotation
  app.get("/api/quotations/:quotationId/installation-charges", async (req, res) => {
    try {
      const quotationId = parseInt(req.params.quotationId);
      
      // Get all rooms for the quotation
      const rooms = await storage.getRooms(quotationId);
      
      // For each room, get the installation charges
      const result = await Promise.all(rooms.map(async (room) => {
        const charges = await storage.getInstallationCharges(room.id);
        return {
          roomId: room.id,
          charges
        };
      }));
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch installation charges" });
    }
  });

  // Accessory Catalog routes
  app.get("/api/accessory-catalog", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      
      if (category) {
        const items = await storage.getAccessoryCatalogByCategory(category);
        return res.json(items);
      }
      
      const items = await storage.getAccessoryCatalog();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accessory catalog items" });
    }
  });

  app.get("/api/accessory-catalog/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      // Validate category
      if (!["handle", "kitchen", "light", "wardrobe"].includes(category)) {
        return res.status(400).json({ message: "Invalid category. Must be one of: handle, kitchen, light, wardrobe" });
      }
      
      const items = await storage.getAccessoryCatalogByCategory(category as "handle" | "kitchen" | "light" | "wardrobe");
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accessory catalog items by category" });
    }
  });
  
  // CSV export route for accessory catalog
  app.get("/api/accessory-catalog/export", async (req, res) => {
    try {
      const items = await storage.getAccessoryCatalog();
      
      // Create CSV header
      let csv = "code,name,category,description,sellingPrice,kitchenPrice,wardrobePrice,size,image\n";
      
      // Add each item as a row
      items.forEach(item => {
        const row = [
          item.code,
          `"${item.name.replace(/"/g, '""')}"`, // Escape double quotes in fields
          item.category,
          item.description ? `"${item.description.replace(/"/g, '""')}"` : '',
          item.sellingPrice,
          item.kitchenPrice || '',
          item.wardrobePrice || '',
          item.size || '',
          item.image || ''
        ].join(',');
        
        csv += row + "\n";
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=accessory-catalog.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Failed to export accessory catalog" });
    }
  });
  
  // CSV import route for accessory catalog
  const csvUpload = multer({ 
    dest: path.join(process.cwd(), "uploads", "temp"), 
    limits: { fileSize: 10 * 1024 * 1024 } 
  });
  
  app.post("/api/accessory-catalog/import", csvUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Read the uploaded CSV file
      const csvData = fs.readFileSync(req.file.path, 'utf8');
      const lines = csvData.split('\n');
      
      // Skip header row, process each line
      const header = lines[0].toLowerCase();
      if (!header.includes('code') || !header.includes('name') || !header.includes('category')) {
        return res.status(400).json({ 
          message: "Invalid CSV format. The file must include code, name, and category columns." 
        });
      }
      
      const results = {
        totalRows: lines.length - 1, // Exclude header
        successCount: 0,
        errorCount: 0,
        errors: []
      };
      
      // Process each line (skipping header)
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const columns = lines[i].split(',');
        const row = header.split(',').reduce((obj, header, index) => {
          let value = columns[index] || '';
          
          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1).replace(/""/g, '"');
          }
          
          obj[header.trim()] = value.trim();
          return obj;
        }, {});
        
        try {
          // Validate required fields
          if (!row.code || !row.name || !row.category) {
            throw new Error(`Row ${i}: Missing required fields (code, name, or category)`);
          }
          
          // Validate category
          if (!['handle', 'kitchen', 'light', 'wardrobe'].includes(row.category)) {
            throw new Error(`Row ${i}: Invalid category. Must be one of: handle, kitchen, light, wardrobe`);
          }
          
          // Prepare item for insertion
          const accessoryItem = {
            code: row.code,
            name: row.name,
            category: row.category as "handle" | "kitchen" | "light" | "wardrobe",
            description: row.description || null,
            sellingPrice: parseFloat(row.sellingprice) || 0,
            kitchenPrice: row.kitchenprice ? parseFloat(row.kitchenprice) : null,
            wardrobePrice: row.wardrobeprice ? parseFloat(row.wardrobeprice) : null,
            size: row.size || null,
            image: row.image || null
          };
          
          // Validate with schema
          accessoryCatalogFormSchema.parse(accessoryItem);
          
          // Check for existing item with same code
          const existingItems = await storage.getAccessoryCatalog();
          const existingItem = existingItems.find(item => item.code === accessoryItem.code);
          
          if (existingItem) {
            // Update existing item
            await storage.updateAccessoryCatalogItem(existingItem.id, accessoryItem);
          } else {
            // Create new item
            await storage.createAccessoryCatalogItem(accessoryItem);
          }
          
          results.successCount++;
        } catch (error) {
          results.errorCount++;
          if (error instanceof Error) {
            results.errors.push(error.message);
          } else {
            results.errors.push(`Row ${i}: Unknown error`);
          }
        }
      }
      
      // Clean up temporary file
      fs.unlinkSync(req.file.path);
      
      res.status(200).json(results);
    } catch (error) {
      // Clean up temporary file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        message: "Failed to import accessory catalog",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.get("/api/accessory-catalog/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getAccessoryCatalogItem(id);
      if (!item) {
        return res.status(404).json({ message: "Accessory catalog item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accessory catalog item" });
    }
  });

  app.post("/api/accessory-catalog", validateRequest(accessoryCatalogFormSchema), async (req, res) => {
    try {
      const item = await storage.createAccessoryCatalogItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create accessory catalog item" });
    }
  });

  app.put("/api/accessory-catalog/:id", validateRequest(accessoryCatalogFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateAccessoryCatalogItem(id, req.body);
      if (!item) {
        return res.status(404).json({ message: "Accessory catalog item not found" });
      }
      res.json(item);
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

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Don't return password field in the response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
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
      // Don't return password field in the response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  app.post("/api/users", validateRequest(userFormSchema), async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(req.body);
      // Don't return password field in the response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  app.put("/api/users/:id", validateRequest(userFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if username is being changed and if it's already taken
      if (req.body.username) {
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      const user = await storage.updateUser(id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password field in the response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });
  
  app.get("/api/teams/:id/members", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeamWithMembers(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      // Don't return password field in the response
      const membersWithoutPasswords = team.members.map(({ password, ...member }) => member);
      res.json({ ...team, members: membersWithoutPasswords });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members" });
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
  
  // Team Member routes
  app.post("/api/teams/:teamId/members", validateRequest(teamMemberFormSchema), async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = req.body.userId;
      
      // Check if the team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is already in the team
      const teamMembers = await storage.getTeamMembers(teamId);
      if (teamMembers.some(member => member.id === userId)) {
        return res.status(400).json({ message: "User is already a member of this team" });
      }
      
      const teamMember = await storage.addTeamMember({
        teamId,
        userId,
      });
      
      res.status(201).json(teamMember);
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
        return res.status(400).json({ message: "Invalid milestone IDs" });
      }
      
      const success = await storage.reorderMilestones(milestoneIds);
      if (!success) {
        return res.status(400).json({ message: "Failed to reorder milestones" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder milestones" });
    }
  });

  // Company Settings routes
  app.get("/api/settings/company", async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  app.put("/api/settings/company", validateRequest(companySettingsFormSchema), async (req, res) => {
    try {
      const settings = await storage.updateCompanySettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update company settings" });
    }
  });

  // Handle company logo upload
  app.post("/api/settings/company/logo", upload.single("logo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const logoPath = `/uploads/${req.file.filename}`;
      const settings = await storage.updateCompanySettings({ logo: logoPath });
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  // App Settings routes
  app.get("/api/settings/app", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch app settings" });
    }
  });

  app.put("/api/settings/app", validateRequest(appSettingsFormSchema), async (req, res) => {
    try {
      const settings = await storage.updateAppSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update app settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
