import { useState } from "react";
import { Check, MessageSquare, Plus, Phone } from "lucide-react";
import { WhatsAppMessageButton } from "./WhatsAppMessageButton";
import { Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface WhatsAppCommunicationProps {
  customer: Customer;
}

export function WhatsAppCommunication({ customer }: WhatsAppCommunicationProps) {
  // Check if WhatsApp integration is enabled
  const { data: whatsappStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/whatsapp/status"],
    retry: 1,
  });

  if (!whatsappStatus?.configured) {
    return null;
  }

  if (!customer.phone) {
    return (
      <div className="text-sm italic text-muted-foreground">
        No phone number available for WhatsApp communication.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">WhatsApp Communication</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Send Message
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Message Types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
              <WhatsAppMessageButton
                customerPhone={customer.phone}
                customerName={customer.name}
                messageType="greeting"
                dialogTitle="Send Greeting"
                dialogDescription="Send a welcome message to this customer."
                successMessage="Greeting message sent successfully"
                className="w-full justify-start cursor-pointer"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Greeting
              </WhatsAppMessageButton>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <WhatsAppMessageButton
                customerPhone={customer.phone}
                customerName={customer.name}
                messageType="layout-request"
                dialogTitle="Send Layout Request"
                dialogDescription="Request layout details from the customer."
                successMessage="Layout request sent successfully"
                className="w-full justify-start cursor-pointer"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Request Layout
              </WhatsAppMessageButton>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <WhatsAppMessageButton
                customerPhone={customer.phone}
                customerName={customer.name}
                messageType="showroom-visit"
                dialogTitle="Invite to Showroom"
                dialogDescription="Invite the customer to visit your showroom."
                successMessage="Showroom visit invitation sent successfully"
                className="w-full justify-start cursor-pointer"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Invite to Showroom
              </WhatsAppMessageButton>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <WhatsAppMessageButton
                customerPhone={customer.phone}
                customerName={customer.name}
                messageType="missed-call"
                dialogTitle="Missed Call Notification"
                dialogDescription="Notify the customer about a missed call."
                successMessage="Missed call notification sent successfully"
                className="w-full justify-start cursor-pointer"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Missed Call Notification
              </WhatsAppMessageButton>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <WhatsAppMessageButton
                customerPhone={customer.phone}
                customerName={customer.name}
                messageType="meeting-schedule"
                dialogTitle="Schedule Meeting"
                dialogDescription="Send meeting schedule details to the customer."
                successMessage="Meeting schedule sent successfully"
                additionalParams={{
                  date: format(new Date(), 'PPP'),
                  time: format(new Date(), 'p'),
                  location: 'our office'
                }}
                className="w-full justify-start cursor-pointer"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Schedule Meeting
              </WhatsAppMessageButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="text-sm">
        <p className="flex items-center mb-1">
          <Phone className="h-4 w-4 mr-2 text-green-600" />
          <span>Send WhatsApp messages to <strong>{customer.phone}</strong></span>
        </p>
        <p className="text-muted-foreground">
          Use WhatsApp to communicate with the customer about quotations, invoices, and payments.
        </p>
      </div>
    </div>
  );
}