import { useState } from "react";
import { MessageSquare } from "lucide-react";
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

interface WhatsAppDocumentButtonProps extends ButtonProps {
  customerPhone: string;
  customerName: string;
  documentType: 'quotation' | 'payment-receipt' | 'invoice';
  documentNumber: string;
  amount: string | number;
  label?: string;
  documentUrl?: string;
  dueDate?: string; // Only required for invoices
  dialogTitle?: string;
  dialogDescription?: string;
  successMessage?: string;
}

export function WhatsAppDocumentButton({
  customerPhone,
  customerName,
  documentType,
  documentNumber,
  amount,
  label,
  documentUrl,
  dueDate,
  dialogTitle,
  dialogDescription,
  successMessage,
  ...props
}: WhatsAppDocumentButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Set default values based on document type
  const getDefaults = () => {
    const amountString = typeof amount === 'number' ? `Rs. ${amount.toLocaleString()}` : amount;
    
    switch (documentType) {
      case 'quotation':
        return {
          label: label || "Send Quotation via WhatsApp",
          dialogTitle: dialogTitle || "Send Quotation via WhatsApp",
          dialogDescription: dialogDescription || "Send this quotation to the customer via WhatsApp.",
          successMessage: successMessage || "Quotation sent successfully via WhatsApp"
        };
      case 'payment-receipt':
        return {
          label: label || "Send Receipt via WhatsApp",
          dialogTitle: dialogTitle || "Send Payment Receipt via WhatsApp",
          dialogDescription: dialogDescription || "Send this payment receipt to the customer via WhatsApp.",
          successMessage: successMessage || "Payment receipt sent successfully via WhatsApp"
        };
      case 'invoice':
        return {
          label: label || "Send Invoice via WhatsApp",
          dialogTitle: dialogTitle || "Send Invoice via WhatsApp",
          dialogDescription: dialogDescription || "Send this invoice to the customer via WhatsApp.",
          successMessage: successMessage || "Invoice sent successfully via WhatsApp"
        };
      default:
        return {
          label: "Send via WhatsApp",
          dialogTitle: "Send via WhatsApp",
          dialogDescription: "Send this document to the customer via WhatsApp.",
          successMessage: "Document sent successfully via WhatsApp"
        };
    }
  };

  const defaults = getDefaults();
  const finalLabel = label || defaults.label;
  const finalDialogTitle = dialogTitle || defaults.dialogTitle;
  const finalDialogDescription = dialogDescription || defaults.dialogDescription;
  const finalSuccessMessage = successMessage || defaults.successMessage;

  const sendDocument = async () => {
    if (!customerPhone || !customerName || !documentNumber || !amount) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    if (documentType === 'invoice' && !dueDate) {
      toast({
        title: "Error",
        description: "Due date is required for invoices",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Construct the API endpoint based on document type
      const endpoint = getEndpointByType(documentType);
      
      // Format amount as string with currency
      const amountString = typeof amount === 'number' ? `Rs. ${amount.toLocaleString()}` : amount;
      
      // Construct request body
      const requestBody: any = {
        phone: customerPhone,
        customerName,
        amount: amountString,
        documentUrl
      };

      // Add document-specific fields
      if (documentType === 'quotation') {
        requestBody.quotationNumber = documentNumber;
      } else if (documentType === 'payment-receipt') {
        requestBody.receiptNumber = documentNumber;
      } else if (documentType === 'invoice') {
        requestBody.invoiceNumber = documentNumber;
        requestBody.dueDate = dueDate;
      }

      const response = await apiRequest("POST", endpoint, requestBody);
      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: finalSuccessMessage,
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
      case 'quotation':
        return '/api/whatsapp/send-quotation';
      case 'payment-receipt':
        return '/api/whatsapp/send-payment-receipt';
      case 'invoice':
        return '/api/whatsapp/send-invoice';
      default:
        return '/api/whatsapp/send-quotation';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2" {...props}>
          <MessageSquare className="h-4 w-4" />
          {finalLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{finalDialogTitle}</DialogTitle>
          <DialogDescription>{finalDialogDescription}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="space-y-2">
              <p><strong>Customer:</strong> {customerName}</p>
              <p><strong>Phone:</strong> {customerPhone}</p>
              <p>
                <strong>
                  {documentType === 'quotation' ? 'Quotation' : 
                   documentType === 'payment-receipt' ? 'Receipt' : 'Invoice'} Number:
                </strong> {documentNumber}
              </p>
              <p><strong>Amount:</strong> {typeof amount === 'number' ? `Rs. ${amount.toLocaleString()}` : amount}</p>
              {documentType === 'invoice' && dueDate && (
                <p><strong>Due Date:</strong> {dueDate}</p>
              )}
              {documentUrl ? (
                <p><strong>Document:</strong> PDF will be attached</p>
              ) : (
                <p className="text-yellow-600"><strong>Note:</strong> No PDF document will be attached</p>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={sendDocument} disabled={isSending}>
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