import nodemailer from 'nodemailer';
import { storage } from './storage';
import fs from 'fs';
import path from 'path';

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

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: this.settings.smtpHost,
        port: this.settings.smtpPort || 587,
        secure: this.settings.smtpSecure || false,
        auth: {
          user: this.settings.smtpUser,
          pass: this.settings.smtpPassword,
        },
        tls: {
          // Do not fail on invalid certs
          rejectUnauthorized: false,
        },
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
   * Send an email
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    attachments?: { filename: string; path: string; contentType?: string }[];
  }): Promise<boolean> {
    try {
      if (!await this.isConfigured()) {
        console.log('Email service not configured or disabled');
        return false;
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
      
      // Send email
      const info = await this.transporter!.sendMail({
        from: `"${this.companySettings.name}" <${emailFrom}>`,
        to: options.to,
        replyTo: replyTo,
        subject: options.subject,
        html: htmlContent,
        attachments: options.attachments || [],
      });

      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
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

      // Create temp file for attachment
      const tempFilePath = path.join(process.cwd(), 'uploads', `quotation-${quotationId}-${Date.now()}.pdf`);
      fs.writeFileSync(tempFilePath, pdfBuffer);

      // Generate email content
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Quotation: ${quotation.quotationNumber}</h2>
          <p>Dear ${customer.name},</p>
          <p>Please find attached our quotation for your interior design project.</p>
          <p><strong>Quotation Details:</strong></p>
          <ul>
            <li><strong>Quotation Number:</strong> ${quotation.quotationNumber}</li>
            <li><strong>Date:</strong> ${new Date(quotation.createdAt).toLocaleDateString()}</li>
            ${quotation.title ? `<li><strong>Project:</strong> ${quotation.title}</li>` : ''}
          </ul>
          <p>If you have any questions regarding this quotation, please feel free to contact us.</p>
          <p>Thank you for your interest in our services.</p>
          <p>Best Regards,<br>${this.companySettings.name}</p>
        </div>
      `;

      // Send email with attachment
      const result = await this.sendEmail({
        to: recipientEmail,
        subject: `Quotation: ${quotation.quotationNumber}`,
        html,
        attachments: [
          {
            filename: `Quotation-${quotation.quotationNumber}.pdf`,
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

      // Create temp file for attachment
      const tempFilePath = path.join(process.cwd(), 'uploads', `receipt-${paymentId}-${Date.now()}.pdf`);
      fs.writeFileSync(tempFilePath, pdfBuffer);

      // Generate email content
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Payment Receipt: ${payment.receiptNumber}</h2>
          <p>Dear ${finalCustomer.name},</p>
          <p>Thank you for your payment. Please find attached your payment receipt.</p>
          <p><strong>Receipt Details:</strong></p>
          <ul>
            <li><strong>Receipt Number:</strong> ${payment.receiptNumber}</li>
            <li><strong>Date:</strong> ${new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}</li>
            <li><strong>Amount:</strong> ₹${payment.amount.toFixed(2)}</li>
            <li><strong>Payment Method:</strong> ${payment.paymentMethod.replace('_', ' ').toUpperCase()}</li>
          </ul>
          <p>If you have any questions regarding this payment, please feel free to contact us.</p>
          <p>Thank you for your business.</p>
          <p>Best Regards,<br>${this.companySettings.name}</p>
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
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Invoice: ${invoice.invoiceNumber}</h2>
          <p>Dear ${customer.name},</p>
          <p>Please find attached the invoice for your interior design project.</p>
          <p><strong>Invoice Details:</strong></p>
          <ul>
            <li><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</li>
            <li><strong>Date:</strong> ${new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}</li>
            <li><strong>Amount:</strong> ₹${invoice.totalAmount.toFixed(2)}</li>
            <li><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Immediate'}</li>
          </ul>
          <p>If you have any questions regarding this invoice, please feel free to contact us.</p>
          <p>Thank you for your business.</p>
          <p>Best Regards,<br>${this.companySettings.name}</p>
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