import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  className,
  id
}: WhatsAppQuotationButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState<string>("template");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [whatsAppStatus, setWhatsAppStatus] = useState<{configured: boolean}>({configured: false});
  const { toast } = useToast();
  
  // Format amount for display
  const amountFormatted = typeof amount === 'number'
    ? `Rs. ${amount.toLocaleString()}`
    : amount;
    
  // Check WhatsApp configuration status when the component mounts
  useEffect(() => {
    const checkWhatsAppStatus = async () => {
      try {
        const response = await fetch('/api/whatsapp/status');
        const data = await response.json();
        setWhatsAppStatus(data);
        
        // Set default custom message
        setCustomMessage(`Hello ${customerName}, your quotation ${quotationNumber} of amount ${amountFormatted} is ready. Thank you for choosing our services!`);
      } catch (error) {
        console.error('Error checking WhatsApp status:', error);
      }
    };
    
    if (isOpen) {
      checkWhatsAppStatus();
    }
  }, [isOpen, customerName, quotationNumber, amountFormatted]);

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
      if (whatsAppStatus.configured && messageType === "template") {
        // Use WhatsApp Business API with selected template
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
        // Use direct WhatsApp link with custom message
        const message = messageType === "custom" ? customMessage : 
          `Hello ${customerName}, your quotation ${quotationNumber} of amount ${amountFormatted} is ready. Thank you for choosing our services!`;
        
        const encodedMessage = encodeURIComponent(message);
        const cleanedPhone = customerPhone.replace(/\D/g, '');
        // Make sure phone number is properly formatted, adding default country code (91 for India) if needed
        const phoneWithCountryCode = cleanedPhone.startsWith('91') ? cleanedPhone : `91${cleanedPhone}`;
        const url = `https://wa.me/${phoneWithCountryCode}?text=${encodedMessage}`;
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
        id={id}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Send via WhatsApp
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Quotation via WhatsApp</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-5">
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
              
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h4 className="text-sm font-medium mb-3">Message Type</h4>
                  <RadioGroup 
                    value={messageType} 
                    onValueChange={setMessageType}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="template" id="template" />
                      <Label htmlFor="template" className="cursor-pointer">
                        Use Template Message {whatsAppStatus.configured ? 
                          "(WhatsApp Business API)" : 
                          "(Not Available - API not configured)"}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="cursor-pointer">Use Custom Message</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {messageType === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="customMessage">Custom Message</Label>
                    <Input
                      id="customMessage"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="h-24"
                      placeholder="Enter your custom message here..."
                    />
                  </div>
                )}
                
                <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm text-amber-800">
                    {!whatsAppStatus.configured && messageType === "template" ? (
                      "WhatsApp Business API is not configured. The message will be sent via direct WhatsApp link instead."
                    ) : messageType === "template" ? (
                      "This will send the quotation using your configured WhatsApp Business API template."
                    ) : (
                      "This will open WhatsApp with your custom message ready to send."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={sendQuotationViaWhatsApp} 
              disabled={isLoading || (messageType === "custom" && !customMessage.trim())}
              className="bg-green-600 hover:bg-green-700"
            >
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