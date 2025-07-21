import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { 
  accessoryCatalogFormSchema, 
  type AccessoryCatalog
} from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface AccessoryCatalogFormProps {
  defaultValues?: Partial<AccessoryCatalog>;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export default function AccessoryCatalogForm({
  defaultValues = {
    category: "handle",
    code: "",
    name: "",
    description: "",
    sellingPrice: 0,
    kitchenPrice: null,
    wardrobePrice: null,
    size: "",
    image: "",
  },
  onSubmit,
  isSubmitting,
}: AccessoryCatalogFormProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>(defaultValues?.image || "");

  const form = useForm({
    resolver: zodResolver(accessoryCatalogFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: any) => {
    // Convert string numbers to actual numbers
    const formattedData = {
      ...data,
      sellingPrice: Number(data.sellingPrice),
      kitchenPrice: data.kitchenPrice ? Number(data.kitchenPrice) : null,
      wardrobePrice: data.wardrobePrice ? Number(data.wardrobePrice) : null,
    };
    onSubmit(formattedData);
  };

  const category = form.watch("category");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Selection */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="handle">Handles</SelectItem>
                    <SelectItem value="kitchen">Kitchen Accessories</SelectItem>
                    <SelectItem value="light">Lighting</SelectItem>
                    <SelectItem value="wardrobe">Wardrobe Accessories</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Code */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., LH-101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Item name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Item description"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selling Price */}
          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value)}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Size field */}
          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 196mm" 
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Category specific fields */}
        {(category === "kitchen" || category === "wardrobe") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category === "kitchen" && (
              <FormField
                control={form.control}
                name="kitchenPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kitchen Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {category === "wardrobe" && (
              <FormField
                control={form.control}
                name="wardrobePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wardrobe Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        {/* Image Upload */}
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Image</FormLabel>
              <div className="space-y-4">
                {/* Image Preview */}
                {previewImage && (
                  <div className="relative inline-block border rounded-lg overflow-hidden bg-gray-50">
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover"
                      onError={() => setPreviewImage("")}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 w-6 h-6 p-0"
                      onClick={() => {
                        setPreviewImage("");
                        field.onChange("");
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Upload Options */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* File Upload */}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setUploading(true);
                        try {
                          const formData = new FormData();
                          formData.append('image', file);
                          
                          const response = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                          });

                          if (!response.ok) throw new Error('Upload failed');
                          
                          const result = await response.json();
                          const imageUrl = result.url;
                          
                          field.onChange(imageUrl);
                          setPreviewImage(imageUrl);
                          
                          toast({
                            title: "Success",
                            description: "Image uploaded successfully",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to upload image",
                            variant: "destructive",
                          });
                        } finally {
                          setUploading(false);
                        }
                      }}
                    />
                  </div>

                  {/* URL Input */}
                  <div className="flex-1">
                    <Input
                      placeholder="Or paste image URL"
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setPreviewImage(e.target.value);
                      }}
                      disabled={uploading}
                    />
                  </div>
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="w-4 h-4 animate-pulse" />
                    Uploading image...
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Saving..." : "Save Accessory"}
        </Button>
      </form>
    </Form>
  );
}