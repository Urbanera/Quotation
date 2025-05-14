import nodemailer from 'nodemailer';
import { storage } from './storage';
import fs from 'fs';
import path from 'path';

// Extended attachment type to include content buffer
interface ExtendedAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  contentType?: string;
}

// Email service for sending emails
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private settings: any = null;
  private companySettings: any = null;
  private initialized = false;

  constructor() {}

  /**
   * Initialize the email service with settings
   */
  async initialize(): Promise<boolean> {
    try {
      // Get app settings and company settings
      this.settings = await storage.getAppSettings();
      this.companySettings = await storage.getCompanySettings();
      
      if (!this.settings?.smtpHost || !this.settings?.smtpUser) {
        console.log('Email settings not configured');
        this.initialized = false;
        return false;
      }

      // Create transporter with enhanced TLS options
      this.transporter = nodemailer.createTransport({
        host: this.settings.smtpHost,
        port: this.settings.smtpPort || 587,
        secure: this.settings.smtpSecure || false,
        auth: {
          user: this.settings.smtpUser,
          pass: this.settings.smtpPassword,
        },
        tls: {
          // Enhanced TLS options to handle various server configurations
          rejectUnauthorized: false, // Don't fail on invalid certs
          minVersion: 'TLSv1', // Support older TLS versions
          maxVersion: 'TLSv1.3', // Support up to the latest TLS
          ciphers: 'HIGH:MEDIUM:!aNULL:!MD5:!RC4', // Flexible cipher suite
        },
        debug: true, // Enable debugging
      });
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Check if email service is configured and enabled
   */
  async isConfigured(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.initialized && this.settings?.emailEnabled === true;
  }

  /**
   * Send an email with retry mechanism
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    attachments?: { filename: string; path: string; contentType?: string }[];
  }): Promise<boolean> {
    // Maximum number of retries
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!await this.isConfigured()) {
          console.log('Email service not configured or disabled');
          return false;
        }

        // If this isn't the first attempt, reinitialize the transporter
        if (attempt > 1) {
          console.log(`Retry attempt ${attempt}/${maxRetries} - Reinitializing email transporter`);
          await this.initialize();
        }

        const emailFrom = this.settings.emailFrom || this.companySettings.email;
        const replyTo = this.settings.emailReplyTo || emailFrom;
        
        // Add email footer if configured
        let htmlContent = options.html;
        if (this.settings.emailFooter) {
          htmlContent += `<br/><br/><div style="border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px; color: #666;">${this.settings.emailFooter}</div>`;
        }

        // Add company info footer
        htmlContent += `<div style="margin-top: 10px; font-size: 12px; color: #888;">
          <p>${this.companySettings.name}<br>
          ${this.companySettings.address}<br>
          Phone: ${this.companySettings.phone}<br>
          Email: ${this.companySettings.email}<br>
          ${this.companySettings.website ? `Website: ${this.companySettings.website}` : ''}
          </p>
        </div>`;
        
        // Try different connection methods if we're retrying
        let mailOptions: any = {
          from: `"${this.companySettings.name}" <${emailFrom}>`,
          to: options.to,
          replyTo: replyTo,
          subject: options.subject,
          html: htmlContent,
          attachments: options.attachments || [],
        };
        
        // Send email
        const info = await this.transporter!.sendMail(mailOptions);
        
        console.log('Email sent successfully:', info.messageId);
        return true;
      } catch (error) {
        console.error(`Email attempt ${attempt}/${maxRetries} failed:`, error);
        
        // If we've exhausted all retries, give up and return false
        if (attempt === maxRetries) {
          console.error('Maximum email retries reached, giving up');
          return false;
        }
        
        // Wait before the next retry attempt (exponential backoff)
        const delayMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s, etc.
        console.log(`Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return false; // This line should never be reached, but TypeScript requires it
  }

  /**
   * Send a quotation email
   */
  async sendQuotationEmail(quotationId: number, pdfBuffer: Buffer, emailTo: string): Promise<boolean> {
    try {
      const quotation = await storage.getQuotation(quotationId);
      if (!quotation) {
        console.log('Quotation not found');
        return false;
      }

      const customer = await storage.getCustomer(quotation.customerId);
      if (!customer) {
        console.log('Customer not found');
        return false;
      }

      // Determine recipient email (use provided email or customer email)
      const recipientEmail = emailTo || customer.email;
      if (!recipientEmail) {
        console.log('No recipient email provided');
        return false;
      }

      // Generate email content
      const host = process.env.APP_URL || 'http://localhost:5000';
      const logoUrl = this.companySettings.logo ? 
        `${host}${this.companySettings.logo}` : 
        `${host}/assets/default-logo.png`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            ${this.companySettings.logo ? 
              `<img src="${logoUrl}" alt="${this.companySettings.name}" style="max-height: 60px; max-width: 180px; margin-bottom: 10px;" />` : 
              `<h1 style="color: #2c3e50; margin-bottom: 5px; font-size: 24px;">${this.companySettings.name}</h1>`
            }
            <div style="height: 3px; background: linear-gradient(to right, #4CAF50, #8BC34A); margin: 15px auto; width: 150px;"></div>
          </div>
          
          <h2 style="color: #4CAF50; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Quotation: ${quotation.quotationNumber}</h2>
          
          <p style="font-size: 16px; color: #333;">Dear <strong>${customer.name}</strong>,</p>
          
          <p style="font-size: 16px; color: #333;">Thank you for your interest in our services. Please find attached our quotation for your interior design project.</p>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Quotation Details:</h3>
            <ul style="padding-left: 20px;">
              <li style="margin-bottom: 8px;"><strong>Quotation Number:</strong> ${quotation.quotationNumber}</li>
              <li style="margin-bottom: 8px;"><strong>Date:</strong> ${new Date(quotation.createdAt).toLocaleDateString()}</li>
              ${quotation.title ? `<li style="margin-bottom: 8px;"><strong>Project:</strong> ${quotation.title}</li>` : ''}
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #333;">If you have any questions or would like to discuss this further, please don't hesitate to contact us.</p>
          
          <p style="font-size: 16px; color: #333;">Best regards,</p>
          <p style="font-size: 16px; color: #333; font-weight: bold;">${this.companySettings.name}</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #666; text-align: center;">
            <p>This email contains a quotation document attachment. Please review it at your convenience.</p>
          </div>
        </div>
      `;

      // Verify that the PDF buffer is valid
      if (!pdfBuffer || pdfBuffer.length < 100) {
        console.error('PDF buffer is invalid or too small', pdfBuffer?.length);
        return false;
      }

      console.log(`Sending quotation email with PDF buffer size: ${pdfBuffer.length} bytes`);
      
      // Send email with attachment directly from buffer (no temp file)
      const result = await this.sendEmail({
        to: recipientEmail,
        subject: `Quotation: ${quotation.quotationNumber}`,
        html,
        attachments: [
          {
            filename: `Quotation-${quotation.quotationNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      return result;
    } catch (error) {
      console.error('Failed to send quotation email:', error);
      return false;
    }
  }

  /**
   * Send a payment receipt email
   */
  async sendPaymentReceiptEmail(paymentId: number, pdfBuffer: Buffer, emailTo: string): Promise<boolean> {
    try {
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        console.log('Payment not found');
        return false;
      }

      // Get customer information based on payment type
      let finalCustomer = null;
      
      // For Sales Order payment
      if (payment.salesOrderId) {
        const salesOrder = await storage.getSalesOrder(payment.salesOrderId);
        if (!salesOrder) {
          console.log('Sales Order not found');
          return false;
        }
        
        finalCustomer = await storage.getCustomer(salesOrder.customerId);
        if (!finalCustomer) {
          console.log('Customer not found');
          return false;
        }
      } 
      // For Direct Customer payment (Customer Receipt)
      else {
        // For this application, we'll assume this is a customer direct payment
        // The actual implementation would depend on your data model
        // This is a simplified version that handles this case
        console.log('Direct customer payment - no sales order');
        return false;
      }
      
      // At this point we're guaranteed to have a valid customer

      // Determine recipient email (use provided email or customer email)
      const recipientEmail = emailTo || finalCustomer.email;
      if (!recipientEmail) {
        console.log('No recipient email provided');
        return false;
      }

      // Generate email content
      const host = process.env.APP_URL || 'http://localhost:5000';
      const logoUrl = this.companySettings.logo ? 
        `${host}${this.companySettings.logo}` : 
        `${host}/assets/default-logo.png`;
        
      // Verify that the PDF buffer is valid
      if (!pdfBuffer || pdfBuffer.length < 100) {
        console.error('PDF buffer is invalid or too small', pdfBuffer?.length);
        return false;
      }
      
      console.log(`Sending receipt email with PDF buffer size: ${pdfBuffer.length} bytes`);

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            ${this.companySettings.logo ? 
              `<img src="${logoUrl}" alt="${this.companySettings.name}" style="max-height: 60px; max-width: 180px; margin-bottom: 10px;" />` : 
              `<h1 style="color: #2c3e50; margin-bottom: 5px; font-size: 24px;">${this.companySettings.name}</h1>`
            }
            <div style="height: 3px; background: linear-gradient(to right, #4CAF50, #8BC34A); margin: 15px auto; width: 150px;"></div>
          </div>
          
          <h2 style="color: #4CAF50; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Payment Receipt: ${payment.receiptNumber}</h2>
          
          <p style="font-size: 16px; color: #333;">Dear <strong>${finalCustomer.name}</strong>,</p>
          
          <p style="font-size: 16px; color: #333;">Thank you for your payment. Please find attached your payment receipt for your records.</p>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Receipt Details:</h3>
            <ul style="padding-left: 20px;">
              <li style="margin-bottom: 8px;"><strong>Receipt Number:</strong> ${payment.receiptNumber}</li>
              <li style="margin-bottom: 8px;"><strong>Date:</strong> ${new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}</li>
              <li style="margin-bottom: 8px;"><strong>Amount:</strong> <span style="color: #4CAF50; font-weight: bold;">₹${payment.amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></li>
              <li style="margin-bottom: 8px;"><strong>Payment Method:</strong> ${payment.paymentMethod.replace('_', ' ').toUpperCase()}</li>
              ${payment.transactionId ? `<li style="margin-bottom: 8px;"><strong>Transaction ID:</strong> ${payment.transactionId}</li>` : ''}
              ${payment.notes ? `<li style="margin-bottom: 8px;"><strong>Notes:</strong> ${payment.notes}</li>` : ''}
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #333;">If you have any questions regarding this payment, please don't hesitate to contact us.</p>
          
          <p style="font-size: 16px; color: #333;">Thank you for your business.</p>
          
          <p style="font-size: 16px; color: #333;">Best regards,</p>
          <p style="font-size: 16px; color: #333; font-weight: bold;">${this.companySettings.name}</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #666; text-align: center;">
            <p>This email contains a payment receipt attachment. Please keep it for your records.</p>
          </div>
        </div>
      `;

      // Send email with attachment
      const result = await this.sendEmail({
        to: recipientEmail,
        subject: `Payment Receipt: ${payment.receiptNumber}`,
        html,
        attachments: [
          {
            filename: `Receipt-${payment.receiptNumber}.pdf`,
            path: tempFilePath,
            contentType: 'application/pdf',
          },
        ],
      });

      // Delete temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }

      return result;
    } catch (error) {
      console.error('Failed to send payment receipt email:', error);
      return false;
    }
  }

  /**
   * Send an invoice email
   */
  async sendInvoiceEmail(invoiceId: number, pdfBuffer: Buffer, emailTo: string): Promise<boolean> {
    try {
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        console.log('Invoice not found');
        return false;
      }

      const customer = await storage.getCustomer(invoice.customerId);
      if (!customer) {
        console.log('Customer not found');
        return false;
      }

      // Determine recipient email (use provided email or customer email)
      const recipientEmail = emailTo || customer.email;
      if (!recipientEmail) {
        console.log('No recipient email provided');
        return false;
      }

      // Create temp file for attachment
      const tempFilePath = path.join(process.cwd(), 'uploads', `invoice-${invoiceId}-${Date.now()}.pdf`);
      fs.writeFileSync(tempFilePath, pdfBuffer);

      // Generate email content
      const host = process.env.APP_URL || 'http://localhost:5000';
      const logoUrl = this.companySettings.logo ? 
        `${host}${this.companySettings.logo}` : 
        `${host}/assets/default-logo.png`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            ${this.companySettings.logo ? 
              `<img src="${logoUrl}" alt="${this.companySettings.name}" style="max-height: 60px; max-width: 180px; margin-bottom: 10px;" />` : 
              `<h1 style="color: #2c3e50; margin-bottom: 5px; font-size: 24px;">${this.companySettings.name}</h1>`
            }
            <div style="height: 3px; background: linear-gradient(to right, #4CAF50, #8BC34A); margin: 15px auto; width: 150px;"></div>
          </div>
          
          <h2 style="color: #4CAF50; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Invoice: ${invoice.invoiceNumber}</h2>
          
          <p style="font-size: 16px; color: #333;">Dear <strong>${customer.name}</strong>,</p>
          
          <p style="font-size: 16px; color: #333;">Please find attached the invoice for your interior design project.</p>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-top: 0;">Invoice Details:</h3>
            <ul style="padding-left: 20px;">
              <li style="margin-bottom: 8px;"><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</li>
              <li style="margin-bottom: 8px;"><strong>Date:</strong> ${new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}</li>
              <li style="margin-bottom: 8px;"><strong>Amount:</strong> <span style="color: #4CAF50; font-weight: bold;">₹${invoice.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></li>
              <li style="margin-bottom: 8px;"><strong>Due Date:</strong> <span style="color: ${invoice.dueDate ? '#e74c3c' : '#2c3e50'}; font-weight: ${invoice.dueDate ? 'bold' : 'normal'};">${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Immediate'}</span></li>
            </ul>
          </div>
          
          <div style="background-color: #FFEBEE; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #e74c3c; font-weight: bold;">Payment Instructions</p>
            <p style="margin-top: 8px; margin-bottom: 0;">Please ensure prompt payment according to the terms outlined in the invoice. For any payment-related queries, kindly contact our accounts department.</p>
          </div>
          
          <p style="font-size: 16px; color: #333;">If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
          
          <p style="font-size: 16px; color: #333;">Thank you for your business.</p>
          
          <p style="font-size: 16px; color: #333;">Best regards,</p>
          <p style="font-size: 16px; color: #333; font-weight: bold;">${this.companySettings.name}</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 14px; color: #666; text-align: center;">
            <p>This email contains an invoice attachment. Please process this payment according to the terms specified.</p>
          </div>
        </div>
      `;

      // Send email with attachment
      const result = await this.sendEmail({
        to: recipientEmail,
        subject: `Invoice: ${invoice.invoiceNumber}`,
        html,
        attachments: [
          {
            filename: `Invoice-${invoice.invoiceNumber}.pdf`,
            path: tempFilePath,
            contentType: 'application/pdf',
          },
        ],
      });

      // Delete temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error('Failed to delete temp file:', err);
      }

      return result;
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const emailService = new EmailService();