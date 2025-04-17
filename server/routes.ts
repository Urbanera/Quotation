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
  insertUserSchema,
  insertTeamSchema,
  insertTeamMemberSchema,
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

  // Quotation routes
  app.get("/api/quotations", async (req, res) => {
    try {
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

  const httpServer = createServer(app);
  return httpServer;
}
