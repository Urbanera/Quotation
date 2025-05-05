import express, { Request, Response, NextFunction } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as z from 'zod';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export async function registerRoutes(app: express.Express): Promise<Server> {
  // Validation middleware
  function validateRequest(schema: z.ZodSchema<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
            errors: error.format() 
          });
        }
        next(error);
      }
    };
  }
  
  // Customer endpoints
  app.get('/api/customers', async (_req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ message: 'Failed to fetch customers' });
    }
  });

  app.get('/api/customers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({ message: 'Failed to fetch customer' });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ message: 'Failed to create customer' });
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.updateCustomer(id, req.body);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ message: 'Failed to update customer' });
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCustomer(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ message: 'Failed to delete customer' });
    }
  });

  // Quotation endpoints
  app.get('/api/quotations', async (_req, res) => {
    try {
      const quotations = await storage.getQuotations();
      res.json(quotations);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      res.status(500).json({ message: 'Failed to fetch quotations' });
    }
  });

  app.get('/api/quotations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.getQuotation(id);
      
      if (!quotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      
      res.json(quotation);
    } catch (error) {
      console.error('Error fetching quotation:', error);
      res.status(500).json({ message: 'Failed to fetch quotation' });
    }
  });

  app.get('/api/quotations/:id/details', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.getQuotationWithDetails(id);
      
      if (!quotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      
      res.json(quotation);
    } catch (error) {
      console.error('Error fetching quotation details:', error);
      res.status(500).json({ message: 'Failed to fetch quotation details' });
    }
  });

  app.post('/api/quotations', async (req, res) => {
    try {
      // Generate a unique quotation number
      const date = new Date();
      const quotationNumber = `QT-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      // Fetch app settings for default values
      const appSettings = await storage.getAppSettings();
      const defaultGlobalDiscount = appSettings?.defaultGlobalDiscount || 0;
      const defaultGstPercentage = appSettings?.defaultGstPercentage || 18;
      const terms = appSettings?.defaultTermsAndConditions || '';
      
      // Calculate initial prices (0 as there are no rooms yet)
      const totalSellingPrice = 0;
      const totalDiscountedPrice = 0;
      const installationHandling = req.body.installationHandling || 0;
      const globalDiscount = req.body.globalDiscount !== undefined ? req.body.globalDiscount : defaultGlobalDiscount;
      const gstPercentage = req.body.gstPercentage !== undefined ? req.body.gstPercentage : defaultGstPercentage;
      
      // Calculate GST amount and final price
      const gstAmount = (totalDiscountedPrice + installationHandling) * (gstPercentage / 100);
      const finalPrice = totalDiscountedPrice + installationHandling + gstAmount;
      
      // Create a quotation
      const quotation = await storage.createQuotation({
        quotationNumber,
        customerId: req.body.customerId,
        totalSellingPrice,
        totalDiscountedPrice,
        totalInstallationCharges: 0,
        installationHandling,
        globalDiscount,
        gstPercentage,
        gstAmount,
        finalPrice,
        status: req.body.status || 'draft',
        title: req.body.title || '',
        description: req.body.description || null,
        validUntil: req.body.validUntil || null,
        terms: req.body.terms || terms,
      });
      
      res.status(201).json(quotation);
    } catch (error) {
      console.error('Error creating quotation:', error);
      res.status(500).json({ message: 'Failed to create quotation' });
    }
  });

  app.put('/api/quotations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.updateQuotation(id, req.body);
      
      if (!quotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      
      res.json(quotation);
    } catch (error) {
      console.error('Error updating quotation:', error);
      res.status(500).json({ message: 'Failed to update quotation' });
    }
  });

  app.patch('/api/quotations/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['draft', 'sent', 'approved', 'rejected', 'expired', 'converted'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      const quotation = await storage.updateQuotationStatus(id, status);
      
      if (!quotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      
      res.json(quotation);
    } catch (error) {
      console.error('Error updating quotation status:', error);
      res.status(500).json({ message: 'Failed to update quotation status' });
    }
  });

  app.delete('/api/quotations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if the quotation is in 'approved' status
      const quotation = await storage.getQuotation(id);
      if (quotation && quotation.status === 'approved') {
        return res.status(400).json({ message: 'Cannot delete an approved quotation' });
      }
      
      const deleted = await storage.deleteQuotation(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      res.status(500).json({ message: 'Failed to delete quotation' });
    }
  });

  // Duplicate quotation
  app.post('/api/quotations/:id/duplicate', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const duplicatedQuotation = await storage.duplicateQuotation(id);
      
      if (!duplicatedQuotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      
      res.status(201).json(duplicatedQuotation);
    } catch (error) {
      console.error('Error duplicating quotation:', error);
      res.status(500).json({ message: 'Failed to duplicate quotation' });
    }
  });
  
  // Room endpoints
  app.get('/api/quotations/:quotationId/rooms', async (req, res) => {
    try {
      const quotationId = parseInt(req.params.quotationId);
      const rooms = await storage.getRooms(quotationId);
      res.json(rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({ message: 'Failed to fetch rooms' });
    }
  });
  
  app.get('/api/rooms/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getRoom(id);
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      res.json(room);
    } catch (error) {
      console.error('Error fetching room:', error);
      res.status(500).json({ message: 'Failed to fetch room' });
    }
  });
  
  app.get('/api/rooms/:id/details', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getRoomWithItems(id);
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      res.json(room);
    } catch (error) {
      console.error('Error fetching room details:', error);
      res.status(500).json({ message: 'Failed to fetch room details' });
    }
  });
  
  app.post('/api/quotations/:quotationId/rooms', async (req, res) => {
    try {
      const quotationId = parseInt(req.params.quotationId);
      const roomData = { 
        ...req.body, 
        quotationId 
      };
      
      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ message: 'Failed to create room' });
    }
  });
  
  app.put('/api/rooms/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.updateRoom(id, req.body);
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      res.json(room);
    } catch (error) {
      console.error('Error updating room:', error);
      res.status(500).json({ message: 'Failed to update room' });
    }
  });
  
  app.delete('/api/rooms/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRoom(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ message: 'Failed to delete room' });
    }
  });
  
  app.post('/api/quotations/:quotationId/rooms/reorder', async (req, res) => {
    try {
      const roomIds = req.body.roomIds;
      
      if (!Array.isArray(roomIds)) {
        return res.status(400).json({ message: 'Room IDs must be an array' });
      }
      
      const success = await storage.reorderRooms(roomIds);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to reorder rooms' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error reordering rooms:', error);
      res.status(500).json({ message: 'Failed to reorder rooms' });
    }
  });
  
  // Product endpoints
  app.get('/api/rooms/:roomId/products', async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const products = await storage.getProducts(roomId);
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });
  
  app.post('/api/rooms/:roomId/products', async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const productData = {
        ...req.body,
        roomId
      };
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Failed to create product' });
    }
  });
  
  app.get('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Failed to fetch product' });
    }
  });
  
  app.put('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.updateProduct(id, req.body);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  });
  
  app.delete('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });
  
  // Accessory endpoints
  app.get('/api/rooms/:roomId/accessories', async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const accessories = await storage.getAccessories(roomId);
      res.json(accessories);
    } catch (error) {
      console.error('Error fetching accessories:', error);
      res.status(500).json({ message: 'Failed to fetch accessories' });
    }
  });
  
  app.post('/api/rooms/:roomId/accessories', async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const accessoryData = {
        ...req.body,
        roomId
      };
      
      const accessory = await storage.createAccessory(accessoryData);
      res.status(201).json(accessory);
    } catch (error) {
      console.error('Error creating accessory:', error);
      res.status(500).json({ message: 'Failed to create accessory' });
    }
  });
  
  app.get('/api/accessories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessory = await storage.getAccessory(id);
      
      if (!accessory) {
        return res.status(404).json({ message: 'Accessory not found' });
      }
      
      res.json(accessory);
    } catch (error) {
      console.error('Error fetching accessory:', error);
      res.status(500).json({ message: 'Failed to fetch accessory' });
    }
  });
  
  app.put('/api/accessories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accessory = await storage.updateAccessory(id, req.body);
      
      if (!accessory) {
        return res.status(404).json({ message: 'Accessory not found' });
      }
      
      res.json(accessory);
    } catch (error) {
      console.error('Error updating accessory:', error);
      res.status(500).json({ message: 'Failed to update accessory' });
    }
  });
  
  app.delete('/api/accessories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAccessory(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Accessory not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting accessory:', error);
      res.status(500).json({ message: 'Failed to delete accessory' });
    }
  });
  
  // Accessory Catalog endpoints
  app.get('/api/accessory-catalog', async (req, res) => {
    try {
      const catalog = await storage.getAccessoryCatalog();
      res.json(catalog);
    } catch (error) {
      console.error('Error fetching accessory catalog:', error);
      res.status(500).json({ message: 'Failed to fetch accessory catalog' });
    }
  });
  
  app.get('/api/accessory-catalog/category/:category', async (req, res) => {
    try {
      const category = req.params.category;
      const catalog = await storage.getAccessoryCatalogByCategory(category);
      res.json(catalog);
    } catch (error) {
      console.error('Error fetching accessory catalog by category:', error);
      res.status(500).json({ message: 'Failed to fetch accessory catalog by category' });
    }
  });
  
  app.post('/api/accessory-catalog', async (req, res) => {
    try {
      const item = await storage.createAccessoryCatalogItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating accessory catalog item:', error);
      res.status(500).json({ message: 'Failed to create accessory catalog item' });
    }
  });
  
  app.put('/api/accessory-catalog/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateAccessoryCatalogItem(id, req.body);
      
      if (!item) {
        return res.status(404).json({ message: 'Accessory catalog item not found' });
      }
      
      res.json(item);
    } catch (error) {
      console.error('Error updating accessory catalog item:', error);
      res.status(500).json({ message: 'Failed to update accessory catalog item' });
    }
  });
  
  app.delete('/api/accessory-catalog/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAccessoryCatalogItem(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Accessory catalog item not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting accessory catalog item:', error);
      res.status(500).json({ message: 'Failed to delete accessory catalog item' });
    }
  });
  
  // Image endpoints
  app.get('/api/rooms/:roomId/images', async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const images = await storage.getImages(roomId);
      res.json(images);
    } catch (error) {
      console.error('Error fetching images:', error);
      res.status(500).json({ message: 'Failed to fetch images' });
    }
  });
  
  // Configure multer storage for image uploads
  const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });
  
  const imageUpload = multer({ 
    storage: imageStorage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
  });
  
  app.post('/api/rooms/:roomId/images', imageUpload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }
      
      const roomId = parseInt(req.params.roomId);
      
      const uploadedFile = req.file;
      const filepath = '/uploads/' + path.basename(uploadedFile.path);
      
      const image = await storage.createImage({
        roomId,
        path: filepath,
        filename: uploadedFile.originalname
      });
      
      res.status(201).json(image);
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });
  
  app.delete('/api/images/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const image = await storage.getImage(id);
      
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }
      
      // Get the file path and delete the file
      const filepath = path.join(process.cwd(), image.path.replace(/^\//, ''));
      
      // Delete from database first
      const deleted = await storage.deleteImage(id);
      
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete image from database' });
      }
      
      // Then try to delete file (but don't fail if file deletion fails)
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch (fileError) {
        console.error('Error deleting image file:', fileError);
        // Continue anyway - the database record is gone
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ message: 'Failed to delete image' });
    }
  });
  
  app.post('/api/rooms/:roomId/images/reorder', async (req, res) => {
    try {
      const imageIds = req.body.imageIds;
      
      if (!Array.isArray(imageIds)) {
        return res.status(400).json({ message: 'Image IDs must be an array' });
      }
      
      const success = await storage.reorderImages(imageIds);
      
      if (!success) {
        return res.status(400).json({ message: 'Failed to reorder images' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error reordering images:', error);
      res.status(500).json({ message: 'Failed to reorder images' });
    }
  });
  
  // Installation charge endpoints
  app.get('/api/rooms/:roomId/installation-charges', async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const charges = await storage.getInstallationCharges(roomId);
      res.json(charges);
    } catch (error) {
      console.error('Error fetching installation charges:', error);
      res.status(500).json({ message: 'Failed to fetch installation charges' });
    }
  });
  
  app.post('/api/rooms/:roomId/installation-charges', async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const chargeData = {
        ...req.body,
        roomId
      };
      
      const charge = await storage.createInstallationCharge(chargeData);
      res.status(201).json(charge);
    } catch (error) {
      console.error('Error creating installation charge:', error);
      res.status(500).json({ message: 'Failed to create installation charge' });
    }
  });
  
  app.get('/api/installation-charges/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const charge = await storage.getInstallationCharge(id);
      
      if (!charge) {
        return res.status(404).json({ message: 'Installation charge not found' });
      }
      
      res.json(charge);
    } catch (error) {
      console.error('Error fetching installation charge:', error);
      res.status(500).json({ message: 'Failed to fetch installation charge' });
    }
  });
  
  app.put('/api/installation-charges/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const charge = await storage.updateInstallationCharge(id, req.body);
      
      if (!charge) {
        return res.status(404).json({ message: 'Installation charge not found' });
      }
      
      res.json(charge);
    } catch (error) {
      console.error('Error updating installation charge:', error);
      res.status(500).json({ message: 'Failed to update installation charge' });
    }
  });
  
  app.delete('/api/installation-charges/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteInstallationCharge(id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Installation charge not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting installation charge:', error);
      res.status(500).json({ message: 'Failed to delete installation charge' });
    }
  });
  // PDF Generation utility function
  const generatePDF = async (documentType: string, data: any, isQuotation: boolean = true): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a PDF document with A4 size
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: documentType,
            Author: 'Interio Designs',
            Subject: 'Document',
            Creator: 'PDF Generator'
          }
        });
        
        const chunks: Buffer[] = [];
        
        // Collect data chunks
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // Extract data from the passed object
        const companyName = data.companyName || 'Interio Designs';
        const companyTagline = data.companyTagline || 'Interior Design Quotations';
        const companyAddress = data.companyAddress || '123 Design Avenue, Suite 456, Design District';
        const companyPhone = data.companyPhone || '+1 (555) 123-4567';
        const companyEmail = data.companyEmail || 'info@interiodesigns.com';
        
        const documentNumber = data.documentNumber || '';
        const date = data.date || new Date().toLocaleDateString();
        
        const customerName = data.customerName || '';
        const customerAddress = data.customerAddress || '';
        const customerEmail = data.customerEmail || '';
        const customerPhone = data.customerPhone || '';
        
        const items = data.items || [];
        const subtotal = data.subtotal || 0;
        const discountedTotal = data.discountedTotal || 0;
        const installationCharges = data.installationCharges || 0;
        const gstPercentage = data.gstPercentage || 0;
        const gstAmount = data.gstAmount || 0;
        const grandTotal = data.grandTotal || 0;
        
        const terms = data.terms || [];
        
        // Header section - company info on left, document info on right
        doc.font('Helvetica-Bold').fontSize(20).fillColor('#5446e9').text(companyName, 50, 50);
        doc.fontSize(12).fillColor('#666666').text(companyTagline, 50, doc.y);
        
        doc.font('Helvetica-Bold').fillColor('#333333').text(documentType.toUpperCase(), 400, 50, { align: 'right' });
        doc.fillColor('#666666').text('#' + documentNumber, 400, doc.y, { align: 'right' });
        doc.text(`Date: ${date}`, 400, doc.y, { align: 'right' });
        
        // Separator line
        doc.moveDown();
        doc.strokeColor('#cccccc').lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .stroke();
        doc.moveDown();
        
        // From/To section
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('From:', 50, doc.y);
        doc.font('Helvetica').fontSize(10).fillColor('#666666');
        doc.text(companyName, 50, doc.y);
        doc.text(companyAddress, 50, doc.y);
        doc.text(companyPhone, 50, doc.y);
        doc.text(companyEmail, 50, doc.y);
        
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#333333').text('To:', 350, doc.y - 80);
        doc.font('Helvetica').fontSize(10).fillColor('#666666');
        doc.text(customerName, 350, doc.y);
        doc.text(customerAddress, 350, doc.y);
        doc.text(customerEmail, 350, doc.y);
        doc.text(customerPhone, 350, doc.y);
        
        doc.moveDown();
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#333333').text('Project Cost Summary', 50, doc.y);
        doc.moveDown(0.5);
        
        // Table headers
        const tableTop = doc.y;
        const tableLeft = 50;
        const columnWidth = (doc.page.width - 100) / 3;
        
        // Table headers background
        doc.fillColor('#f9f9f9').rect(tableLeft, tableTop, doc.page.width - 100, 30).fill();
        
        // Table header borders
        doc.strokeColor('#cccccc').lineWidth(0.5)
          .rect(tableLeft, tableTop, doc.page.width - 100, 30).stroke();
          
        // Vertical lines for header
        doc.moveTo(tableLeft + columnWidth, tableTop)
          .lineTo(tableLeft + columnWidth, tableTop + 30)
          .stroke();
          
        doc.moveTo(tableLeft + columnWidth * 2, tableTop)
          .lineTo(tableLeft + columnWidth * 2, tableTop + 30)
          .stroke();
        
        // Table headers text
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
          .text('PRODUCT DESCRIPTION', tableLeft + 10, tableTop + 10);
        
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
          .text('SELLING PRICE', tableLeft + columnWidth + 10, tableTop + 10);
        
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
          .text('DISCOUNTED PRICE', tableLeft + columnWidth * 2 + 10, tableTop + 10);
        
        let tableRowY = tableTop + 30;
        
        // Add table rows for each item
        items.forEach((item: any) => {
          const rowHeight = 30;
          
          // Row background (alternating for readability)
          doc.strokeColor('#cccccc').lineWidth(0.5)
            .rect(tableLeft, tableRowY, doc.page.width - 100, rowHeight).stroke();
            
          // Vertical lines for row
          doc.moveTo(tableLeft + columnWidth, tableRowY)
            .lineTo(tableLeft + columnWidth, tableRowY + rowHeight)
            .stroke();
            
          doc.moveTo(tableLeft + columnWidth * 2, tableRowY)
            .lineTo(tableLeft + columnWidth * 2, tableRowY + rowHeight)
            .stroke();
          
          // Item data
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
            .text(item.name.toUpperCase(), tableLeft + 10, tableRowY + 10);
          
          doc.font('Helvetica').fontSize(10).fillColor('#333333')
            .text(`₹${item.sellingPrice.toFixed(2)}`, tableLeft + columnWidth + 10, tableRowY + 10);
          
          doc.font('Helvetica').fontSize(10).fillColor('#333333')
            .text(`₹${item.discountedPrice.toFixed(2)}`, tableLeft + columnWidth * 2 + 10, tableRowY + 10);
          
          tableRowY += rowHeight;
        });
        
        // Add total row
        const totalRowHeight = 30;
        
        // Total row styling
        doc.strokeColor('#cccccc').lineWidth(0.5)
          .rect(tableLeft, tableRowY, doc.page.width - 100, totalRowHeight).stroke();
          
        // Vertical lines for total row
        doc.moveTo(tableLeft + columnWidth, tableRowY)
          .lineTo(tableLeft + columnWidth, tableRowY + totalRowHeight)
          .stroke();
          
        doc.moveTo(tableLeft + columnWidth * 2, tableRowY)
          .lineTo(tableLeft + columnWidth * 2, tableRowY + totalRowHeight)
          .stroke();
        
        // Total row content
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
          .text('Total Of All Items', tableLeft + 10, tableRowY + 10);
        
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
          .text(`₹${subtotal.toFixed(2)}`, tableLeft + columnWidth + 10, tableRowY + 10);
        
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
          .text(`₹${discountedTotal.toFixed(2)}`, tableLeft + columnWidth * 2 + 10, tableRowY + 10);
        
        tableRowY += totalRowHeight;
        
        // Installation charges row
        if (installationCharges > 0) {
          doc.strokeColor('#cccccc').lineWidth(0.5)
            .rect(tableLeft, tableRowY, doc.page.width - 100, totalRowHeight).stroke();
            
          // Vertical lines for installation row
          doc.moveTo(tableLeft + columnWidth, tableRowY)
            .lineTo(tableLeft + columnWidth, tableRowY + totalRowHeight)
            .stroke();
            
          doc.moveTo(tableLeft + columnWidth * 2, tableRowY)
            .lineTo(tableLeft + columnWidth * 2, tableRowY + totalRowHeight)
            .stroke();
          
          // Installation row content
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
            .text('Installation and Handling', tableLeft + 10, tableRowY + 10);
          
          doc.font('Helvetica').fontSize(10).fillColor('#333333')
            .text(`₹${installationCharges.toFixed(2)}`, tableLeft + columnWidth + 10, tableRowY + 10);
          
          doc.font('Helvetica').fontSize(10).fillColor('#333333')
            .text(`₹${installationCharges.toFixed(2)}`, tableLeft + columnWidth * 2 + 10, tableRowY + 10);
          
          tableRowY += totalRowHeight;
        }
        
        // GST row
        if (gstPercentage > 0) {
          doc.strokeColor('#cccccc').lineWidth(0.5)
            .rect(tableLeft, tableRowY, doc.page.width - 100, totalRowHeight).stroke();
            
          // Vertical lines for GST row
          doc.moveTo(tableLeft + columnWidth, tableRowY)
            .lineTo(tableLeft + columnWidth, tableRowY + totalRowHeight)
            .stroke();
            
          doc.moveTo(tableLeft + columnWidth * 2, tableRowY)
            .lineTo(tableLeft + columnWidth * 2, tableRowY + totalRowHeight)
            .stroke();
          
          // GST row content
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
            .text(`GST ${gstPercentage}%`, tableLeft + 10, tableRowY + 10);
          
          doc.font('Helvetica').fontSize(10).fillColor('#333333')
            .text(`₹${gstAmount.toFixed(2)}`, tableLeft + columnWidth + 10, tableRowY + 10);
          
          doc.font('Helvetica').fontSize(10).fillColor('#333333')
            .text(`₹${gstAmount.toFixed(2)}`, tableLeft + columnWidth * 2 + 10, tableRowY + 10);
          
          tableRowY += totalRowHeight;
        }
        
        // Final price row
        doc.fillColor('#f9f9f9').rect(tableLeft, tableRowY, doc.page.width - 100, totalRowHeight).fill();
        
        doc.strokeColor('#cccccc').lineWidth(0.5)
          .rect(tableLeft, tableRowY, doc.page.width - 100, totalRowHeight).stroke();
          
        // Vertical lines for final price row
        doc.moveTo(tableLeft + columnWidth, tableRowY)
          .lineTo(tableLeft + columnWidth, tableRowY + totalRowHeight)
          .stroke();
          
        doc.moveTo(tableLeft + columnWidth * 2, tableRowY)
          .lineTo(tableLeft + columnWidth * 2, tableRowY + totalRowHeight)
          .stroke();
        
        // Final price row content
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
          .text('Final Price', tableLeft + 10, tableRowY + 10);
        
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
          .text(`₹${grandTotal.toFixed(2)}`, tableLeft + columnWidth + 10, tableRowY + 10);
        
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#3366cc')
          .text(`₹${grandTotal.toFixed(2)}`, tableLeft + columnWidth * 2 + 10, tableRowY + 10);
        
        // Add terms & conditions if this is a quotation
        if (isQuotation && terms.length > 0) {
          doc.moveDown(2);
          doc.font('Helvetica-Bold').fontSize(12).fillColor('#333333').text('Terms & Conditions', 50, doc.y);
          doc.moveDown(0.5);
          
          // List of terms
          terms.forEach((term: string) => {
            doc.font('Helvetica').fontSize(10).fillColor('#666666')
              .text(`• ${term}`, 50, doc.y);
          });
        }
        
        // Add footer
        doc.moveDown(2);
        doc.font('Helvetica').fontSize(10).fillColor('#666666')
          .text('Thank you for your business!', 50, doc.y, { align: 'center' });
          
        doc.font('Helvetica').fontSize(9).fillColor('#999999')
          .text(`For any queries, please contact us at ${companyEmail} or call ${companyPhone}`, 50, doc.y, { align: 'center' });
          
        doc.font('Helvetica').fontSize(9).fillColor('#999999')
          .text('https://www.interiodesigns.com', 50, doc.y, { align: 'center' });
        
        // Add page numbers
        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);
          doc.fontSize(8)
             .fillColor('#999999')
             .text(
               `Page ${i + 1} of ${totalPages}`,
               50,
               doc.page.height - 30,
               { align: 'center' }
             );
        }
        
        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // PDF Endpoint for Quotations
  app.get('/api/pdf/quotation/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.getQuotationWithDetails(id);
      
      if (!quotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      
      const companySettings = await storage.getCompanySettings();
      
      // Prepare room items for the PDF
      const roomItems = [];
      
      if (quotation.rooms && quotation.rooms.length > 0) {
        quotation.rooms.forEach(room => {
          roomItems.push({
            name: room.name.toUpperCase(),
            sellingPrice: room.sellingPrice || 0,
            discountedPrice: room.discountedPrice || 0
          });
        });
      }
      
      // Format terms as a list for the PDF
      const formattedTerms = [];
      
      if (quotation.terms) {
        // Standard terms to include
        formattedTerms.push(`Quotation is valid for 15 days from the date of issue.`);
        formattedTerms.push(`30% advance payment required to start the work.`);
        formattedTerms.push(`Delivery time: 4-6 weeks from date of order confirmation.`);
        formattedTerms.push(`Warranty: 1 year on manufacturing defects.`);
        formattedTerms.push(`Transportation and installation included in the price.`);
        formattedTerms.push(`Colors may vary slightly from the samples shown.`);
        
        // Add custom terms if not empty
        if (quotation.terms.trim() !== '') {
          const customTerms = quotation.terms.split("\n");
          customTerms.forEach(term => {
            if (term.trim()) formattedTerms.push(term.trim());
          });
        }
      }
      
      // Prepare the PDF data structure
      const pdfData = {
        companyName: companySettings?.name || 'Interio Designs',
        companyTagline: 'Interior Design Quotations',
        companyAddress: companySettings?.address || '',
        companyPhone: companySettings?.phone || '',
        companyEmail: companySettings?.email || '',
        
        documentNumber: quotation.quotationNumber || `${quotation.id}`,
        date: new Date(quotation.createdAt).toLocaleDateString(),
        
        customerName: quotation.customer?.name || '',
        customerAddress: quotation.customer?.address || '',
        customerEmail: quotation.customer?.email || '',
        customerPhone: quotation.customer?.phone || '',
        
        items: roomItems,
        subtotal: quotation.totalSellingPrice || 0,
        discountedTotal: quotation.totalDiscountedPrice || 0,
        installationCharges: quotation.installationHandling || 0,
        gstPercentage: quotation.gstPercentage || 0,
        gstAmount: quotation.gstAmount || 0,
        grandTotal: quotation.finalPrice || 0,
        
        terms: formattedTerms
      };
      
      // Generate the PDF using the new function
      const pdfBuffer = await generatePDF("QUOTATION", pdfData, true);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Quotation-${quotation.quotationNumber || quotation.id}.pdf`);
      
      // Send the PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ message: 'Error generating PDF' });
    }
  });
  
  // PDF Endpoint for Invoices
  app.get('/api/pdf/invoice/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      let quotation = null;
      if (invoice.quotationId) {
        quotation = await storage.getQuotationWithDetails(invoice.quotationId);
      }
      
      const customer = await storage.getCustomer(invoice.customerId);
      const companySettings = await storage.getCompanySettings();
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found for this invoice' });
      }
      
      // Prepare room items for the PDF
      const roomItems = [];
      
      if (quotation && quotation.rooms && quotation.rooms.length > 0) {
        quotation.rooms.forEach(room => {
          roomItems.push({
            name: room.name.toUpperCase(),
            sellingPrice: room.sellingPrice || 0,
            discountedPrice: room.discountedPrice || 0
          });
        });
      }
      
      // Calculate subtotal, GST and other values
      let subtotal = 0;
      let discountedTotal = 0;
      let installationCharges = 0;
      let gstPercentage = 0;
      let gstAmount = 0;
      
      if (quotation) {
        subtotal = quotation.totalSellingPrice || 0;
        discountedTotal = quotation.totalDiscountedPrice || 0;
        installationCharges = quotation.installationHandling || 0;
        gstPercentage = quotation.gstPercentage || 0;
        gstAmount = quotation.gstAmount || 0;
      }
      
      // Prepare the PDF data structure
      const pdfData = {
        companyName: companySettings?.name || 'Interio Designs',
        companyTagline: 'Tax Invoice',
        companyAddress: companySettings?.address || '',
        companyPhone: companySettings?.phone || '',
        companyEmail: companySettings?.email || '',
        
        documentNumber: invoice.invoiceNumber || `${invoice.id}`,
        date: new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString(),
        
        customerName: customer.name || '',
        customerAddress: customer.address || '',
        customerEmail: customer.email || '',
        customerPhone: customer.phone || '',
        
        items: roomItems,
        subtotal: subtotal,
        discountedTotal: discountedTotal,
        installationCharges: installationCharges,
        gstPercentage: gstPercentage,
        gstAmount: gstAmount,
        grandTotal: invoice.totalAmount || (subtotal + installationCharges + gstAmount),
        
        terms: []
      };
      
      // Generate the PDF using the new function
      const pdfBuffer = await generatePDF("INVOICE", pdfData, false);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber || invoice.id}.pdf`);
      
      // Send the PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ message: 'Error generating PDF' });
    }
  });
  
  // PDF Endpoint for Payment Receipts
  app.get('/api/pdf/receipt/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getCustomerPayment(id);
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      const customer = await storage.getCustomer(payment.customerId);
      const companySettings = await storage.getCompanySettings();
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found for this payment' });
      }
      
      // Format the payment method for display
      const formatPaymentMethod = (method: string) => {
        return method
          .replace('_', ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      };

      // Format payment information for the PDF
      const formattedPaymentInfo = [
        {
          name: payment.description || `Payment (${payment.paymentType.replace('_', ' ')})`,
          sellingPrice: payment.amount,
          discountedPrice: payment.amount
        }
      ];
      
      // Prepare the PDF data structure
      const pdfData = {
        companyName: companySettings?.name || 'Interio Designs',
        companyTagline: 'Receipt',
        companyAddress: companySettings?.address || '',
        companyPhone: companySettings?.phone || '',
        companyEmail: companySettings?.email || '',
        
        documentNumber: payment.receiptNumber || `${payment.id}`,
        date: new Date(payment.paymentDate).toLocaleDateString(),
        
        customerName: customer.name || '',
        customerAddress: customer.address || '',
        customerEmail: customer.email || '',
        customerPhone: customer.phone || '',
        
        items: formattedPaymentInfo,
        subtotal: payment.amount,
        discountedTotal: payment.amount,
        installationCharges: 0,
        gstPercentage: 0,
        gstAmount: 0,
        grandTotal: payment.amount,
        
        terms: []
      };
      
      // Generate the PDF using the new function
      const pdfBuffer = await generatePDF("RECEIPT", pdfData, false);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Receipt-${payment.receiptNumber || payment.id}.pdf`);
      
      // Send the PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ message: 'Error generating PDF' });
    }
  });

  // Configure multer storage for file uploads
  const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });

  // Create multer upload instance
  const upload = multer({ 
    storage: storage_config,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB file size limit
    }
  });

  // Additional routes and their implementations will follow here
  
  const httpServer = createServer(app);
  
  return httpServer;
}