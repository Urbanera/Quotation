import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

import { storage } from "./storage";
import { dbStorage } from "./storage.new";
import { emailService } from "./email";
import { whatsappService } from "./whatsapp";
import { whatsappRouter } from './whatsapp-routes';
import { AuthService, authenticateToken, requireRole, requirePermission, AuthRequest } from "./auth";
import {
  customerFormSchema,
  quotationFormSchema,
  followUpFormSchema,
  userFormSchema,
  userUpdateSchema,
  teamFormSchema,
  accessoryCatalogFormSchema,
  milestoneFormSchema,
  customerPaymentFormSchema,
  roomFormSchema as productFormSchema,
  installationFormSchema as installationChargeFormSchema,
  productAccessoryFormSchema as accessoryFormSchema,
  InsertInvoice,
  imageTypeEnum,
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
    const uniqueSuffix = Date.now() + '-' + Math.floor(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// For image uploads
const imageUpload = multer({ 
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

// For CSV uploads
const csvUpload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV files, JSON files (for backup restore), or Excel files that might be misidentified
    if (
      file.mimetype === 'text/csv' || 
      file.mimetype === 'application/json' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/octet-stream' ||
      file.originalname.endsWith('.csv') ||
      file.originalname.endsWith('.json')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and JSON files are allowed'));
    }
  }
});

// For floor plan uploads (images and PDFs)
const floorPlanUpload = multer({
  storage: storage_config,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept image and PDF files
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed for floor plans'));
    }
  }
});

// For Teowin estimate uploads (images and PDFs)
const teowinEstimateUpload = multer({
  storage: storage_config,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept image and PDF files
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed for Teowin estimates'));
    }
  }
});

export async function registerRoutes(app: express.Express): Promise<Server> {
  // Initialize database with default permissions
  await dbStorage.seedInitialPermissions();
  
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

  // Auth routes (public)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const result = await AuthService.login(username, password);
      
      if (!result) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }
      
      const result = await AuthService.refreshToken(refreshToken);
      
      if (!result) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });



  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await dbStorage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
      // In a JWT-based system, logout is typically handled client-side
      // by removing the token from storage
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Email routes
  app.get("/api/email/status", async (req, res) => {
    try {
      const isConfigured = await emailService.isConfigured();
      res.json({ configured: isConfigured });
    } catch (error) {
      console.error("Error checking email configuration status:", error);
      res.status(500).json({ configured: false, error: "Error checking email configuration" });
    }
  });
  
  // Set up multer for PDF uploads
  const pdfStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      // Use original filename with timestamp to avoid collisions
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const pdfUpload = multer({ 
    storage: pdfStorage,
    fileFilter: function (req, file, callback) {
      // Only accept PDF files
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== '.pdf') {
        return callback(new Error('Only PDF files are allowed'));
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });
  
  // Email quotation endpoint
  app.post("/api/quotations/:id/email", async (req, res) => {
    try {
      const { id } = req.params;
      const { emailTo, pdfBase64 } = req.body;
      
      if (!emailTo) {
        return res.status(400).json({ message: "Email recipient is required" });
      }
      
      // Get quotation details
      const quotation = await storage.getQuotationWithDetails(parseInt(id));
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      // First check if email service is configured
      const isConfigured = await emailService.isConfigured();
      
      if (!isConfigured) {
        return res.status(400).json({ 
          message: "Email service is not configured. Please configure email settings first." 
        });
      }

      // Extract PDF from base64 or generate one if not provided
      let pdfBuffer;
      if (pdfBase64) {
        try {
          // Remove the data:application/pdf;base64, part if it exists
          const base64Data = pdfBase64.split(',').length > 1 ? pdfBase64.split(',')[1] : pdfBase64;
          pdfBuffer = Buffer.from(base64Data, 'base64');
          
          // Quick validation to ensure it's a valid PDF
          if (pdfBuffer.length < 100) {
            console.warn("PDF buffer seems too small, may not be a valid PDF");
          }
        } catch (e) {
          console.error("Error processing PDF data:", e);
          return res.status(400).json({ message: "Invalid PDF data provided" });
        }
      } else {
        // No PDF provided, we should generate one
        console.log("No PDF data provided, using server-side generation functionality");
        // Create a temporary PDF file based on the quotation data
        // This is a placeholder until server-side PDF generation is implemented
        pdfBuffer = Buffer.from("PDF placeholder content");
      }

      // Use the emailService to send the quotation with attachment
      const result = await emailService.sendQuotationEmail(parseInt(id), pdfBuffer, emailTo);
      
      if (result) {
        res.status(200).json({ success: true, message: "Email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send email. Please check your email settings and try again." });
      }
    } catch (error: any) {
      console.error("Error sending quotation email:", error);
      // Provide more user-friendly error message
      let errorMessage = "Failed to send email";
      
      // Check for common error patterns
      if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
        errorMessage = "Connection to email server failed. Please verify your SMTP settings.";
      } else if (error.code === 'EAUTH') {
        errorMessage = "Email authentication failed. Please check your username and password.";
      } else if (error.message && error.message.includes('SSL')) {
        errorMessage = "SSL/TLS negotiation failed. Try changing the security settings in your email configuration.";
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Email invoice endpoint
  app.post("/api/invoices/:id/email", async (req, res) => {
    try {
      const { id } = req.params;
      const { emailTo } = req.body;
      
      if (!emailTo) {
        return res.status(400).json({ message: "Email recipient is required" });
      }
      
      // Get invoice details
      const invoice = await storage.getInvoice(parseInt(id));
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get customer details
      const customer = await storage.getCustomer(invoice.customerId);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // First check if email service is configured
      const isConfigured = await emailService.isConfigured();
      
      if (!isConfigured) {
        return res.status(400).json({ 
          message: "Email service is not configured. Please configure email settings first." 
        });
      }
      
      // Get company settings
      const companySettings = await storage.getCompanySettings();
      
      // Create a simple invoice email with details
      const subject = `Invoice ${invoice.invoiceNumber} from ${companySettings?.name || 'Our Company'}`;
      
      const emailResult = await emailService.sendEmail({
        to: emailTo,
        subject,
        html: `
          <h2>Invoice ${invoice.invoiceNumber}</h2>
          <p>Dear ${customer.name},</p>
          <p>Please find attached the invoice for your order. Details are provided below:</p>
          <p>Invoice Number: ${invoice.invoiceNumber}</p>
          <p>Date: ${new Date(invoice.createdAt).toLocaleDateString()}</p>
          <p>Amount: ₹${invoice.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
          <p>Best regards,<br>${companySettings?.name || 'Our Company'}</p>
        `,
        // Skip attachments for now since we need to generate PDFs server-side
      });
      
      if (emailResult) {
        res.status(200).json({ success: true, message: "Email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send email. Please check your email settings and try again." });
      }
    } catch (error: any) {
      console.error("Error sending invoice email:", error);
      // Provide more user-friendly error message
      let errorMessage = "Failed to send email";
      
      // Check for common error patterns
      if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
        errorMessage = "Connection to email server failed. Please verify your SMTP settings.";
      } else if (error.code === 'EAUTH') {
        errorMessage = "Email authentication failed. Please check your username and password.";
      } else if (error.message && error.message.includes('SSL')) {
        errorMessage = "SSL/TLS negotiation failed. Try changing the security settings in your email configuration.";
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });
  
  // Email payment receipt endpoint
  app.post("/api/payments/:id/email", async (req, res) => {
    try {
      const { id } = req.params;
      const { emailTo, pdfBase64 } = req.body;
      
      if (!emailTo) {
        return res.status(400).json({ message: "Email recipient is required" });
      }
      
      // Get payment details
      const payment = await storage.getCustomerPayment(parseInt(id));
      
      if (!payment) {
        return res.status(404).json({ message: "Payment receipt not found" });
      }
      
      // Get customer details
      const customer = await storage.getCustomer(payment.customerId);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // First check if email service is configured
      const isConfigured = await emailService.isConfigured();
      
      if (!isConfigured) {
        return res.status(400).json({ 
          message: "Email service is not configured. Please configure email settings first." 
        });
      }
      
      // Extract PDF from base64 or generate one if not provided
      let pdfBuffer;
      if (pdfBase64) {
        // Remove the data:application/pdf;base64, part if it exists
        const base64Data = pdfBase64.split(',').length > 1 ? pdfBase64.split(',')[1] : pdfBase64;
        pdfBuffer = Buffer.from(base64Data, 'base64');
      } else {
        // No PDF provided, we should generate one
        console.log("No PDF data provided for payment receipt, using server-side generation if available");
        // Create a temporary PDF file based on the payment data
        // This is a placeholder until server-side PDF generation is implemented
        pdfBuffer = Buffer.from("PDF placeholder content");
      }
      
      // Get company settings
      const companySettings = await storage.getCompanySettings();
      
      // Define payment methods for display
      const paymentMethods: Record<string, string> = {
        'cash': 'Cash',
        'check': 'Check',
        'card': 'Credit/Debit Card',
        'netbanking': 'Net Banking',
        'upi': 'UPI',
        'wallet': 'Digital Wallet',
        'other': 'Other'
      };
      
      // Format amount in Indian currency format
      const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      });
      
      // Use the PDF buffer to send the receipt email with attachment
      const result = await emailService.sendPaymentReceiptEmail(parseInt(id), pdfBuffer, emailTo);
      
      if (result) {
        res.status(200).json({ success: true, message: "Email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send email. Please check your email settings and try again." });
      }
    } catch (error: any) {
      console.error("Error sending payment receipt email:", error);
      // Provide more user-friendly error message
      let errorMessage = "Failed to send email";
      
      // Check for common error patterns
      if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
        errorMessage = "Connection to email server failed. Please verify your SMTP settings.";
      } else if (error.code === 'EAUTH') {
        errorMessage = "Email authentication failed. Please check your username and password.";
      } else if (error.message && error.message.includes('SSL')) {
        errorMessage = "SSL/TLS negotiation failed. Try changing the security settings in your email configuration.";
      }
      
      res.status(500).json({ message: errorMessage });
    }
  });

  app.post("/api/email/test-connection", async (req, res) => {
    try {
      // First check if the service is properly configured
      const isInitialized = await emailService.initialize();
      
      if (!isInitialized) {
        return res.json({ 
          success: false, 
          message: "Email settings are incomplete. Please configure SMTP settings and enable email functionality."
        });
      }
      
      // We don't actually send a test email here to avoid unnecessary emails
      // Just check if the connection can be established
      const transporter = emailService["transporter"];
      
      if (!transporter) {
        return res.json({ 
          success: false, 
          message: "Email transporter could not be initialized."
        });
      }
      
      try {
        // Verify SMTP connection configuration
        await transporter.verify();
        return res.json({ success: true, message: "SMTP connection successful!" });
      } catch (smtpError: any) {
        // Provide more user-friendly error message
        let errorMessage = "SMTP connection failed";
        
        // Check for common error patterns
        if (smtpError.code === 'ESOCKET' || smtpError.code === 'ECONNECTION') {
          errorMessage = "Connection to email server failed. Please verify your SMTP host and port.";
        } else if (smtpError.code === 'EAUTH') {
          errorMessage = "Authentication failed. Please check your username and password.";
        } else if (smtpError.message && smtpError.message.includes('SSL')) {
          errorMessage = "SSL/TLS negotiation failed. Try changing the security settings.";
        } else if (smtpError.message) {
          errorMessage = `${errorMessage}: ${smtpError.message}`;
        }
        
        return res.json({ 
          success: false, 
          message: errorMessage
        });
      }
    } catch (error: any) {
      console.error("Error testing email connection:", error);
      
      // Provide more user-friendly error message
      let errorMessage = "Failed to test email connection";
      
      // Check for specific patterns
      if (error.code === 'ENOENT') {
        errorMessage = "Email settings could not be loaded. Please check if the settings exist.";
      } else if (error.message) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      
      res.status(500).json({ 
        success: false, 
        message: errorMessage
      });
    }
  });

  // Floor plan upload endpoint
  app.post("/api/customers/:id/floor-plan", floorPlanUpload.single('floorPlan'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Get file information
      const floorPlanUrl = `/uploads/${req.file.filename}`;
      const floorPlanType = req.file.mimetype;
      const floorPlanName = req.file.originalname;
      
      // Update customer with floor plan information
      const updatedCustomer = await storage.updateCustomerFloorPlan(id, floorPlanUrl, floorPlanType, floorPlanName);
      
      if (!updatedCustomer) {
        return res.status(500).json({ message: "Failed to update customer with floor plan" });
      }
      
      res.status(200).json(updatedCustomer);
    } catch (error) {
      console.error("Error uploading floor plan:", error);
      res.status(500).json({ 
        message: "Failed to upload floor plan",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Customer routes
  app.get("/api/customers", authenticateToken, requirePermission('customers', 'view'), async (req, res) => {
    try {
      const stage = req.query.stage as string | undefined;
      const followUpFilter = req.query.followUpFilter as string | undefined;
      
      let customers = [];
      
      if (stage) {
        customers = await storage.getCustomersByStage(stage);
      } else {
        customers = await storage.getCustomers();
      }
      
      // If followUpFilter is specified, filter customers based on their follow-ups
      if (followUpFilter) {
        // Get all follow-ups
        const allFollowUps = await storage.getAllFollowUps();
        
        // Create a map to store customer IDs that match the filter
        const matchingCustomerIds = new Set<number>();
        
        // Filter the follow-ups based on the filter criteria
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1); // Yesterday
        
        allFollowUps.forEach(followUp => {
          if (!followUp.completed && followUp.nextFollowUpDate) {
            const followUpDate = new Date(followUp.nextFollowUpDate);
            followUpDate.setHours(0, 0, 0, 0);
            
            if (followUpFilter === 'today' && followUpDate.getTime() === today.getTime()) {
              matchingCustomerIds.add(followUp.customerId);
            } else if (followUpFilter === 'yesterday' && followUpDate.getTime() === yesterday.getTime()) {
              matchingCustomerIds.add(followUp.customerId);
            } else if (followUpFilter === 'missed' && followUpDate < today) {
              matchingCustomerIds.add(followUp.customerId);
            } else if (followUpFilter === 'future' && followUpDate > today) {
              matchingCustomerIds.add(followUp.customerId);
            }
          }
        });
        
        // Filter the customers based on the matching IDs
        customers = customers.filter(customer => matchingCustomerIds.has(customer.id));
      }
      
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", authenticateToken, requirePermission('customers', 'view'), async (req, res) => {
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

  app.get("/api/customers/:id/balance", authenticateToken, requirePermission('customers', 'view'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const balance = await storage.getCustomerBalance(id);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer balance" });
    }
  });

  app.post("/api/customers", authenticateToken, requirePermission('customers', 'create'), validateRequest(customerFormSchema), async (req, res) => {
    try {
      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error: any) {
      // Check if it's a duplicate email/phone error (look for specific error message text)
      if (error.message && (error.message.includes("is already associated with customer"))) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", authenticateToken, requirePermission('customers', 'edit'), validateRequest(customerFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.updateCustomer(id, req.body);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      // Check if it's a duplicate email/phone error (look for specific error message text)
      if (error.message && (error.message.includes("is already associated with customer"))) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.put("/api/customers/:id/stage", authenticateToken, requirePermission('customers', 'edit'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { stage } = req.body;
      
      if (!stage || !["new", "pipeline", "cold", "warm", "booked", "lost"].includes(stage)) {
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

  app.delete("/api/customers/:id", authenticateToken, requirePermission('customers', 'delete'), async (req, res) => {
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
  
  // Export customers to CSV
  // New debug endpoint for exporting customers as JSON
  app.get('/api/customers/export-debug', async (req, res) => {
    try {
      console.log('DEBUG: Fetching customers');
      const customers = await storage.getCustomers();
      console.log('DEBUG: Got customers:', customers?.length || 0);
      
      // Add explicit check to make sure we're getting valid customer data
      if (!customers || customers.length === 0) {
        console.log('DEBUG: No customers found');
        return res.status(200).json({
          success: true,
          customerCount: 0,
          message: 'No customers found'
        });
      }
      
      const followUps = await storage.getAllFollowUps();
      console.log('DEBUG: Got follow-ups:', followUps?.length || 0);
      
      // Create a detailed response for debugging
      return res.status(200).json({
        success: true,
        customerCount: customers.length,
        followUpCount: followUps?.length || 0,
        customers: customers,
        sampleFollowUps: followUps?.slice(0, 3) || []
      });
    } catch (error) {
      console.error('DEBUG Error exporting customers:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error exporting customers: ' + (error instanceof Error ? error.message : String(error)) 
      });
    }
  });

  // Original export endpoint for CSV
  app.get('/api/customers/export', async (req, res) => {
    try {
      console.log('Exporting customers - starting export process');
      const customers = await storage.getCustomers();
      
      console.log('Export found customers:', customers?.length || 0, customers);
      
      // IMPORTANT: Even if there are no customers, return an empty CSV file
      // Don't return a 404 error which prevents the file download
      if (!customers) {
        console.log('Customers array is null or undefined');
        return res.status(500).json({ message: 'Error retrieving customer data' });
      }
      
      console.log('Got customers:', customers.length);
      const followUps = await storage.getAllFollowUps();
      console.log('Got follow-ups:', followUps.length);
      
      // Create a map of customer ID to their follow-ups for easy lookup
      const customerFollowUps = new Map();
      followUps.forEach(followUp => {
        if (!customerFollowUps.has(followUp.customerId)) {
          customerFollowUps.set(followUp.customerId, []);
        }
        customerFollowUps.get(followUp.customerId).push(followUp);
      });
      
      console.log('Processed follow-ups map. Processing customers...');
      
      // Process each customer and add their latest follow-up info
      const processedCustomers = customers.map(customer => {
        const customerFollowUpsList = customerFollowUps.get(customer.id) || [];
        
        // Sort follow-ups by date desc and get the latest one
        const sortedFollowUps = [...customerFollowUpsList].sort((a, b) => 
          new Date(b.interactionDate).getTime() - new Date(a.interactionDate).getTime()
        );
        
        const latestFollowUp = sortedFollowUps[0] || null;
        const lastFollowUpDate = latestFollowUp?.interactionDate || '';
        const nextFollowUpDate = latestFollowUp?.completed ? 
          (latestFollowUp.nextFollowUpDate || '') : latestFollowUp?.interactionDate || '';
        
        return {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: '', // customer schema doesn't have city field
          currentStage: customer.stage,
          leadSource: customer.leadSource || '',
          notes: '', // customer schema doesn't have notes field
          lastFollowUpDate,
          nextFollowUpDate
        };
      });
      
      console.log('Customers processed:', processedCustomers.length);
      
      // Set the CSV headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
      
      // Create CSV header line
      const headers = [
        'Name', 'Email', 'Phone', 'Address', 'City', 'Current Stage', 
        'Lead Source', 'Notes', 'Last Follow-up Date', 'Next Follow-up Date'
      ].join(',') + '\n';
      
      // Write the headers
      res.write(headers);
      
      // Write each customer row
      processedCustomers.forEach(customer => {
        const row = [
          `"${(customer.name || '').replace(/"/g, '""')}"`,
          `"${(customer.email || '').replace(/"/g, '""')}"`,
          `"${(customer.phone || '').replace(/"/g, '""')}"`,
          `"${(customer.address || '').replace(/"/g, '""')}"`,
          `"${(customer.city || '').replace(/"/g, '""')}"`,
          `"${(customer.currentStage || '').replace(/"/g, '""')}"`,
          `"${(customer.leadSource || '').replace(/"/g, '""')}"`,
          `"${(customer.notes || '').replace(/"/g, '""')}"`,
          `"${customer.lastFollowUpDate ? new Date(customer.lastFollowUpDate).toISOString().split('T')[0] : ''}"`,
          `"${customer.nextFollowUpDate ? new Date(customer.nextFollowUpDate).toISOString().split('T')[0] : ''}"`
        ].join(',') + '\n';
        
        res.write(row);
      });
      
      console.log('Finished writing CSV data');
      res.end();
    } catch (error) {
      console.error('Error exporting customers:', error);
      res.status(500).json({ message: 'Error exporting customers: ' + (error instanceof Error ? error.message : String(error)) });
    }
  });
  
  // Import customers from CSV
  app.post('/api/customers/import', csvUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const lines = fileContent.split('\n');
      
      // Parse header line to get column indices
      const headers = lines[0].split(',').map(header => header.trim());
      
      const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name');
      const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');
      const phoneIndex = headers.findIndex(h => h.toLowerCase() === 'phone');
      const addressIndex = headers.findIndex(h => h.toLowerCase() === 'address');
      const cityIndex = headers.findIndex(h => h.toLowerCase() === 'city');
      const stageIndex = headers.findIndex(h => h.toLowerCase() === 'current stage');
      const leadSourceIndex = headers.findIndex(h => h.toLowerCase() === 'lead source');
      const notesIndex = headers.findIndex(h => h.toLowerCase() === 'notes');
      const nextFollowUpDateIndex = headers.findIndex(h => h.toLowerCase() === 'next follow-up date');
      
      if (nameIndex === -1 || emailIndex === -1 || phoneIndex === -1) {
        return res.status(400).json({ message: 'CSV file must contain at least Name, Email, and Phone columns' });
      }
      
      const importResults = {
        total: 0,
        created: 0,
        skipped: 0,
        errors: [] as string[]
      };
      
      // Process each line (skip header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        importResults.total++;
        
        try {
          // Parse the CSV line, handling quoted values with commas
          const values = [];
          let inQuotes = false;
          let currentValue = '';
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
              if (inQuotes && j < line.length - 1 && line[j + 1] === '"') {
                // Handle escaped quotes (double quotes)
                currentValue += '"';
                j++; // Skip the next quote
              } else {
                // Toggle quote state
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              // End of field
              values.push(currentValue);
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          
          // Add the last value
          values.push(currentValue);
          
          // Extract customer data
          const customerData = {
            name: nameIndex >= 0 ? values[nameIndex].trim() : '',
            email: emailIndex >= 0 ? values[emailIndex].trim() : '',
            phone: phoneIndex >= 0 ? values[phoneIndex].trim() : '',
            address: addressIndex >= 0 ? values[addressIndex].trim() : '',
            city: cityIndex >= 0 ? values[cityIndex].trim() : '',
            stage: (stageIndex >= 0 ? values[stageIndex].trim().toLowerCase() : 'new') as "new" | "pipeline" | "cold" | "warm" | "booked" | "lost",
            leadSource: leadSourceIndex >= 0 ? values[leadSourceIndex].trim() : '',
            notes: notesIndex >= 0 ? values[notesIndex].trim() : ''
          };
          
          // Validate required fields
          if (!customerData.name || !customerData.email || !customerData.phone) {
            importResults.errors.push(`Row ${i}: Missing required fields (name, email, or phone)`);
            importResults.skipped++;
            continue;
          }
          
          // Check if customer with this email or phone already exists
          const existingCustomer = await storage.getCustomerByEmailOrPhone(customerData.email, customerData.phone);
          
          if (existingCustomer) {
            importResults.errors.push(`Row ${i}: Customer with email ${customerData.email} or phone ${customerData.phone} already exists`);
            importResults.skipped++;
            continue;
          }
          
          // Create the customer
          const newCustomer = await storage.createCustomer(customerData);
          
          // Create a follow-up if next follow-up date is provided
          if (nextFollowUpDateIndex >= 0 && values[nextFollowUpDateIndex].trim()) {
            const nextFollowUpDate = values[nextFollowUpDateIndex].trim();
            
            try {
              const date = new Date(nextFollowUpDate);
              
              if (!isNaN(date.getTime())) {
                await storage.createFollowUp({
                  customerId: newCustomer.id,
                  notes: 'Follow-up from import',
                  scheduledDate: date.toISOString(),
                  createdBy: 'System',
                  completed: false
                });
              }
            } catch (error) {
              importResults.errors.push(`Row ${i}: Invalid follow-up date format`);
            }
          }
          
          importResults.created++;
        } catch (error) {
          importResults.errors.push(`Row ${i}: ${error.message}`);
          importResults.skipped++;
        }
      }
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(200).json({
        message: `Import completed: ${importResults.created} customers created, ${importResults.skipped} skipped`,
        results: importResults
      });
      
    } catch (error) {
      // Clean up the uploaded file if it exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ message: 'Error importing customers: ' + error.message });
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
      
      // Enhance follow-ups with user information
      const enhancedFollowUps = await Promise.all(
        followUps.map(async (followUp) => {
          if (followUp.userId) {
            try {
              const user = await storage.getUser(followUp.userId);
              return {
                ...followUp,
                userName: user ? user.fullName : "Unknown User",
                userUsername: user ? user.username : "unknown"
              };
            } catch (err) {
              console.error(`Failed to get user info for ID ${followUp.userId}:`, err);
              return {
                ...followUp,
                userName: "Unknown User",
                userUsername: "unknown"
              };
            }
          } else {
            return {
              ...followUp,
              userName: "System",
              userUsername: "system"
            };
          }
        })
      );
      
      res.json(enhancedFollowUps);
    } catch (error) {
      console.error("Failed to fetch follow-ups:", error);
      res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  });
  
  // Follow-up routes
  app.get("/api/follow-ups/all", async (req, res) => {
    try {
      const allFollowUps = await storage.getAllFollowUps() || [];
      
      // Enhance follow-ups with user information
      const enhancedFollowUps = await Promise.all(
        allFollowUps.map(async (followUp) => {
          if (followUp.userId) {
            try {
              const user = await storage.getUser(followUp.userId);
              return {
                ...followUp,
                userName: user ? user.fullName : "Unknown User",
                userUsername: user ? user.username : "unknown"
              };
            } catch (err) {
              console.error(`Failed to get user info for ID ${followUp.userId}:`, err);
              return {
                ...followUp,
                userName: "Unknown User",
                userUsername: "unknown"
              };
            }
          } else {
            return {
              ...followUp,
              userName: "System",
              userUsername: "system"
            };
          }
        })
      );
      
      res.json(enhancedFollowUps);
    } catch (error) {
      console.error("Failed to fetch all follow-ups:", error);
      res.status(500).json({ message: "Failed to fetch all follow-ups" });
    }
  });

  app.get("/api/follow-ups/pending", async (req, res) => {
    try {
      const pendingFollowUps = await storage.getPendingFollowUps();
      
      // Enhance follow-ups with user information
      const enhancedFollowUps = await Promise.all(
        pendingFollowUps.map(async (followUp) => {
          if (followUp.userId) {
            try {
              const user = await storage.getUser(followUp.userId);
              return {
                ...followUp,
                userName: user ? user.fullName : "Unknown User",
                userUsername: user ? user.username : "unknown"
              };
            } catch (err) {
              console.error(`Failed to get user info for ID ${followUp.userId}:`, err);
              return {
                ...followUp,
                userName: "Unknown User",
                userUsername: "unknown"
              };
            }
          } else {
            return {
              ...followUp,
              userName: "System",
              userUsername: "system"
            };
          }
        })
      );
      
      res.json(enhancedFollowUps);
    } catch (error) {
      console.error("Failed to fetch pending follow-ups:", error);
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
      
      // Enhance follow-ups with user information
      const enhancedFollowUps = await Promise.all(
        followUps.map(async (followUp) => {
          if (followUp.userId) {
            try {
              const user = await storage.getUser(followUp.userId);
              return {
                ...followUp,
                userName: user ? user.fullName : "Unknown User",
                userUsername: user ? user.username : "unknown"
              };
            } catch (err) {
              console.error(`Failed to get user info for ID ${followUp.userId}:`, err);
              return {
                ...followUp,
                userName: "Unknown User",
                userUsername: "unknown"
              };
            }
          } else {
            return {
              ...followUp,
              userName: "System",
              userUsername: "system"
            };
          }
        })
      );
      
      res.json(enhancedFollowUps);
    } catch (error) {
      console.error("Failed to fetch follow-ups:", error);
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
      
      // Enhance with user information
      let enhancedFollowUp = {...followUp};
      
      if (followUp.userId) {
        try {
          const user = await storage.getUser(followUp.userId);
          enhancedFollowUp = {
            ...followUp,
            userName: user ? user.fullName : "Unknown User",
            userUsername: user ? user.username : "unknown"
          };
        } catch (err) {
          console.error(`Failed to get user info for ID ${followUp.userId}:`, err);
          enhancedFollowUp = {
            ...followUp,
            userName: "Unknown User",
            userUsername: "unknown"
          };
        }
      } else {
        enhancedFollowUp = {
          ...followUp,
          userName: "System",
          userUsername: "system"
        };
      }
      
      res.json(enhancedFollowUp);
    } catch (error) {
      console.error("Failed to fetch follow-up:", error);
      res.status(500).json({ message: "Failed to fetch follow-up" });
    }
  });
  
  app.post("/api/follow-ups", validateRequest(followUpFormSchema), async (req, res) => {
    try {
      // Get current user ID (this is a mock, would be from auth session in real app)
      const userId = 1; // In a real app, this would be req.user.id
      
      const followUpData = { 
        ...req.body,
        userId // Add the userId to the follow-up data
      };
      
      const followUp = await storage.createFollowUp(followUpData);
      res.status(201).json(followUp);
    } catch (error) {
      console.error("Failed to create follow-up:", error);
      res.status(500).json({ message: "Failed to create follow-up" });
    }
  });
  
  app.put("/api/follow-ups/:id", validateRequest(followUpFormSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get current user ID (this is a mock, would be from auth session in real app)
      const userId = 1; // In a real app, this would be req.user.id
      
      // Add userId to the update data
      const updateData = {
        ...req.body,
        userId
      };
      
      const followUp = await storage.updateFollowUp(id, updateData);
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      res.json(followUp);
    } catch (error) {
      console.error("Failed to update follow-up:", error);
      res.status(500).json({ message: "Failed to update follow-up" });
    }
  });
  
  app.put("/api/follow-ups/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { updateCustomerStage, newCustomerStage, completionNotes, nextFollowUpDate, nextFollowUpNotes } = req.body || {};
      
      // Get current user ID (this is a mock, would be from auth session in real app)
      const userId = 1; // In a real app, this would be req.user.id
      console.log(`User ID ${userId} is completing follow-up ${id}`);
      
      // First mark the follow-up as complete with the userId
      const followUp = await storage.markFollowUpComplete(
        id, 
        completionNotes, 
        nextFollowUpDate !== undefined ? nextFollowUpDate : undefined,
        nextFollowUpNotes,
        userId // Add the userId parameter
      );
      
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      
      // If requested, also update the customer stage
      if (updateCustomerStage && newCustomerStage) {
        console.log(`User ID ${userId} is updating customer ${followUp.customerId} stage to ${newCustomerStage}`);
        
        const validStages = ["new", "pipeline", "cold", "warm", "booked", "lost"];
        if (!validStages.includes(newCustomerStage)) {
          return res.status(400).json({ message: "Invalid customer stage" });
        }
        
        try {
          await storage.updateCustomerStage(followUp.customerId, newCustomerStage);
          console.log(`Successfully updated customer ${followUp.customerId} stage to ${newCustomerStage}`);
        } catch (stageError) {
          console.error('Error updating customer stage:', stageError);
          return res.status(400).json({ 
            message: "Error updating customer stage", 
            error: stageError instanceof Error ? stageError.message : "Unknown error" 
          });
        }
      }
      
      // Return the completed follow-up
      res.json(followUp);
    } catch (error) {
      console.error('Error completing follow-up:', error);
      res.status(500).json({ 
        message: "Failed to complete follow-up",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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
  app.get("/api/quotations", authenticateToken, requirePermission('quotations', 'view'), async (req, res) => {
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

  app.get("/api/quotations/:id", authenticateToken, requirePermission('quotations', 'view'), async (req, res) => {
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
  
  app.get("/api/quotations/:id/details", authenticateToken, requirePermission('quotations', 'view'), async (req, res) => {
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

  app.post("/api/quotations", authenticateToken, requirePermission('quotations', 'create'), validateRequest(quotationFormSchema), async (req, res) => {
    try {
      const quotation = await storage.createQuotation(req.body);
      res.status(201).json(quotation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });

  app.put("/api/quotations/:id", authenticateToken, requirePermission('quotations', 'edit'), validateRequest(quotationFormSchema), async (req, res) => {
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

  app.delete("/api/quotations/:id", authenticateToken, requirePermission('quotations', 'delete'), async (req, res) => {
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

  // Duplicate quotation route
  app.post("/api/quotations/:id/duplicate", authenticateToken, requirePermission('quotations', 'create'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { customerId } = req.body;
      
      // Check if original quotation exists
      const originalQuotation = await storage.getQuotation(id);
      if (!originalQuotation) {
        return res.status(404).json({ message: "Original quotation not found" });
      }
      
      // Duplicate the quotation
      const duplicatedQuotation = await storage.duplicateQuotation(id, customerId);
      res.status(201).json(duplicatedQuotation);
    } catch (error) {
      res.status(500).json({ message: "Failed to duplicate quotation", error: (error as Error).message });
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

  // Quotation modification history routes
  app.get("/api/quotations/:id/modifications", async (req, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      const modifications = await storage.getQuotationModifications(quotationId);
      res.json(modifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotation modifications" });
    }
  });

  app.post("/api/quotations/:id/revert/:modificationId", async (req, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      const modificationId = parseInt(req.params.modificationId);
      
      const success = await storage.revertQuotationToModification(quotationId, modificationId);
      if (!success) {
        return res.status(400).json({ message: "Failed to revert quotation to selected modification" });
      }
      
      res.json({ success: true, message: "Quotation successfully reverted to previous modification" });
    } catch (error) {
      res.status(500).json({ message: "Failed to revert quotation", error: (error as Error).message });
    }
  });

  // Test endpoint to create a snapshot manually
  app.post("/api/quotations/:id/create-snapshot", async (req, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      const { title } = req.body;
      
      // Call the private method through the storage instance
      await (storage as any).createQuotationSnapshot(quotationId, title || "Manual snapshot");
      
      res.json({ success: true, message: "Snapshot created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to create snapshot", error: (error as Error).message });
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
      
      // Check if a room with the same name already exists in this quotation
      const existingRooms = await storage.getRooms(quotationId);
      const isDuplicate = existingRooms.some(room => 
        room.name.toLowerCase() === req.body.name.toLowerCase()
      );
      
      if (isDuplicate) {
        return res.status(400).json({ 
          message: "A room with this name already exists in the quotation" 
        });
      }
      
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
      
      // First, get the existing room to find its quotation ID
      const existingRoom = await storage.getRoom(id);
      if (!existingRoom) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      // If name is being updated, check for uniqueness
      if (req.body.name && req.body.name !== existingRoom.name) {
        // Get all other rooms in the same quotation
        const quotationRooms = await storage.getRooms(existingRoom.quotationId);
        
        // Check if another room already has the same name (excluding the current room)
        const isDuplicate = quotationRooms.some(room => 
          room.id !== id && 
          room.name.toLowerCase() === req.body.name.toLowerCase()
        );
        
        if (isDuplicate) {
          return res.status(400).json({ 
            message: "A room with this name already exists in the quotation" 
          });
        }
      }
      
      const room = await storage.updateRoom(id, req.body);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to update room" });
    }
  });
  
  // Delete room endpoint
  app.delete("/api/rooms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getRoom(id);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      // Check if this is the only room in the quotation
      const quotationRooms = await storage.getRooms(room.quotationId);
      
      if (quotationRooms.length <= 1) {
        return res.status(400).json({ message: "Cannot delete the only room in a quotation" });
      }
      
      // Delete the room along with all related data
      const success = await storage.deleteRoom(id);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete room" });
      }
      
      res.status(200).json({ success: true });
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
  
  // Teowin estimate upload route
  app.post("/api/rooms/:roomId/teowin-estimate", teowinEstimateUpload.single('file'), async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const room = await storage.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Update the room with the file info
      const fileUrl = `/uploads/${req.file.filename}`;
      const updatedRoom = await storage.updateRoomTeowinEstimate(
        roomId, 
        fileUrl, 
        req.file.mimetype, 
        req.file.originalname
      );
      
      if (!updatedRoom) {
        return res.status(404).json({ message: "Failed to update room" });
      }
      
      res.status(200).json({ 
        message: "Teowin estimate uploaded successfully",
        teowinEstimateUrl: updatedRoom.teowinEstimateUrl,
        teowinEstimateType: updatedRoom.teowinEstimateType,
        teowinEstimateName: updatedRoom.teowinEstimateName
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload Teowin estimate", error: (error as Error).message });
    }
  });

  // Update room inclusion status
  app.patch("/api/rooms/:id/included", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const { included } = req.body;
      
      const updatedRoom = await storage.updateRoom(roomId, { included });
      
      if (!updatedRoom) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      // Invalidate quotation cache to recalculate prices
      const quotationId = updatedRoom.quotationId;
      await storage.updateQuotationPrices(quotationId);
      
      res.json(updatedRoom);
    } catch (error) {
      res.status(500).json({ message: "Failed to update room inclusion status" });
    }
  });

  app.post("/api/rooms/:roomId/images", imageUpload.single('image'), async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      const image = await storage.createImage({
        roomId,
        path: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
        type: req.body.type || 'OTHER',
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

  app.patch("/api/images/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      console.log(`Updating image ${id} with:`, updates);
      
      // Validate image type if provided
      if (updates.type && !Object.values(imageTypeEnum.enumValues).includes(updates.type)) {
        console.log("Invalid image type:", updates.type);
        console.log("Valid types:", Object.values(imageTypeEnum.enumValues));
        return res.status(400).json({ 
          message: "Invalid image type", 
          validTypes: Object.values(imageTypeEnum.enumValues)
        });
      }
      
      // Get the existing image
      const existingImage = await storage.getImage(id);
      if (!existingImage) {
        console.log(`Image with id ${id} not found`);
        return res.status(404).json({ message: "Image not found" });
      }
      
      console.log("Existing image:", existingImage);
      
      // Update the image
      const updatedImage = {
        ...existingImage,
        ...updates
      };
      
      console.log("Updated image:", updatedImage);
      
      // Save the updated image
      const result = await storage.updateImage(id, updatedImage);
      
      console.log("Update result:", result);
      
      if (!result) {
        return res.status(500).json({ message: "Failed to update image in storage" });
      }
      
      res.json(updatedImage);
    } catch (error) {
      console.error("Error updating image:", error);
      res.status(500).json({ message: "Failed to update image" });
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
      if (image.path.startsWith('/uploads/')) {
        const filename = image.path.replace('/uploads/', '');
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

  // Image editing endpoint
  app.post("/api/images/:id/edit", imageUpload.single('image'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Get the existing image
      const existingImage = await storage.getImage(id);
      if (!existingImage) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Delete the old image file if it exists
      if (existingImage.path.startsWith('/uploads/')) {
        const oldFilename = existingImage.path.replace('/uploads/', '');
        const oldFilePath = path.join(uploadDir, oldFilename);
        
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        } catch (fileError) {
          console.error("Failed to delete old image file:", fileError);
        }
      }
      
      // Update the image with new file path
      const updatedImage = {
        ...existingImage,
        filename: file.filename,
        path: `/uploads/${file.filename}`
      };
      
      const result = await storage.updateImage(id, updatedImage);
      
      if (!result) {
        return res.status(500).json({ message: "Failed to update image in storage" });
      }
      
      res.json(updatedImage);
    } catch (error) {
      console.error("Error editing image:", error);
      res.status(500).json({ message: "Failed to edit image" });
    }
  });

  // User routes (Admin only)
  app.get("/api/users", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const users = await dbStorage.getUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await dbStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", authenticateToken, requireRole(['admin']), validateRequest(userFormSchema), async (req, res) => {
    try {
      const { username, password, email, fullName, role = 'designer' } = req.body;
      
      // Check if the username is already taken
      const existingUser = await dbStorage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await AuthService.hashPassword(password);
      
      // Create user with hashed password
      const user = await dbStorage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName,
        role: role as 'admin' | 'manager' | 'designer' | 'viewer',
        active: true
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", authenticateToken, requireRole(['admin']), validateRequest(userUpdateSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { username, password, email, fullName, role, active } = req.body;
      
      // Check if the username is already taken by another user
      const existingUser = await dbStorage.getUserByUsername(username);
      if (existingUser && existingUser.id !== id) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Prepare update data
      const updateData: any = { username, email, fullName, role, active };
      
      // Only hash password if it's provided
      if (password) {
        updateData.password = await AuthService.hashPassword(password);
      }
      
      const user = await dbStorage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await dbStorage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Profile update endpoint - allows users to update their own profile
  app.put("/api/auth/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { fullName, email, currentPassword, newPassword } = req.body;
      
      // If user wants to change password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required to set a new password" });
        }
        
        const user = await dbStorage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const isCurrentPasswordValid = await AuthService.comparePassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
      }
      
      // Prepare update data
      const updateData: any = { fullName, email };
      
      // Only hash new password if provided
      if (newPassword) {
        updateData.password = await AuthService.hashPassword(newPassword);
      }
      
      const updatedUser = await dbStorage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
  });

  // Admin password reset endpoint - allows admin to reset any user's password
  app.put("/api/users/:id/reset-password", authenticateToken, requirePermission('users', 'edit'), async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      // Hash the new password
      const hashedPassword = await AuthService.hashPassword(newPassword);

      // Update the user's password
      const updatedUser = await dbStorage.updateUser(userId, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: "Failed to reset password", error: error.message });
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

  // CSV Export endpoint (must be before :id route to avoid conflicts)
  app.get("/api/accessory-catalog/export", async (req, res) => {
    try {
      const accessories = await storage.getAccessoryCatalog();
      
      // Create CSV content
      const header = "Category,Code,Name,Selling Price,Kitchen Price,Wardrobe Price,Size,Description\n";
      const csvContent = accessories.map(item => {
        const escapeCsvField = (field: string | number | null | undefined) => {
          if (field === null || field === undefined) return '';
          const stringField = String(field);
          if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
        };
        
        return [
          escapeCsvField(item.category),
          escapeCsvField(item.code),
          escapeCsvField(item.name),
          escapeCsvField(item.sellingPrice),
          escapeCsvField(item.kitchenPrice),
          escapeCsvField(item.wardrobePrice),
          escapeCsvField(item.size || ''),
          escapeCsvField(item.description || '')
        ].join(',');
      }).join('\n');
      
      const csvData = header + csvContent;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="accessory-catalog.csv"');
      res.send(csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export accessory catalog", error: error.message });
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

  // CSV Import endpoint (matches frontend expectation)
  app.post("/api/accessory-catalog/import", csvUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }
      
      // Read the CSV file
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "CSV file is empty" });
      }
      
      // Skip header row
      const dataRows = lines.slice(1);
      
      const results = {
        totalRows: dataRows.length,
        successCount: 0,
        errorCount: 0,
        errors: [] as string[]
      };
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        try {
          if (!row.trim()) continue; // Skip empty rows
          
          // Parse CSV row (handle quoted fields)
          const parseCSVRow = (csvRow: string): string[] => {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < csvRow.length; j++) {
              const char = csvRow[j];
              const nextChar = csvRow[j + 1];
              
              if (char === '"' && inQuotes && nextChar === '"') {
                current += '"';
                j++; // Skip next quote
              } else if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current);
            return result;
          };
          
          const columns = parseCSVRow(row);
          if (columns.length < 4) {
            results.errorCount++;
            results.errors.push(`Row ${i + 2}: Invalid format - expected at least 4 columns, got ${columns.length}`);
            continue;
          }
          
          const [category, code, name, sellingPriceStr, kitchenPriceStr = "", wardrobePriceStr = "", sizeStr = "", descriptionStr = ""] = columns.map(col => col.trim());
          
          if (!category || !code || !name || !sellingPriceStr) {
            results.errorCount++;
            results.errors.push(`Row ${i + 2}: Missing required fields (category, code, name, or selling price)`);
            continue;
          }
          
          const sellingPrice = parseFloat(sellingPriceStr);
          const kitchenPrice = kitchenPriceStr ? parseFloat(kitchenPriceStr) : null;
          const wardrobePrice = wardrobePriceStr ? parseFloat(wardrobePriceStr) : null;
          
          if (isNaN(sellingPrice)) {
            results.errorCount++;
            results.errors.push(`Row ${i + 2}: Invalid selling price value: ${sellingPriceStr}`);
            continue;
          }
          
          if (kitchenPriceStr && isNaN(kitchenPrice!)) {
            results.errorCount++;
            results.errors.push(`Row ${i + 2}: Invalid kitchen price value: ${kitchenPriceStr}`);
            continue;
          }
          
          if (wardrobePriceStr && isNaN(wardrobePrice!)) {
            results.errorCount++;
            results.errors.push(`Row ${i + 2}: Invalid wardrobe price value: ${wardrobePriceStr}`);
            continue;
          }
          
          await storage.createAccessoryCatalogItem({
            category,
            code,
            name,
            sellingPrice,
            kitchenPrice,
            wardrobePrice,
            size: sizeStr || undefined,
            description: descriptionStr || undefined
          });
          
          results.successCount++;
        } catch (error) {
          results.errorCount++;
          results.errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(201).json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to import accessory catalog items", error: error.message });
    }
  });

  app.post("/api/accessory-catalog/bulk-import", csvUpload.single('file'), async (req, res) => {
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

  // Full application data backup/restore endpoints
  app.get("/api/backup/export", authenticateToken, requirePermission('settings', 'view'), async (req, res) => {
    try {
      // Collect all application data
      const backupData = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: "1.0.0",
          appVersion: "1.0.0"
        },
        companySettings: await storage.getCompanySettings(),
        appSettings: await storage.getAppSettings(),
        users: await storage.getUsers(),
        userPermissions: await storage.getAllUserPermissions(),
        customers: await storage.getCustomers(),
        quotations: await storage.getQuotations(),
        salesOrders: await storage.getSalesOrders(),
        invoices: await storage.getInvoices(),
        payments: await storage.getAllPayments(),
        followUps: await storage.getAllFollowUps(),
        accessoryCatalog: await storage.getAccessoryCatalog(),
        teams: await storage.getTeams(),
        milestones: await storage.getAllMilestones()
      };

      const backupJson = JSON.stringify(backupData, null, 2);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="app-backup-${new Date().toISOString().split('T')[0]}.json"`);
      res.send(backupJson);
    } catch (error) {
      console.error("Backup export error:", error);
      res.status(500).json({ message: "Failed to export application data", error: error.message });
    }
  });

  app.post("/api/backup/import", authenticateToken, requirePermission('settings', 'edit'), csvUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No backup file provided" });
      }

      // Read and parse the backup file
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      let backupData;
      
      try {
        backupData = JSON.parse(fileContent);
      } catch (parseError) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Invalid backup file format" });
      }

      // Validate backup file structure
      if (!backupData.metadata || !backupData.metadata.exportDate) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Invalid backup file - missing metadata" });
      }

      const results = {
        restored: {
          companySettings: 0,
          appSettings: 0,
          users: 0,
          userPermissions: 0,
          customers: 0,
          quotations: 0,
          salesOrders: 0,
          invoices: 0,
          payments: 0,
          followUps: 0,
          accessoryCatalog: 0,
          teams: 0,
          milestones: 0
        },
        errors: [] as string[],
        skipped: [] as string[]
      };

      // Note: This is a restore operation that will replace existing data
      // In a production system, you might want to add options for merge vs replace

      try {
        // Restore company settings
        if (backupData.companySettings) {
          await storage.updateCompanySettings(backupData.companySettings);
          results.restored.companySettings = 1;
        }

        // Restore app settings
        if (backupData.appSettings) {
          await storage.updateAppSettings(backupData.appSettings);
          results.restored.appSettings = 1;
        }

        // Note: Users and permissions are typically not restored to avoid security issues
        results.skipped.push("Users and permissions skipped for security");

        // Restore customers
        if (backupData.customers && Array.isArray(backupData.customers)) {
          for (const customer of backupData.customers) {
            try {
              // Remove id to let system assign new ones and check for existing email/phone
              const { id, createdAt, ...customerData } = customer;
              
              // Check if customer already exists by email or phone
              const existing = await storage.getCustomerByEmailOrPhone(customerData.email, customerData.phone);
              if (existing) {
                results.errors.push(`Customer restore error: The email "${customerData.email}" is already associated with customer "${existing.name}"`);
                continue;
              }
              
              await storage.createCustomer(customerData);
              results.restored.customers++;
            } catch (error) {
              results.errors.push(`Customer restore error: ${error.message}`);
            }
          }
        }

        // Restore quotations
        if (backupData.quotations && Array.isArray(backupData.quotations)) {
          for (const quotation of backupData.quotations) {
            try {
              const { id, createdAt, ...quotationData } = quotation;
              await storage.createQuotation(quotationData);
              results.restored.quotations++;
            } catch (error) {
              results.errors.push(`Quotation restore error: ${error.message}`);
            }
          }
        }

        // Restore sales orders
        if (backupData.salesOrders && Array.isArray(backupData.salesOrders)) {
          for (const salesOrder of backupData.salesOrders) {
            try {
              const { id, createdAt, ...salesOrderData } = salesOrder;
              await storage.createSalesOrder(salesOrderData);
              results.restored.salesOrders++;
            } catch (error) {
              results.errors.push(`Sales Order restore error: ${error.message}`);
            }
          }
        }

        // Restore invoices
        if (backupData.invoices && Array.isArray(backupData.invoices)) {
          for (const invoice of backupData.invoices) {
            try {
              const { id, createdAt, ...invoiceData } = invoice;
              await storage.createInvoice(invoiceData);
              results.restored.invoices++;
            } catch (error) {
              results.errors.push(`Invoice restore error: ${error.message}`);
            }
          }
        }

        // Restore customer payments
        if (backupData.payments && Array.isArray(backupData.payments)) {
          for (const payment of backupData.payments) {
            try {
              const { id, createdAt, ...paymentData } = payment;
              await storage.createCustomerPayment(paymentData);
              results.restored.payments++;
            } catch (error) {
              results.errors.push(`Payment restore error: ${error.message}`);
            }
          }
        }

        // Restore follow-ups
        if (backupData.followUps && Array.isArray(backupData.followUps)) {
          for (const followUp of backupData.followUps) {
            try {
              const { id, createdAt, ...followUpData } = followUp;
              await storage.createFollowUp(followUpData);
              results.restored.followUps++;
            } catch (error) {
              results.errors.push(`Follow-up restore error: ${error.message}`);
            }
          }
        }

        // Restore accessory catalog
        if (backupData.accessoryCatalog && Array.isArray(backupData.accessoryCatalog)) {
          for (const accessory of backupData.accessoryCatalog) {
            try {
              const { id, createdAt, ...accessoryData } = accessory;
              await storage.createAccessoryCatalogItem(accessoryData);
              results.restored.accessoryCatalog++;
            } catch (error) {
              results.errors.push(`Accessory restore error: ${error.message}`);
            }
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
          message: "Backup restore completed",
          results,
          backupInfo: {
            exportDate: backupData.metadata.exportDate,
            version: backupData.metadata.version
          }
        });

      } catch (restoreError) {
        fs.unlinkSync(req.file.path);
        throw restoreError;
      }

    } catch (error) {
      console.error("Backup import error:", error);
      res.status(500).json({ message: "Failed to import backup data", error: error.message });
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
  app.post("/api/settings/company/logo", imageUpload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No logo file provided" });
      }
      
      // Log the uploaded file information for debugging
      console.log("Uploaded file:", req.file);
      
      const logoUrl = `/uploads/${req.file.filename}`;
      console.log("Logo URL:", logoUrl);
      
      // Ensure the uploads directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log("Created uploads directory:", uploadDir);
      }
      
      const settings = await storage.updateCompanyLogo(logoUrl);
      console.log("Updated settings:", settings);
      
      res.json(settings);
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Failed to upload company logo", error: (error as Error).message });
    }
  });

  // Sales Order routes
  app.get("/api/sales-orders", authenticateToken, requirePermission('sales_orders', 'view'), async (req, res) => {
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

  app.get("/api/sales-orders/:id", authenticateToken, requirePermission('sales_orders', 'view'), async (req, res) => {
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

  app.put("/api/sales-orders/:id/status", authenticateToken, requirePermission('sales_orders', 'edit'), async (req, res) => {
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

  app.put("/api/sales-orders/:id", authenticateToken, requirePermission('sales_orders', 'edit'), async (req, res) => {
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

  app.delete("/api/sales-orders/:id", authenticateToken, requirePermission('sales_orders', 'delete'), async (req, res) => {
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
  
  // Revert sales order back to quotation
  app.post("/api/sales-orders/:id/revert-to-quotation", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const salesOrder = await storage.getSalesOrder(id);
      
      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      
      // Check if the order has payments or has been changed to a status that shouldn't be reverted
      if (salesOrder.amountPaid > 0) {
        return res.status(400).json({ 
          message: "Cannot revert a sales order with payments. Please refund payments first." 
        });
      }
      
      if (['completed', 'delivered', 'cancelled'].includes(salesOrder.status)) {
        return res.status(400).json({
          message: `Cannot revert a sales order with status '${salesOrder.status}'.`
        });
      }
      
      // Revert the sales order back to quotation
      const quotation = await storage.revertSalesOrderToQuotation(id);
      res.json(quotation);
    } catch (error) {
      console.error("Error reverting sales order to quotation:", error);
      res.status(500).json({ 
        message: "Failed to revert sales order to quotation", 
        error: error.message 
      });
    }
  });

  // Payment routes
  app.get("/api/sales-orders/:salesOrderId/payments", authenticateToken, requirePermission('payments', 'view'), async (req, res) => {
    try {
      const salesOrderId = parseInt(req.params.salesOrderId);
      const payments = await storage.getPayments(salesOrderId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/:id", authenticateToken, requirePermission('payments', 'view'), async (req, res) => {
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

  app.post("/api/sales-orders/:salesOrderId/payments", authenticateToken, requirePermission('payments', 'create'), async (req, res) => {
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

  app.delete("/api/payments/:id", authenticateToken, requirePermission('payments', 'delete'), async (req, res) => {
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
  app.get("/api/customer-payments", authenticateToken, requirePermission('payments', 'view'), async (req, res) => {
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

  app.get("/api/customer-payments/:id", authenticateToken, requirePermission('payments', 'view'), async (req, res) => {
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

  app.post("/api/customer-payments", authenticateToken, requirePermission('payments', 'create'), validateRequest(customerPaymentFormSchema), async (req, res) => {
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

  app.put("/api/customer-payments/:id", authenticateToken, requirePermission('payments', 'edit'), validateRequest(customerPaymentFormSchema), async (req, res) => {
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

  app.delete("/api/customer-payments/:id", authenticateToken, requirePermission('payments', 'delete'), async (req, res) => {
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
      
      if (!status || !["draft", "saved", "sent", "approved", "rejected", "expired", "converted"].includes(status)) {
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
      
      // Additional validation logic when changing to "saved" status
      if (status === "saved") {
        // Get full quotation details
        const quotationWithDetails = await storage.getQuotationWithDetails(id);
        
        // Validate there's at least one room
        if (!quotationWithDetails.rooms || quotationWithDetails.rooms.length === 0) {
          return res.status(400).json({ 
            message: "Cannot save quotation: At least one room must be added",
            errorType: "validation",
            validationErrors: [{
              type: "missing_room",
              message: "Quotation must have at least one room."
            }]
          });
        }
        
        const validationErrors = [];
        
        // Validate each room
        for (const room of quotationWithDetails.rooms) {
          // Check room value is not zero
          if (room.sellingPrice === 0) {
            validationErrors.push({
              type: "room_zero_value",
              message: `Room "${room.name || 'Untitled'}" has a zero value.`,
              roomId: room.id,
              roomName: room.name || 'Untitled'
            });
          }
          
          // Check every room has products
          if (!room.products || room.products.length === 0) {
            validationErrors.push({
              type: "missing_product",
              message: `Room "${room.name || 'Untitled'}" does not have any products.`,
              roomId: room.id,
              roomName: room.name || 'Untitled'
            });
          }
          
          // Check every room has accessories
          if (!room.accessories || room.accessories.length === 0) {
            validationErrors.push({
              type: "missing_accessory",
              message: `Room "${room.name || 'Untitled'}" does not have any accessories.`,
              roomId: room.id,
              roomName: room.name || 'Untitled'
            });
          }
          
          // Check every room has installation charges
          if (!room.installationCharges || room.installationCharges.length === 0) {
            validationErrors.push({
              type: "missing_installation",
              message: `Room "${room.name || 'Untitled'}" does not have installation charges.`,
              roomId: room.id,
              roomName: room.name || 'Untitled'
            });
          }
        }
        
        // Check handling charge is entered
        if (!quotationWithDetails.installationHandling || quotationWithDetails.installationHandling === 0) {
          validationErrors.push({
            type: "missing_handling_charge",
            message: "Handling charge must be entered."
          });
        }
        
        // If there are validation errors, return them
        if (validationErrors.length > 0) {
          return res.status(400).json({
            message: "Cannot save quotation: Validation failed",
            errorType: "validation",
            validationErrors
          });
        }
      }
      
      // When changing to "approved", verify it's in "saved" status first
      if (status === "approved" && existingQuotation.status !== "saved") {
        return res.status(400).json({ 
          message: `Cannot approve quotation: Only quotations in 'saved' status can be approved. Current status is '${existingQuotation.status}'. Please save the quotation as final first.`,
          errorType: "invalid_transition",
          currentStatus: existingQuotation.status,
          requiredStatus: "saved"
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
  app.get("/api/invoices", authenticateToken, requirePermission('invoices', 'view'), async (req, res) => {
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

  app.get("/api/invoices/:id", authenticateToken, requirePermission('invoices', 'view'), async (req, res) => {
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
  
  app.get("/api/invoices/:id/details", authenticateToken, requirePermission('invoices', 'view'), async (req, res) => {
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
  app.patch("/api/invoices/:id/status", authenticateToken, requirePermission('invoices', 'edit'), async (req, res) => {
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
  app.patch("/api/invoices/:id", authenticateToken, requirePermission('invoices', 'edit'), async (req, res) => {
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
  app.delete("/api/invoices/:id", authenticateToken, requirePermission('invoices', 'delete'), async (req, res) => {
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

  // Email functionality routes
  
  // Send quotation via email
  app.post('/api/quotations/:id/send-email', async (req, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      const { pdfBase64, email } = req.body;
      
      if (!pdfBase64) {
        return res.status(400).json({ message: 'PDF data is required' });
      }
      
      const pdfBuffer = Buffer.from(pdfBase64.split(',')[1], 'base64');
      const result = await emailService.sendQuotationEmail(quotationId, pdfBuffer, email);
      
      if (result) {
        res.json({ success: true, message: 'Quotation sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send quotation email' });
      }
    } catch (error) {
      console.error('Error sending quotation email:', error);
      res.status(500).json({ message: 'Error sending quotation email' });
    }
  });
  
  // Send payment receipt via email
  app.post('/api/payments/:id/send-email', async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { pdfBase64, email } = req.body;
      
      if (!pdfBase64) {
        return res.status(400).json({ message: 'PDF data is required' });
      }
      
      const pdfBuffer = Buffer.from(pdfBase64.split(',')[1], 'base64');
      const result = await emailService.sendPaymentReceiptEmail(paymentId, pdfBuffer, email);
      
      if (result) {
        res.json({ success: true, message: 'Payment receipt sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send payment receipt email' });
      }
    } catch (error) {
      console.error('Error sending payment receipt email:', error);
      res.status(500).json({ message: 'Error sending payment receipt email' });
    }
  });
  
  // Send invoice via email
  app.post('/api/invoices/:id/send-email', async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { pdfBase64, email } = req.body;
      
      if (!pdfBase64) {
        return res.status(400).json({ message: 'PDF data is required' });
      }
      
      const pdfBuffer = Buffer.from(pdfBase64.split(',')[1], 'base64');
      const result = await emailService.sendInvoiceEmail(invoiceId, pdfBuffer, email);
      
      if (result) {
        res.json({ success: true, message: 'Invoice sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send invoice email' });
      }
    } catch (error) {
      console.error('Error sending invoice email:', error);
      res.status(500).json({ message: 'Error sending invoice email' });
    }
  });
  
  // Check email configuration
  app.get('/api/email/status', async (req, res) => {
    try {
      const isConfigured = await emailService.isConfigured();
      res.json({ configured: isConfigured });
    } catch (error) {
      console.error('Error checking email status:', error);
      res.status(500).json({ message: 'Error checking email configuration' });
    }
  });

  // User permissions routes
  app.get('/api/user-permissions', authenticateToken, async (req, res) => {
    try {
      const permissions = await dbStorage.getAllUserPermissions();
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ message: 'Error fetching user permissions' });
    }
  });

  app.get('/api/user-permissions/:role', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const role = req.params.role as 'admin' | 'manager' | 'designer' | 'viewer';
      const permissions = await storage.getUserPermissionsByRole(role);
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching user permissions by role:', error);
      res.status(500).json({ message: 'Error fetching user permissions' });
    }
  });

  app.post('/api/user-permissions/bulk-update', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { permissions } = req.body;
      await dbStorage.bulkUpdateUserPermissions(permissions);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating user permissions:', error);
      res.status(500).json({ message: 'Error updating user permissions' });
    }
  });

  // Follow-up notification endpoint
  app.get('/api/follow-ups/pending', authenticateToken, async (req, res) => {
    try {
      const currentDate = new Date();
      const followUps = await storage.getFollowUps();
      
      // Filter for incomplete follow-ups with dates today or in the past
      const pendingFollowUps = followUps
        .filter(followUp => !followUp.completed && followUp.nextFollowUpDate)
        .filter(followUp => {
          const followUpDate = new Date(followUp.nextFollowUpDate!);
          return followUpDate <= currentDate;
        })
        .map(followUp => ({
          id: followUp.id,
          customerId: followUp.customerId,
          notes: followUp.notes,
          nextFollowUpDate: followUp.nextFollowUpDate,
          completed: followUp.completed,
          customer: {
            id: followUp.customerId,
            name: followUp.customer?.name || 'Unknown Customer',
            email: followUp.customer?.email || ''
          }
        }));

      res.json(pendingFollowUps);
    } catch (error) {
      console.error('Error fetching pending follow-ups:', error);
      res.status(500).json({ message: 'Error fetching pending follow-ups' });
    }
  });

  // Use WhatsApp routes
  app.use('/api/whatsapp', whatsappRouter);

  const httpServer = createServer(app);
  return httpServer;
}