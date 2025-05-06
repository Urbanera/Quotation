import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { InstallationCharge, installationFormSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Function to evaluate a mathematical expression string (e.g. "500+500+300")
function evaluateExpression(expression: string): number | null {
  try {
    // Clean the input - remove all characters except numbers, +, -, *, /, ., and ()
    const cleanedExpression = expression.replace(/[^0-9+\-*/().]/g, '');
    
    // If the expression is empty after cleaning, return null
    if (!cleanedExpression) return null;
    
    // Use Function constructor to evaluate the expression
    // This is generally safe for user input that's been sanitized to only include valid math symbols
    const result = new Function(`return ${cleanedExpression}`)();
    
    // Check if the result is a valid number
    if (isNaN(result) || !isFinite(result)) return null;
    
    return result;
  } catch (error) {
    // If there's any error in evaluation, return null
    return null;
  }
}

interface InstallationCalculatorProps {
  roomId: number;
  charge?: InstallationCharge | null;
  quotationId?: number;
  onSaveSuccess?: () => void;
}

export default function InstallationCalculator({
  roomId,
  charge,
  quotationId,
  onSaveSuccess
}: InstallationCalculatorProps) {
  const { toast } = useToast();
  const initialArea = charge?.areaSqft || null;
  const initialAmount = charge?.amount || null;
  
  const [calculatedArea, setCalculatedArea] = useState<number | null>(initialArea);
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(initialAmount);

  // Initialize form with default values
  const form = useForm<z.infer<typeof installationFormSchema>>({
    resolver: zodResolver(installationFormSchema),
    defaultValues: {
      cabinetType: charge?.cabinetType || "",
      widthMm: charge?.widthMm?.toString() || "",
      heightMm: charge?.heightMm?.toString() || "",
      pricePerSqft: charge?.pricePerSqft?.toString() || "130",
    },
  });

  // Create or update installation charge mutation
  const installationMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // API endpoint will differ depending on whether we're creating or updating
        const endpoint = charge?.id 
          ? `/api/installation-charges/${charge.id}` 
          : `/api/rooms/${roomId}/installation-charges`;
        
        const method = charge?.id ? "PUT" : "POST";
        
        const response = await apiRequest(method, endpoint, data);
        return await response.json();
      } catch (error) {
        console.error("Installation charge error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      const dataQuotationId = data.quotationId;
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      
      // Invalidate the installation charges query for this quotation
      // Use the passed quotationId first, then fall back to the data.quotationId
      if (quotationId) {
        queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}/installation-charges`] });
        queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}/details`] });
      } else if (dataQuotationId) {
        queryClient.invalidateQueries({ queryKey: [`/api/quotations/${dataQuotationId}/installation-charges`] });
        queryClient.invalidateQueries({ queryKey: [`/api/quotations/${dataQuotationId}/details`] });
      }
      toast({
        title: "Installation charge saved",
        description: "The installation charge has been saved successfully.",
      });
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to save installation charge.",
        variant: "destructive",
      });
    }
  });

  // Calculate area and amount when width, height or price per sqft changes
  useEffect(() => {
    const widthMmValue = form.watch("widthMm");
    const heightMmValue = form.watch("heightMm");
    const pricePerSqftValue = form.watch("pricePerSqft");

    const width = parseFloat(widthMmValue || "0");
    const height = parseFloat(heightMmValue || "0");
    const pricePerSqft = parseFloat(pricePerSqftValue || "130");

    if (width > 0 && height > 0) {
      // Convert mm to sq.ft (1 sq.ft = 92,903.04 sq.mm)
      const areaSqft = (width * height) / 92903.04;
      setCalculatedArea(areaSqft);
      setCalculatedAmount(areaSqft * pricePerSqft);
    } else {
      setCalculatedArea(null);
      setCalculatedAmount(null);
    }
  }, [form.watch("widthMm"), form.watch("heightMm"), form.watch("pricePerSqft")]);

  const onSubmit = (data: z.infer<typeof installationFormSchema>) => {
    // Evaluate expressions in width and height if they contain math operators
    let widthValue = data.widthMm;
    let heightValue = data.heightMm;
    
    // Process width if it contains math operators
    if (typeof widthValue === 'string' && /[\+\-\*\/]/.test(widthValue)) {
      const evaluatedWidth = evaluateExpression(widthValue);
      if (evaluatedWidth !== null) {
        widthValue = evaluatedWidth.toString();
      }
    }
    
    // Process height if it contains math operators
    if (typeof heightValue === 'string' && /[\+\-\*\/]/.test(heightValue)) {
      const evaluatedHeight = evaluateExpression(heightValue);
      if (evaluatedHeight !== null) {
        heightValue = evaluatedHeight.toString();
      }
    }
    
    // Check if we have valid calculated area and amount
    if (!calculatedArea || !calculatedAmount) {
      toast({
        title: "Error",
        description: "Please provide valid dimensions.",
        variant: "destructive",
      });
      return;
    }

    // After the validation passes, the Storage layer will convert strings to numbers
    // So we only need to ensure all required fields are present
    const formattedData: any = {
      cabinetType: data.cabinetType,
      widthMm: widthValue,          // String for validation
      heightMm: heightValue,        // String for validation
      pricePerSqft: data.pricePerSqft,  // String for validation
      areaSqft: calculatedArea,      // Number for storage
      amount: calculatedAmount       // Number for storage
    };
    
    // Include the ID if we're updating
    if (charge?.id) {
      formattedData.id = charge.id;
    }

    installationMutation.mutate(formattedData);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="cabinetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of cabinets</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Cabinet type"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="widthMm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder="Width (e.g. 500+500+300)" 
                      {...field} 
                      onChange={(e) => {
                        // Just update the form value with the raw input without evaluating
                        field.onChange(e.target.value);
                      }}
                      onBlur={(e) => {
                        // When the field loses focus, evaluate the expression if it contains operators
                        if (/[\+\-\*\/]/.test(e.target.value)) {
                          // Try to evaluate the expression
                          const result = evaluateExpression(e.target.value);
                          if (result !== null) {
                            // If evaluation succeeds, update the form value with the result
                            field.onChange(result.toString());
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="heightMm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder="Height (e.g. 1200+400)" 
                      {...field} 
                      onChange={(e) => {
                        // Just update the form value with the raw input without evaluating
                        field.onChange(e.target.value);
                      }}
                      onBlur={(e) => {
                        // When the field loses focus, evaluate the expression if it contains operators
                        if (/[\+\-\*\/]/.test(e.target.value)) {
                          // Try to evaluate the expression
                          const result = evaluateExpression(e.target.value);
                          if (result !== null) {
                            // If evaluation succeeds, update the form value with the result
                            field.onChange(result.toString());
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="pricePerSqft"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per sq.ft (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Price per sq.ft" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area (sq.ft)
              </label>
              <Input
                type="text"
                value={calculatedArea ? calculatedArea.toFixed(2) : ""}
                readOnly
                className="bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <Input
                type="text"
                value={calculatedAmount ? calculatedAmount.toFixed(2) : ""}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={installationMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {installationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Installation Charge
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}