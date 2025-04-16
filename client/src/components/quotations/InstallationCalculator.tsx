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

interface InstallationCalculatorProps {
  roomId: number;
  charge?: InstallationCharge | null;
  onSaveSuccess?: () => void;
}

export default function InstallationCalculator({
  roomId,
  charge,
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
    mutationFn: async (data: InstallationCharge) => {
      try {
        // API endpoint will differ depending on whether we're creating or updating
        const endpoint = charge?.id 
          ? `/api/installation-charges/${charge.id}` 
          : `/api/installation-charges`;
        
        const method = charge?.id ? "PUT" : "POST";
        
        const response = await apiRequest(method, endpoint, data);
        return await response.json();
      } catch (error) {
        console.error("Installation charge error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
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
    if (!calculatedArea || !calculatedAmount) {
      toast({
        title: "Error",
        description: "Please provide valid dimensions.",
        variant: "destructive",
      });
      return;
    }

    const installationChargeData: InstallationCharge = {
      id: charge?.id,
      roomId: roomId,
      cabinetType: data.cabinetType,
      widthMm: parseFloat(data.widthMm),
      heightMm: parseFloat(data.heightMm),
      areaSqft: calculatedArea,
      pricePerSqft: parseFloat(data.pricePerSqft),
      amount: calculatedAmount
    };

    installationMutation.mutate(installationChargeData);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="cabinetType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of cabinets</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter type of cabinets (e.g., Kitchen, Wardrobe)"
                    className="resize-none min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="widthMm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Width in mm" 
                      {...field} 
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
                      type="number" 
                      placeholder="Height in mm" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
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