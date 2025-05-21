import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppSettingsProps {
  form: any;
}

export function WhatsAppSettings({ form }: WhatsAppSettingsProps) {
  const { toast } = useToast();
  const [isCheckingWhatsApp, setIsCheckingWhatsApp] = useState(false);

  const checkWhatsAppConfig = async () => {
    const phoneNumber = prompt("Enter a phone number to test WhatsApp connection:");
    if (!phoneNumber) return;
    
    setIsCheckingWhatsApp(true);
    try {
      const response = await fetch(`/api/whatsapp/test-connection?phoneNumber=${encodeURIComponent(phoneNumber)}`);
      const data = await response.json();
      
      toast({
        title: data.success ? "WhatsApp Configured" : "WhatsApp Connection Failed",
        description: data.success ? 
          "Your WhatsApp settings are working correctly." : 
          `WhatsApp configuration failed: ${data.message}`,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check WhatsApp configuration",
        variant: "destructive",
      });
    } finally {
      setIsCheckingWhatsApp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium mb-2">WhatsApp Integration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure WhatsApp Business API settings to enable sending messages, quotations, invoices, and payment receipts directly to customers via WhatsApp.
        </p>
        
        <FormField
          control={form.control}
          name="whatsappEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Enable WhatsApp Integration</FormLabel>
                <FormDescription>
                  Turn on WhatsApp integration to send messages to customers
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">WhatsApp API Configuration</h3>
        <Button
          variant="outline"
          onClick={checkWhatsAppConfig}
          disabled={isCheckingWhatsApp || !form.getValues('whatsappPhoneNumberId') || !form.getValues('whatsappAccessToken')}
        >
          {isCheckingWhatsApp ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>Test Connection</>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="whatsappPhoneNumberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number ID</FormLabel>
              <FormControl>
                <Input 
                  placeholder="1234567890123456" 
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Your WhatsApp Business API Phone Number ID from Meta Business Platform
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="whatsappBusinessAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Account ID</FormLabel>
              <FormControl>
                <Input 
                  placeholder="1234567890123456" 
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Your WhatsApp Business Account ID
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="col-span-1 md:col-span-2">
          <FormField
            control={form.control}
            name="whatsappAccessToken"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Access Token</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Enter your WhatsApp API access token" 
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Your WhatsApp Business API Permanent Access Token
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium mb-4">Message Templates</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure the WhatsApp message templates to be used for different types of messages. 
          These templates must be created and approved in your Meta Business Manager account first.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="whatsappGreetingTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Greeting Template</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="hello_world" 
                    {...field}
                    value={field.value || "hello_world"}
                  />
                </FormControl>
                <FormDescription>
                  Template for greeting new customers
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="whatsappLayoutRequestTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Layout Request Template</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="layout_request" 
                    {...field}
                    value={field.value || "layout_request"}
                  />
                </FormControl>
                <FormDescription>
                  Template for requesting layout details
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="whatsappShowroomVisitTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Showroom Visit Template</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="showroom_visit" 
                    {...field}
                    value={field.value || "showroom_visit"}
                  />
                </FormControl>
                <FormDescription>
                  Template for inviting customers to visit showroom
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="whatsappMissedCallTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Missed Call Template</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="missed_call" 
                    {...field}
                    value={field.value || "missed_call"}
                  />
                </FormControl>
                <FormDescription>
                  Template for notifying missed calls
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="whatsappMeetingScheduleTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Schedule Template</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="meeting_schedule" 
                    {...field}
                    value={field.value || "meeting_schedule"}
                  />
                </FormControl>
                <FormDescription>
                  Template for scheduling meetings
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="whatsappQuotationTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quotation Template</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="quotation_send" 
                    {...field}
                    value={field.value || "quotation_send"}
                  />
                </FormControl>
                <FormDescription>
                  Template for sending quotations
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="whatsappPaymentReceiptTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Receipt Template</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="payment_receipt" 
                    {...field}
                    value={field.value || "payment_receipt"}
                  />
                </FormControl>
                <FormDescription>
                  Template for sending payment receipts
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="whatsappInvoiceTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Template</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="invoice_send" 
                    {...field}
                    value={field.value || "invoice_send"}
                  />
                </FormControl>
                <FormDescription>
                  Template for sending invoices
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}