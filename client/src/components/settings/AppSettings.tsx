import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppSettings, InsertAppSettings, appSettingsFormSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AppSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      quotationTemplateId: "default",
      presentationTemplateId: "default",
    },
    values: settings || undefined,
  });

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
        description: "Quotation settings updated successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update quotation settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(data: InsertAppSettings) {
    mutation.mutate(data);
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading quotation settings...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quotation Settings</CardTitle>
        <CardDescription>
          Set default values for new quotations and presentation templates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        value={field.value.toString()}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      This discount will be applied to all new quotations by default
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
                        value={field.value.toString()}
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
                      defaultValue={field.value}
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
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="default">Standard Presentation</SelectItem>
                        <SelectItem value="premium">Premium Presentation</SelectItem>
                        <SelectItem value="catalog">Catalog Style</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Template used for presentation PDFs with images
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="defaultTermsAndConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter default terms and conditions for all quotations"
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These terms will be added to all new quotations automatically
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full md:w-auto"
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
