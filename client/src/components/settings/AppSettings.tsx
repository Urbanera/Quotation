import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppSettings, InsertAppSettings, appSettingsFormSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function AppSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  
  // Email connect check
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Fetch app settings
  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ["/api/settings/app"],
    retry: 1,
  });

  // Set up form
  const form = useForm<InsertAppSettings>({
    resolver: zodResolver(appSettingsFormSchema),
    defaultValues: {
      defaultGlobalDiscount: 0,
      defaultGstPercentage: 18,
      defaultTermsAndConditions: "",
      receiptTermsAndConditions: "",
      quotationTemplateId: "default",
      presentationTemplateId: "default",
      requiredAccessories: "skirting,handles,sliding mechanism,t profile",
      leadSourceOptions: "walk-in,website,referral,social media,other",
      // Email settings
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: "",
      smtpPassword: "",
      emailFrom: "",
      emailReplyTo: "",
      emailFooter: "",
      emailEnabled: false,
    },
    values: settings || undefined,
  });

  const checkEmailConfig = async () => {
    setIsCheckingEmail(true);
    try {
      const response = await fetch('/api/email/test-connection');
      const data = await response.json();
      
      toast({
        title: data.success ? "Email Configured" : "Email Connection Failed",
        description: data.success ? 
          "Your email settings are working correctly." : 
          `Email configuration failed: ${data.message}`,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check email configuration",
        variant: "destructive",
      });
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Update app settings mutation
  const mutation = useMutation({
    mutationFn: async (data: InsertAppSettings) => {
      const res = await apiRequest("PUT", "/api/settings/app", data);
      return (await res.json()) as AppSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/app"] });
      toast({
        title: "Success",
        description: "Application settings updated successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update application settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(data: InsertAppSettings) {
    mutation.mutate(data);
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading application settings...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>App Settings</CardTitle>
        <CardDescription>
          Configure application settings including quotation defaults, terms and conditions, and email configuration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
                <TabsTrigger value="email">Email Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="defaultGlobalDiscount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Global Discount (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="Default Global Discount" 
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Default discount percentage for all new quotations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                  <FormField
                    control={form.control}
                    name="defaultGstPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default GST Percentage (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="Default GST Percentage" 
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Default GST percentage for all new quotations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="quotationTemplateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Quotation Template</FormLabel>
                        <Select 
                          defaultValue={field.value || "default"}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="default">Standard Template</SelectItem>
                            <SelectItem value="modern">Modern Template</SelectItem>
                            <SelectItem value="premium">Premium Template</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Template used for basic quotation PDFs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="presentationTemplateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Presentation Template</FormLabel>
                        <Select 
                          defaultValue={field.value || "default"}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="default">Standard Presentation</SelectItem>
                            <SelectItem value="elegant">Elegant Presentation</SelectItem>
                            <SelectItem value="premium">Premium Presentation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Template used for presentation quotation PDFs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="requiredAccessories"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Required Accessories</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="skirting,handles,sliding mechanism,t profile" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of accessories to highlight in quotations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="leadSourceOptions"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Lead Source Options</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="walk-in,website,referral,social media,other" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of lead sources available in customer forms. These values will appear in the lead source dropdown when creating or editing customers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="terms" className="space-y-6">
                <FormField
                  control={form.control}
                  name="defaultTermsAndConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Quotation Terms & Conditions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter default terms and conditions for all quotations"
                          className="min-h-32"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        These terms will be added to all new quotations automatically
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="presentationTermsAndConditions"
                  render={({ field }) => (
                    <FormItem className="border p-4 rounded-md bg-muted/30">
                      <FormLabel className="text-lg font-medium">Presentation Quote Terms & Conditions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter terms and conditions for presentation quotations"
                          className="min-h-32"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        These terms will appear on the last page of presentation quotations. They will be displayed in a formatted section and should include detailed scope of work, payment terms, delivery terms, and other legal information.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="receiptTermsAndConditions"
                  render={({ field }) => (
                    <FormItem className="border p-4 rounded-md bg-muted/30">
                      <FormLabel className="text-lg font-medium">Payment Receipt Terms & Conditions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter terms and conditions for payment receipts"
                          className="min-h-32"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        These terms will appear on all payment receipts. They will be displayed in a highlighted section at the bottom of the receipt and should include important information about refund policies, payment acknowledgments, or other legal terms.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="email" className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-md mb-6">
                  <h3 className="text-lg font-medium mb-2">Email Configuration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure email settings to enable sending quotations, invoices, and payment receipts directly from the application.
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="emailEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Enable Email Functionality</FormLabel>
                          <FormDescription>
                            Turn on email functionality to allow sending emails from the application
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="smtpHost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Server</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="smtp.example.com" 
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Your email service provider's SMTP server address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="smtpPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="587" 
                            {...field}
                            value={field.value || 587}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                          />
                        </FormControl>
                        <FormDescription>
                          SMTP port (usually 587 for TLS or 465 for SSL)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="smtpSecure"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Use Secure Connection (SSL)</FormLabel>
                          <FormDescription>
                            Enable for SSL connections (usually port 465)
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
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="smtpUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="your-email@example.com" 
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Usually your email address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="smtpPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="•••••••••" 
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Your email account password or app-specific password
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <FormField
                    control={form.control}
                    name="emailFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="your-company@example.com" 
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          The email address that will appear as the sender
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emailReplyTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reply-To Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="support@example.com" 
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Email address customers should reply to (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="emailFooter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Footer Text</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Thank you for choosing our services. If you have any questions, please contact us."
                          className="min-h-24"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        This text will appear at the bottom of all emails sent from the system
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between items-center pt-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={checkEmailConfig}
                    disabled={isCheckingEmail || !form.getValues("emailEnabled")}
                  >
                    {isCheckingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCheckingEmail ? "Testing Connection..." : "Test Email Connection"}
                  </Button>
                  <FormDescription className="text-sm text-muted-foreground">
                    Save your settings before testing the connection
                  </FormDescription>
                </div>
              </TabsContent>
            </Tabs>
            
            <Button 
              type="submit" 
              className="w-full md:w-auto mt-6"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}