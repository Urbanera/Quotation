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
import { Product } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Define schema for product form
const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sellingPrice: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 
    { message: "Selling price must be a positive number" }
  ),
  discountedPrice: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 
    { message: "Discounted price must be a positive number" }
  ),
}).refine((data) => {
  const sellingPrice = parseFloat(data.sellingPrice);
  const discountedPrice = parseFloat(data.discountedPrice);
  return discountedPrice <= sellingPrice;
}, {
  message: "Discounted price cannot be higher than selling price",
  path: ["discountedPrice"],
});

interface ProductFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  defaultValues?: Product;
  isEdit?: boolean;
}

export default function ProductForm({ 
  onSubmit, 
  isSubmitting, 
  defaultValues,
  isEdit = false 
}: ProductFormProps) {
  // Initialize form with default values
  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      sellingPrice: defaultValues?.sellingPrice?.toString() || "",
      discountedPrice: defaultValues?.discountedPrice?.toString() || "",
    },
  });

  // Auto-calculate discounted price (10% off by default)
  const calculateDiscountedPrice = () => {
    const sellingPrice = parseFloat(form.getValues("sellingPrice"));
    if (!isNaN(sellingPrice)) {
      const discountedPrice = (sellingPrice * 0.9).toFixed(2);
      form.setValue("discountedPrice", discountedPrice);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
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
                  placeholder="Enter product description" 
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
                <FormLabel>Selling Price (₹)</FormLabel>
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
                      onBlur={() => calculateDiscountedPrice()}
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
            name="discountedPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discounted Price (₹)</FormLabel>
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
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => calculateDiscountedPrice()}
          >
            Calculate 10% Discount
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update Product' : 'Add Product'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
