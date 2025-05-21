import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface WhatsAppQuotationButtonProps {
  quotationId: number;
  quotationNumber: string;
  customerName: string;
  customerPhone: string;
  amount: string | number;
  className?: string;
  id?: string;
}

export const WhatsAppQuotationButton = ({
  quotationId,
  quotationNumber,
  customerName,
  customerPhone,
  amount,
  className
}: WhatsAppQuotationButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const amountFormatted = typeof amount === 'number'
    ? `Rs. ${amount.toLocaleString()}`
    : amount;

  const sendQuotationViaWhatsApp = async () => {
    if (!customerPhone) {
      toast({
        title: "Error",
        description: "Customer phone number is missing",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Option 1: Use WhatsApp Business API (if configured)
      const response = await fetch(`/api/whatsapp/status`);
      const whatsAppData = await response.json();
      
      if (whatsAppData.configured) {
        // Use WhatsApp Business API
        const apiResponse = await apiRequest("POST", "/api/whatsapp/send-quotation", {
          phone: customerPhone,
          customerName,
          quotationNumber,
          amount: amountFormatted
        });
        
        if (apiResponse.ok) {
          toast({
            title: "Success",
            description: "Quotation sent successfully via WhatsApp"
          });
          setIsOpen(false);
        } else {
          const errorData = await apiResponse.json();
          throw new Error(errorData.message || "Failed to send quotation");
        }
      } else {
        // Fallback: Use direct WhatsApp link
        const message = `Hello ${customerName}, your quotation ${quotationNumber} of amount ${amountFormatted} is ready. Thank you for choosing our services!`;
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodedMessage}`;
        window.open(url, '_blank');
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error sending quotation via WhatsApp:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send quotation via WhatsApp",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className={`${className || ''}`}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Send via WhatsApp
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quotation via WhatsApp</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Customer:</p>
                  <p className="text-sm">{customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone:</p>
                  <p className="text-sm">{customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Quotation:</p>
                  <p className="text-sm">{quotationNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Amount:</p>
                  <p className="text-sm">{amountFormatted}</p>
                </div>
              </div>
              
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm">
                  This will send the quotation information to the customer via WhatsApp.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendQuotationViaWhatsApp} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Quotation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};