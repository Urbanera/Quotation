import { Router, Request, Response } from 'express';
import { whatsappService } from './whatsapp';

export const whatsappRouter = Router();

// Test WhatsApp connection
whatsappRouter.get('/test-connection', async (req: Request, res: Response) => {
  try {
    const phoneNumber = req.query.phoneNumber as string;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }
    
    const result = await whatsappService.testConnection(phoneNumber);
    
    if (result.success) {
      res.status(200).json({ success: true, message: "WhatsApp configuration is valid" });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("WhatsApp test connection error:", error);
    res.status(500).json({ success: false, message: "Failed to test WhatsApp connection" });
  }
});

// Check WhatsApp configuration status
whatsappRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const isConfigured = await whatsappService.isConfigured();
    res.json({ configured: isConfigured });
  } catch (error) {
    console.error('Error checking WhatsApp configuration:', error);
    res.status(500).json({ error: 'Failed to check WhatsApp configuration' });
  }
});

// Send greeting message
whatsappRouter.post('/send-greeting', async (req: Request, res: Response) => {
  try {
    const { customerId, phone, customerName } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }
    
    if (!customerName) {
      return res.status(400).json({ success: false, message: "Customer name is required" });
    }
    
    const result = await whatsappService.sendGreeting({
      to: phone,
      customerName
    });
    
    if (result.success) {
      res.status(200).json({ success: true, message: "Greeting message sent successfully" });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("WhatsApp send greeting error:", error);
    res.status(500).json({ success: false, message: "Failed to send WhatsApp greeting" });
  }
});

// Send layout request message
whatsappRouter.post('/send-layout-request', async (req: Request, res: Response) => {
  try {
    const { phone, customerName } = req.body;
    
    if (!phone || !customerName) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone number and customer name are required" 
      });
    }
    
    const result = await whatsappService.sendLayoutRequest({
      to: phone,
      customerName
    });
    
    if (result.success) {
      res.status(200).json({ success: true, message: "Layout request message sent successfully" });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("WhatsApp send layout request error:", error);
    res.status(500).json({ success: false, message: "Failed to send layout request via WhatsApp" });
  }
});

// Send showroom visit invitation
whatsappRouter.post('/send-showroom-visit', async (req: Request, res: Response) => {
  try {
    const { phone, customerName, address } = req.body;
    
    if (!phone || !customerName) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone number and customer name are required" 
      });
    }
    
    const result = await whatsappService.sendShowroomVisitInvitation({
      to: phone,
      customerName,
      address
    });
    
    if (result.success) {
      res.status(200).json({ success: true, message: "Showroom visit invitation sent successfully" });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("WhatsApp send showroom visit invitation error:", error);
    res.status(500).json({ success: false, message: "Failed to send showroom visit invitation via WhatsApp" });
  }
});

// Send missed call notification
whatsappRouter.post('/send-missed-call', async (req: Request, res: Response) => {
  try {
    const { phone, customerName, businessPhone } = req.body;
    
    if (!phone || !customerName) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone number and customer name are required" 
      });
    }
    
    const result = await whatsappService.sendMissedCallNotification({
      to: phone,
      customerName,
      businessPhone
    });
    
    if (result.success) {
      res.status(200).json({ success: true, message: "Missed call notification sent successfully" });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("WhatsApp send missed call notification error:", error);
    res.status(500).json({ success: false, message: "Failed to send missed call notification via WhatsApp" });
  }
});

// Send meeting schedule
whatsappRouter.post('/send-meeting-schedule', async (req: Request, res: Response) => {
  try {
    const { phone, customerName, date, time, location } = req.body;
    
    if (!phone || !customerName || !date || !time) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone number, customer name, date, and time are required" 
      });
    }
    
    const result = await whatsappService.sendMeetingSchedule({
      to: phone,
      customerName,
      date,
      time,
      location
    });
    
    if (result.success) {
      res.status(200).json({ success: true, message: "Meeting schedule sent successfully" });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("WhatsApp send meeting schedule error:", error);
    res.status(500).json({ success: false, message: "Failed to send meeting schedule via WhatsApp" });
  }
});

// Send quotation
whatsappRouter.post('/send-quotation', async (req: Request, res: Response) => {
  try {
    const { phone, customerName, quotationNumber, amount, documentUrl } = req.body;
    
    if (!phone || !customerName || !quotationNumber || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone number, customer name, quotation number, and amount are required" 
      });
    }
    
    const result = await whatsappService.sendQuotation({
      to: phone,
      customerName,
      quotationNumber,
      amount,
      documentUrl
    });
    
    if (result.success) {
      res.status(200).json({ success: true, message: "Quotation sent successfully via WhatsApp" });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("WhatsApp send quotation error:", error);
    res.status(500).json({ success: false, message: "Failed to send quotation via WhatsApp" });
  }
});

// Send payment receipt
whatsappRouter.post('/send-payment-receipt', async (req: Request, res: Response) => {
  try {
    const { phone, customerName, receiptNumber, amount, documentUrl } = req.body;
    
    if (!phone || !customerName || !receiptNumber || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone number, customer name, receipt number, and amount are required" 
      });
    }
    
    const result = await whatsappService.sendPaymentReceipt({
      to: phone,
      customerName,
      receiptNumber,
      amount,
      documentUrl
    });
    
    if (result.success) {
      res.status(200).json({ success: true, message: "Payment receipt sent successfully via WhatsApp" });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("WhatsApp send payment receipt error:", error);
    res.status(500).json({ success: false, message: "Failed to send payment receipt via WhatsApp" });
  }
});

// Send invoice
whatsappRouter.post('/send-invoice', async (req: Request, res: Response) => {
  try {
    const { phone, customerName, invoiceNumber, amount, dueDate, documentUrl } = req.body;
    
    if (!phone || !customerName || !invoiceNumber || !amount || !dueDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone number, customer name, invoice number, amount, and due date are required" 
      });
    }
    
    const result = await whatsappService.sendInvoice({
      to: phone,
      customerName,
      invoiceNumber,
      amount,
      dueDate,
      documentUrl
    });
    
    if (result.success) {
      res.status(200).json({ success: true, message: "Invoice sent successfully via WhatsApp" });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("WhatsApp send invoice error:", error);
    res.status(500).json({ success: false, message: "Failed to send invoice via WhatsApp" });
  }
});