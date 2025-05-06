import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProductForm from "./ProductForm";

interface ProductListProps {
  roomId: number;
  products: Product[];
}

export default function ProductList({ roomId, products }: ProductListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: Omit<Product, 'id'>) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/products`, productData);
      return await response.json();
    },
    onSuccess: () => {
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      toast({
        title: "Product added",
        description: "Product has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product.",
        variant: "destructive",
      });
    }
  });

  // Edit product mutation
  const editProductMutation = useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'roomId'>) => {
      if (!selectedProduct) return null;
      const response = await apiRequest("PUT", `/api/products/${selectedProduct.id}`, productData);
      return await response.json();
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      toast({
        title: "Product updated",
        description: "Product has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product.",
        variant: "destructive",
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      setProductToDelete(null);
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      toast({
        title: "Product deleted",
        description: "Product has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete product.",
        variant: "destructive",
      });
    }
  });

  const handleAddProduct = (data: any) => {
    const sellingPrice = parseFloat(data.sellingPrice);
    // Include discount fields with default values
    addProductMutation.mutate({
      roomId,
      name: data.name,
      description: data.description || "",
      sellingPrice: sellingPrice,
      discount: 0, // Default to 0% discount
      discountType: "percentage", // Default discount type
      discountedPrice: sellingPrice, // Default to full selling price (no discount)
      quantity: 1 // Default quantity
    });
  };

  const handleEditProduct = (data: any) => {
    const sellingPrice = parseFloat(data.sellingPrice);
    editProductMutation.mutate({
      name: data.name,
      description: data.description || "",
      sellingPrice: sellingPrice,
      discount: selectedProduct?.discount || 0, // Preserve existing discount if any
      discountType: selectedProduct?.discountType || "percentage", // Preserve existing discount type
      discountedPrice: sellingPrice, // Recalculate on server
      quantity: selectedProduct?.quantity || 1 // Preserve existing quantity
    });
  };

  const handleDeleteProduct = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id);
    }
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Products</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-1" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm 
              onSubmit={handleAddProduct} 
              isSubmitting={addProductMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {products.length === 0 ? (
        <div className="bg-white border rounded-md p-8 mb-4 text-center">
          <p className="text-gray-500">No products added yet.</p>
          <Button 
            onClick={() => setIsAddDialogOpen(true)} 
            className="mt-4 bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Product
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-white border rounded-md p-4 mb-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                  {product.description && (
                    <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditClick(product)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setProductToDelete(product)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Price</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="text"
                      value={product.sellingPrice || 0}
                      readOnly
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm 
              onSubmit={handleEditProduct} 
              isSubmitting={editProductMutation.isPending}
              defaultValues={selectedProduct}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {productToDelete?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
