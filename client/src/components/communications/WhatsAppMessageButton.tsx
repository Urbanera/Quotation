import { useState } from "react";
import { Send } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface WhatsAppMessageButtonProps extends ButtonProps {
  customerPhone: string;
  customerName: string;
  messageType: 'greeting' | 'layout-request' | 'showroom-visit' | 'missed-call' | 'meeting-schedule';
  label?: string;
  dialogTitle: string;
  dialogDescription: string;
  successMessage: string;
  additionalParams?: Record<string, any>;
}

export function WhatsAppMessageButton({
  customerPhone,
  customerName,
  messageType,
  label = "Send WhatsApp",
  dialogTitle,
  dialogDescription,
  successMessage,
  additionalParams = {},
  ...props
}: WhatsAppMessageButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async () => {
    if (!customerPhone || !customerName) {
      toast({
        title: "Error",
        description: "Customer phone or name is missing",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Construct the API endpoint based on message type
      const endpoint = getEndpointByType(messageType);
      
      // Construct request body with customer info and additional params
      const requestBody = {
        phone: customerPhone,
        customerName,
        ...additionalParams,
      };

      const response = await apiRequest("POST", endpoint, requestBody);
      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: successMessage,
        });
        setIsOpen(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send WhatsApp message",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send WhatsApp message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getEndpointByType = (type: string) => {
    switch (type) {
      case 'greeting':
        return '/api/whatsapp/send-greeting';
      case 'layout-request':
        return '/api/whatsapp/send-layout-request';
      case 'showroom-visit':
        return '/api/whatsapp/send-showroom-visit';
      case 'missed-call':
        return '/api/whatsapp/send-missed-call';
      case 'meeting-schedule':
        return '/api/whatsapp/send-meeting-schedule';
      default:
        return '/api/whatsapp/send-greeting';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2" {...props}>
          <Send className="h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="space-y-2">
              <p><strong>Customer:</strong> {customerName}</p>
              <p><strong>Phone:</strong> {customerPhone}</p>
              {Object.entries(additionalParams).map(([key, value]) => (
                <p key={key}><strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}</p>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={sendMessage} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}