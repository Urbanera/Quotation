import { useState, useEffect, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { installationFormSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface InstallationCalculatorProps {
  roomId: number;
  installDescription?: string | null;
  widthMm?: number | null;
  heightMm?: number | null;
  areaSqft?: number | null;
  pricePerSqft?: number | null;
  installAmount?: number | null;
}

export default function InstallationCalculator({
  roomId,
  installDescription,
  widthMm,
  heightMm,
  areaSqft,
  pricePerSqft,
  installAmount
}: InstallationCalculatorProps) {
  const { toast } = useToast();
  const initialArea = areaSqft !== undefined && areaSqft !== null ? areaSqft : null;
  const initialAmount = installAmount !== undefined && installAmount !== null ? installAmount : null;
  
  const [calculatedArea, setCalculatedArea] = useState<number | null>(initialArea);
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(initialAmount);

  // Initialize form with default values
  const form = useForm<z.infer<typeof installationFormSchema>>({
    resolver: zodResolver(installationFormSchema),
    defaultValues: {
      installDescription: installDescription || "",
      widthMm: widthMm?.toString() || "",
      heightMm: heightMm?.toString() || "",
      pricePerSqft: pricePerSqft?.toString() || "130",
    },
  });

  // Update installation mutation
  const updateInstallationMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Get the current room data first
        const roomResponse = await apiRequest("GET", `/api/rooms/${roomId}`);
        const roomData = await roomResponse.json();
        
        // Use a regular room update instead of a specialized installation endpoint
        const response = await apiRequest("PUT", `/api/rooms/${roomId}`, {
          name: roomData.name,
          quotationId: roomData.quotationId,
          description: roomData.description || "",
          order: roomData.order,
          // Update installation fields
          installDescription: data.installDescription,
          widthMm: data.widthMm ? parseInt(data.widthMm, 10) : null,
          heightMm: data.heightMm ? parseInt(data.heightMm, 10) : null,
          areaSqft: data.areaSqft,
          pricePerSqft: data.pricePerSqft ? parseFloat(data.pricePerSqft) : 130,
          installAmount: data.installAmount
        });
        return await response.json();
      } catch (error) {
        console.error("Installation update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({
        title: "Installation charges updated",
        description: "Installation charges have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: "Failed to update installation charges.",
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

    updateInstallationMutation.mutate({
      installDescription: data.installDescription,
      widthMm: parseFloat(data.widthMm || "0"),
      heightMm: parseFloat(data.heightMm || "0"),
      areaSqft: calculatedArea,
      pricePerSqft: parseFloat(data.pricePerSqft || "130"),
      installAmount: calculatedAmount
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Installation & Handling Charges</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="installDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter installation description"
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
              disabled={updateInstallationMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {updateInstallationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Installation Charges
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}