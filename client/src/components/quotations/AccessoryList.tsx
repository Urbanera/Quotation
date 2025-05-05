import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Layers } from "lucide-react";
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
import { Accessory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AccessoryForm from "./AccessoryForm";
import AccessoryCatalogSelector from "@/components/accessories/AccessoryCatalogSelector";

interface AccessoryListProps {
  roomId: number;
  accessories: Accessory[];
}

export default function AccessoryList({ roomId, accessories }: AccessoryListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [accessoryToDelete, setAccessoryToDelete] = useState<Accessory | null>(null);
  const { toast } = useToast();

  // Add accessory mutation
  const addAccessoryMutation = useMutation({
    mutationFn: async (accessoryData: Omit<Accessory, 'id'>) => {
      const response = await apiRequest("POST", `/api/rooms/${roomId}/accessories`, accessoryData);
      return await response.json();
    },
    onSuccess: () => {
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      toast({
        title: "Accessory added",
        description: "Accessory has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add accessory.",
        variant: "destructive",
      });
    }
  });

  // Edit accessory mutation
  const editAccessoryMutation = useMutation({
    mutationFn: async (accessoryData: Omit<Accessory, 'id' | 'roomId'>) => {
      if (!selectedAccessory) return null;
      const response = await apiRequest("PUT", `/api/accessories/${selectedAccessory.id}`, accessoryData);
      return await response.json();
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setSelectedAccessory(null);
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      toast({
        title: "Accessory updated",
        description: "Accessory has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update accessory.",
        variant: "destructive",
      });
    }
  });

  // Delete accessory mutation
  const deleteAccessoryMutation = useMutation({
    mutationFn: async (accessoryId: number) => {
      await apiRequest("DELETE", `/api/accessories/${accessoryId}`);
    },
    onSuccess: () => {
      setAccessoryToDelete(null);
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      toast({
        title: "Accessory deleted",
        description: "Accessory has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete accessory.",
        variant: "destructive",
      });
    }
  });

  const handleAddAccessory = (data: any) => {
    const sellingPrice = parseFloat(data.sellingPrice);
    // Include discount fields with default values
    addAccessoryMutation.mutate({
      roomId,
      name: data.name,
      description: data.description || "",
      sellingPrice: sellingPrice,
      discount: 0, // Default to 0% discount
      discountType: "percentage", // Default discount type
      discountedPrice: sellingPrice, // Default to full selling price (no discount)
      quantity: parseInt(data.quantity) || 1,
    });
  };

  const handleEditAccessory = (data: any) => {
    const sellingPrice = parseFloat(data.sellingPrice);
    editAccessoryMutation.mutate({
      name: data.name,
      description: data.description || "",
      sellingPrice: sellingPrice,
      discount: selectedAccessory?.discount || 0, // Preserve existing discount if any
      discountType: selectedAccessory?.discountType || "percentage", // Preserve existing discount type
      discountedPrice: sellingPrice, // Recalculate on server
      quantity: parseInt(data.quantity) || 1,
    });
  };

  const handleDeleteAccessory = () => {
    if (accessoryToDelete) {
      deleteAccessoryMutation.mutate(accessoryToDelete.id);
    }
  };

  const handleEditClick = (accessory: Accessory) => {
    setSelectedAccessory(accessory);
    setIsEditDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Accessories</h3>
        <div className="flex space-x-3">
          {/* Add From Catalog Button */}
          <AccessoryCatalogSelector 
            roomId={roomId} 
            onAdd={() => {
              queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
            }}
          />
          
          {/* Add Custom Accessory Button */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-indigo-100 text-indigo-600 hover:bg-indigo-200 border-none">
                <Plus className="h-4 w-4 mr-1" />
                Add Custom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Accessory</DialogTitle>
              </DialogHeader>
              <AccessoryForm 
                onSubmit={handleAddAccessory} 
                isSubmitting={addAccessoryMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {!accessories || accessories.length === 0 ? (
        <div className="bg-white border rounded-md p-6 mb-4 text-center">
          <p className="text-gray-500 text-sm mb-2">No accessories added yet.</p>
          <p className="text-gray-400 text-xs mb-3">Add accessories from the catalog or create custom ones</p>
          <div className="flex justify-center space-x-3">
            <Button 
              variant="outline"
              size="sm" 
              onClick={() => setIsAddDialogOpen(true)}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Custom
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {accessories.map((accessory) => (
            <div 
              key={accessory.id} 
              className="bg-white border rounded-md p-4 mb-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{accessory.name}</h4>
                  {accessory.description && (
                    <p className="text-sm text-gray-500 mt-1">{accessory.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditClick(accessory)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setAccessoryToDelete(accessory)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Unit Price</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="text"
                      value={accessory.sellingPrice.toLocaleString('en-IN')}
                      readOnly
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  {accessory.discount > 0 && (
                    <div className="mt-1 text-xs text-green-600">
                      {accessory.discountType === "percentage" ? `${accessory.discount}% off` : `₹${accessory.discount} off`}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500">Discounted Price</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="text"
                      value={accessory.discountedPrice.toLocaleString('en-IN')}
                      readOnly
                      className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 ${accessory.discount > 0 ? 'text-green-600 font-medium' : ''}`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500">Quantity</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      value={accessory.quantity || 1}
                      readOnly
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50 text-center"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500">Total Price</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="text"
                      value={((accessory.quantity || 1) * accessory.discountedPrice).toLocaleString('en-IN')}
                      readOnly
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md bg-gray-50 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Accessory Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Accessory</DialogTitle>
          </DialogHeader>
          {selectedAccessory && (
            <AccessoryForm 
              onSubmit={handleEditAccessory} 
              isSubmitting={editAccessoryMutation.isPending}
              defaultValues={selectedAccessory}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!accessoryToDelete} onOpenChange={(open) => !open && setAccessoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {accessoryToDelete?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccessory}
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
