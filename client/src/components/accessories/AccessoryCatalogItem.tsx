import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccessoryCatalog } from "@shared/schema";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AccessoryCatalogForm from "./AccessoryCatalogForm";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2 } from "lucide-react";
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

type AccessoryCatalogItemProps = {
  item: AccessoryCatalog;
};

export default function AccessoryCatalogItem({ item }: AccessoryCatalogItemProps) {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/accessory-catalog/${item.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Accessory catalog item updated successfully",
      });
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/accessory-catalog"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update accessory: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/accessory-catalog/${item.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Accessory catalog item deleted successfully",
      });
      setDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/accessory-catalog"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete accessory: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Format category for display
  const getCategoryName = (category: string) => {
    switch(category) {
      case "handle": return "Handle";
      case "kitchen": return "Kitchen Accessory";
      case "light": return "Lighting";
      case "wardrobe": return "Wardrobe Accessory";
      default: return category;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <CardDescription className="text-xs mt-1 flex items-center space-x-2">
              <span>{item.code}</span> 
              <span>•</span> 
              <span>{getCategoryName(item.category)}</span>
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive" 
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2 flex-grow">
        <div className="mb-3">
          {item.image ? (
            <div className="aspect-square w-full bg-muted rounded-md overflow-hidden">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=No+Image';
                }}
              />
            </div>
          ) : (
            <div className="aspect-square w-full bg-muted rounded-md flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
        {item.size && <p className="text-sm"><span className="font-semibold">Size:</span> {item.size}</p>}
      </CardContent>
      <CardFooter className="pt-0 pb-3 flex flex-col items-start">
        <div className="text-xl font-semibold">₹{item.sellingPrice.toLocaleString('en-IN')}</div>
        {item.category === "kitchen" && item.kitchenPrice && (
          <div className="text-sm text-muted-foreground">Kitchen Price: ₹{item.kitchenPrice.toLocaleString('en-IN')}</div>
        )}
        {item.category === "wardrobe" && item.wardrobePrice && (
          <div className="text-sm text-muted-foreground">Wardrobe Price: ₹{item.wardrobePrice.toLocaleString('en-IN')}</div>
        )}
      </CardFooter>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Accessory Catalog Item</DialogTitle>
            <DialogDescription>
              Update the details of this accessory catalog item.
            </DialogDescription>
          </DialogHeader>
          <AccessoryCatalogForm 
            defaultValues={item}
            onSubmit={updateMutation.mutate}
            isSubmitting={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the accessory 
              "{item.name}" from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}