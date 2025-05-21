import { storage } from './storage';
import fetch from 'node-fetch';

export interface WhatsAppSettings {
  enabled: boolean;
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  // Templates registered in Meta Business Account
  greetingTemplate: string;
  layoutRequestTemplate: string;
  showroomVisitTemplate: string;
  missedCallTemplate: string;
  meetingScheduleTemplate: string;
  quotationTemplate: string;
  paymentReceiptTemplate: string;
  invoiceTemplate: string;
}

export class WhatsAppService {
  private settings: WhatsAppSettings | null = null;
  private initialized = false;

  constructor() {}

  /**
   * Initialize the WhatsApp service with settings
   */
  async initialize(): Promise<boolean> {
    try {
      const appSettings = await storage.getAppSettings();
      
      if (!appSettings) {
        console.error('Cannot initialize WhatsApp service: App settings not found');
        return false;
      }

      if (!appSettings.whatsappEnabled) {
        console.log('WhatsApp integration is disabled in settings');
        this.initialized = false;
        return false;
      }

      // Extract WhatsApp settings from app settings
      this.settings = {
        enabled: appSettings.whatsappEnabled || false,
        phoneNumberId: appSettings.whatsappPhoneNumberId || '',
        accessToken: appSettings.whatsappAccessToken || '',
        businessAccountId: appSettings.whatsappBusinessAccountId || '',
        greetingTemplate: appSettings.whatsappGreetingTemplate || 'hello_world',
        layoutRequestTemplate: appSettings.whatsappLayoutRequestTemplate || 'layout_request',
        showroomVisitTemplate: appSettings.whatsappShowroomVisitTemplate || 'showroom_visit',
        missedCallTemplate: appSettings.whatsappMissedCallTemplate || 'missed_call',
        meetingScheduleTemplate: appSettings.whatsappMeetingScheduleTemplate || 'meeting_schedule',
        quotationTemplate: appSettings.whatsappQuotationTemplate || 'quotation_send',
        paymentReceiptTemplate: appSettings.whatsappPaymentReceiptTemplate || 'payment_receipt',
        invoiceTemplate: appSettings.whatsappInvoiceTemplate || 'invoice_send',
      };

      if (!this.settings.phoneNumberId || !this.settings.accessToken) {
        console.error('Cannot initialize WhatsApp service: Missing phone number ID or access token');
        this.initialized = false;
        return false;
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing WhatsApp service:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Check if WhatsApp service is configured and enabled
   */
  async isConfigured(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.initialized && (this.settings?.enabled || false);
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(options: {
    to: string;
    templateName: string;
    language?: string;
    components?: any[];
    headerMediaUrl?: string;
    headerMediaType?: 'document' | 'image';
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!await this.isConfigured()) {
        return { success: false, message: 'WhatsApp service is not configured' };
      }

      if (!this.settings) {
        return { success: false, message: 'WhatsApp settings not available' };
      }

      // Format phone number (remove any non-numeric characters and ensure it starts with country code)
      const formattedPhoneNumber = this.formatPhoneNumber(options.to);
      if (!formattedPhoneNumber) {
        return { success: false, message: 'Invalid phone number format' };
      }

      const templateParams: any = {
        name: options.templateName,
        language: { code: options.language || 'en_US' },
      };

      // Add components if provided
      if (options.components && options.components.length > 0) {
        templateParams.components = options.components;
      }

      // Prepare the request body
      const requestBody: any = {
        messaging_product: 'whatsapp',
        to: formattedPhoneNumber,
        type: 'template',
        template: templateParams
      };

      console.log(`Sending WhatsApp message to ${formattedPhoneNumber} using template ${options.templateName}`);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      // Send the API request to WhatsApp
      const response = await fetch(
        `https://graph.facebook.com/v17.0/${this.settings.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.settings.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API error:', responseData);
        return {
          success: false,
          message: `WhatsApp API error: ${responseData.error?.message || 'Unknown error'}`,
          data: responseData
        };
      }

      console.log('WhatsApp message sent successfully:', responseData);
      return {
        success: true,
        message: 'Message sent successfully',
        data: responseData
      };
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        message: `Error sending WhatsApp message: ${error.message}`
      };
    }
  }

  /**
   * Format phone number to WhatsApp format (remove any non-numeric characters and ensure it starts with country code)
   */
  private formatPhoneNumber(phoneNumber: string): string | null {
    // Remove any non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If it doesn't start with a country code, add Indian country code (91) as default
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }

    // Validate the phone number (basic validation)
    if (cleaned.length < 10) {
      console.error('Invalid phone number format:', phoneNumber);
      return null;
    }

    return cleaned;
  }

  /**
   * Send a greeting message
   */
  async sendGreeting(options: {
    to: string;
    customerName: string;
    businessName?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!await this.isConfigured()) {
        return { success: false, message: 'WhatsApp service is not configured' };
      }

      if (!this.settings) {
        return { success: false, message: 'WhatsApp settings not available' };
      }

      const companySettings = await storage.getCompanySettings();
      const businessName = options.businessName || companySettings?.name || 'Our Business';

      const components = [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: options.customerName
            },
            {
              type: 'text',
              text: businessName
            }
          ]
        }
      ];

      return await this.sendMessage({
        to: options.to,
        templateName: this.settings.greetingTemplate,
        components
      });
    } catch (error: any) {
      console.error('Error sending greeting message:', error);
      return {
        success: false,
        message: `Error sending greeting message: ${error.message}`
      };
    }
  }

  /**
   * Send a layout request message
   */
  async sendLayoutRequest(options: {
    to: string;
    customerName: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!await this.isConfigured()) {
        return { success: false, message: 'WhatsApp service is not configured' };
      }

      if (!this.settings) {
        return { success: false, message: 'WhatsApp settings not available' };
      }

      const components = [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: options.customerName
            }
          ]
        }
      ];

      return await this.sendMessage({
        to: options.to,
        templateName: this.settings.layoutRequestTemplate,
        components
      });
    } catch (error: any) {
      console.error('Error sending layout request message:', error);
      return {
        success: false,
        message: `Error sending layout request message: ${error.message}`
      };
    }
  }

  /**
   * Send a showroom visit invitation
   */
  async sendShowroomVisitInvitation(options: {
    to: string;
    customerName: string;
    address?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!await this.isConfigured()) {
        return { success: false, message: 'WhatsApp service is not configured' };
      }

      if (!this.settings) {
        return { success: false, message: 'WhatsApp settings not available' };
      }

      const companySettings = await storage.getCompanySettings();
      const address = options.address || companySettings?.address || 'our showroom';

      const components = [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: options.customerName
            },
            {
              type: 'text',
              text: address
            }
          ]
        }
      ];

      return await this.sendMessage({
        to: options.to,
        templateName: this.settings.showroomVisitTemplate,
        components
      });
    } catch (error: any) {
      console.error('Error sending showroom visit invitation:', error);
      return {
        success: false,
        message: `Error sending showroom visit invitation: ${error.message}`
      };
    }
  }

  /**
   * Send a missed call notification
   */
  async sendMissedCallNotification(options: {
    to: string;
    customerName: string;
    businessPhone?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!await this.isConfigured()) {
        return { success: false, message: 'WhatsApp service is not configured' };
      }

      if (!this.settings) {
        return { success: false, message: 'WhatsApp settings not available' };
      }

      const companySettings = await storage.getCompanySettings();
      const businessPhone = options.businessPhone || companySettings?.phone || 'our business line';

      const components = [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: options.customerName
            },
            {
              type: 'text',
              text: businessPhone
            }
          ]
        }
      ];

      return await this.sendMessage({
        to: options.to,
        templateName: this.settings.missedCallTemplate,
        components
      });
    } catch (error: any) {
      console.error('Error sending missed call notification:', error);
      return {
        success: false,
        message: `Error sending missed call notification: ${error.message}`
      };
    }
  }

  /**
   * Send a meeting schedule notification
   */
  async sendMeetingSchedule(options: {
    to: string;
    customerName: string;
    date: string;
    time: string;
    location?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!await this.isConfigured()) {
        return { success: false, message: 'WhatsApp service is not configured' };
      }

      if (!this.settings) {
        return { success: false, message: 'WhatsApp settings not available' };
      }

      const components = [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: options.customerName
            },
            {
              type: 'text',
              text: options.date
            },
            {
              type: 'text',
              text: options.time
            },
            {
              type: 'text',
              text: options.location || 'our office'
            }
          ]
        }
      ];

      return await this.sendMessage({
        to: options.to,
        templateName: this.settings.meetingScheduleTemplate,
        components
      });
    } catch (error: any) {
      console.error('Error sending meeting schedule:', error);
      return {
        success: false,
        message: `Error sending meeting schedule: ${error.message}`
      };
    }
  }

  /**
   * Send a quotation
   */
  async sendQuotation(options: {
    to: string;
    customerName: string;
    quotationNumber: string;
    amount: string;
    documentUrl?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!await this.isConfigured()) {
        return { success: false, message: 'WhatsApp service is not configured' };
      }

      if (!this.settings) {
        return { success: false, message: 'WhatsApp settings not available' };
      }

      const components = [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: options.customerName
            },
            {
              type: 'text',
              text: options.quotationNumber
            },
            {
              type: 'text',
              text: options.amount
            }
          ]
        }
      ];

      // If document URL is provided, add header with document
      if (options.documentUrl) {
        return await this.sendMessage({
          to: options.to,
          templateName: this.settings.quotationTemplate,
          components,
          headerMediaUrl: options.documentUrl,
          headerMediaType: 'document'
        });
      }

      return await this.sendMessage({
        to: options.to,
        templateName: this.settings.quotationTemplate,
        components
      });
    } catch (error: any) {
      console.error('Error sending quotation:', error);
      return {
        success: false,
        message: `Error sending quotation: ${error.message}`
      };
    }
  }

  /**
   * Send a payment receipt
   */
  async sendPaymentReceipt(options: {
    to: string;
    customerName: string;
    receiptNumber: string;
    amount: string;
    documentUrl?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!await this.isConfigured()) {
        return { success: false, message: 'WhatsApp service is not configured' };
      }

      if (!this.settings) {
        return { success: false, message: 'WhatsApp settings not available' };
      }

      const components = [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: options.customerName
            },
            {
              type: 'text',
              text: options.receiptNumber
            },
            {
              type: 'text',
              text: options.amount
            }
          ]
        }
      ];

      // If document URL is provided, add header with document
      if (options.documentUrl) {
        return await this.sendMessage({
          to: options.to,
          templateName: this.settings.paymentReceiptTemplate,
          components,
          headerMediaUrl: options.documentUrl,
          headerMediaType: 'document'
        });
      }

      return await this.sendMessage({
        to: options.to,
        templateName: this.settings.paymentReceiptTemplate,
        components
      });
    } catch (error: any) {
      console.error('Error sending payment receipt:', error);
      return {
        success: false,
        message: `Error sending payment receipt: ${error.message}`
      };
    }
  }

  /**
   * Send an invoice
   */
  async sendInvoice(options: {
    to: string;
    customerName: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    documentUrl?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!await this.isConfigured()) {
        return { success: false, message: 'WhatsApp service is not configured' };
      }

      if (!this.settings) {
        return { success: false, message: 'WhatsApp settings not available' };
      }

      const components = [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: options.customerName
            },
            {
              type: 'text',
              text: options.invoiceNumber
            },
            {
              type: 'text',
              text: options.amount
            },
            {
              type: 'text',
              text: options.dueDate
            }
          ]
        }
      ];

      // If document URL is provided, add header with document
      if (options.documentUrl) {
        return await this.sendMessage({
          to: options.to,
          templateName: this.settings.invoiceTemplate,
          components,
          headerMediaUrl: options.documentUrl,
          headerMediaType: 'document'
        });
      }

      return await this.sendMessage({
        to: options.to,
        templateName: this.settings.invoiceTemplate,
        components
      });
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      return {
        success: false,
        message: `Error sending invoice: ${error.message}`
      };
    }
  }

  /**
   * Test WhatsApp connection
   */
  async testConnection(phoneNumber: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!await this.isConfigured()) {
        return { success: false, message: 'WhatsApp service is not configured' };
      }

      console.log('Testing WhatsApp connection...');
      
      const testResult = await this.sendMessage({
        to: phoneNumber,
        templateName: this.settings?.greetingTemplate || 'hello_world',
      });

      if (testResult.success) {
        return { 
          success: true, 
          message: 'WhatsApp connection test successful!',
          data: testResult.data
        };
      } else {
        return { 
          success: false, 
          message: `WhatsApp connection test failed: ${testResult.message}`,
          data: testResult.data
        };
      }
    } catch (error: any) {
      console.error('Error testing WhatsApp connection:', error);
      return {
        success: false,
        message: `Error testing WhatsApp connection: ${error.message}`
      };
    }
  }
}

export const whatsappService = new WhatsAppService();