import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Accessory } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define schema for accessory form
const accessoryFormSchema = z.object({
  name: z.string().min(1, "Accessory name is required"),
  description: z.string().optional(),
  sellingPrice: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 
    { message: "Selling price must be a positive number" }
  ),
  quantity: z.string().refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) >= 1,
    { message: "Quantity must be at least 1" }
  ).default("1"),
  discount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    { message: "Discount must be a positive number" }
  ).default("0"),
  discountType: z.enum(["percentage", "fixed"]).default("percentage")
});

interface AccessoryFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  defaultValues?: Accessory;
  isEdit?: boolean;
}

export default function AccessoryForm({ 
  onSubmit, 
  isSubmitting, 
  defaultValues,
  isEdit = false 
}: AccessoryFormProps) {
  // Get the discount type with type safety
  const getDiscountType = (): "percentage" | "fixed" => {
    if (defaultValues?.discountType === "fixed") return "fixed";
    return "percentage"; // Default
  };

  // Initialize form with default values
  const form = useForm<z.infer<typeof accessoryFormSchema>>({
    resolver: zodResolver(accessoryFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      sellingPrice: defaultValues?.sellingPrice?.toString() || "",
      quantity: defaultValues?.quantity?.toString() || "1",
      discount: defaultValues?.discount?.toString() || "0",
      discountType: getDiscountType(),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accessory Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter accessory name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter accessory description" 
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
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₹)</FormLabel>
                <FormControl>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <Input 
                      placeholder="0.00"
                      className="pl-7"
                      type="number"
                      step="0.01"
                      min="0"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="1"
                    type="number"
                    min="1"
                    step="1"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Discount Fields */}
        <div className="border rounded-md p-4 bg-gray-50">
          <h3 className="text-sm font-medium mb-3">Discount Settings</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Type</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percentage" id="percentage" />
                        <Label htmlFor="percentage">Percentage (%)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fixed" id="fixed" />
                        <Label htmlFor="fixed">Fixed Amount (₹)</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {form.watch("discountType") === "percentage" 
                    ? "Discount Percentage (%)" 
                    : "Discount Amount (₹)"}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="0"
                    type="number"
                    step="0.01"
                    min="0"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update Accessory' : 'Add Accessory'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
