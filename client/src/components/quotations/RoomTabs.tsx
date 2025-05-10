import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, GripVertical, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Room, RoomWithItems, InstallationCharge } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProductList from "./ProductList";
import AccessoryList from "./AccessoryList";
import ImageUpload from "./ImageUpload";
import RoomForm from "./RoomForm";
import InstallationCalculator from "./InstallationCalculator";
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

interface RoomTabsProps {
  quotationId: number;
}

export default function RoomTabs({ quotationId }: RoomTabsProps) {
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [addRoomDialogOpen, setAddRoomDialogOpen] = useState(false);
  const [editingInstallationId, setEditingInstallationId] = useState<number | null>(null);
  const [addingInstallation, setAddingInstallation] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const draggedItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Fetch rooms for this quotation
  const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: [`/api/quotations/${quotationId}/rooms`],
    enabled: !!quotationId,
  });

  // Fetch active room with items
  const { data: activeRoom, isLoading: activeRoomLoading } = useQuery<RoomWithItems>({
    queryKey: [`/api/rooms/${activeRoomId}`],
    enabled: !!activeRoomId,
  });

  // Set the first room as active when rooms are loaded
  useEffect(() => {
    if (rooms?.length && !activeRoomId) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, activeRoomId]);

  // Add room mutation
  const addRoomMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest(
        "POST", 
        `/api/quotations/${quotationId}/rooms`, 
        { name, description: "" }
      );
      return response.json();
    },
    onSuccess: (newRoom) => {
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}/rooms`] });
      setActiveRoomId(newRoom.id);
      setAddRoomDialogOpen(false);
      toast({
        title: "Room added",
        description: `${newRoom.name} has been added to the quotation.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add room.",
        variant: "destructive",
      });
    }
  });
  
  // Reorder rooms mutation
  const reorderRoomsMutation = useMutation({
    mutationFn: async (roomIds: number[]) => {
      const response = await apiRequest(
        "POST", 
        `/api/quotations/${quotationId}/rooms/reorder`, 
        { roomIds }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}/rooms`] });
      toast({
        title: "Rooms reordered",
        description: "Room order has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder rooms.",
        variant: "destructive",
      });
    }
  });
  
  // Delete room mutation
  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const response = await apiRequest("DELETE", `/api/rooms/${roomId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}/rooms`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}/details`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}`] });
      
      // Set the active room to null to prevent errors
      setActiveRoomId(null);
      
      toast({
        title: "Room deleted",
        description: `Room has been removed from the quotation.`,
      });
      
      setRoomToDelete(null);
    },
    onError: (error: any) => {
      let errorMessage = "Failed to delete room.";
      
      if (error.response && error.response.status === 400) {
        errorMessage = "Cannot delete the only room in a quotation.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      setRoomToDelete(null);
    }
  });

  // Drag & drop functions for room reordering
  const handleDragStart = (index: number) => {
    draggedItemRef.current = index;
    setIsDragging(true);
  };
  
  const handleDragEnter = (index: number) => {
    dragOverItemRef.current = index;
  };
  
  const handleDragEnd = () => {
    if (draggedItemRef.current === null || dragOverItemRef.current === null || !rooms) {
      setIsDragging(false);
      return;
    }
    
    const draggedIndex = draggedItemRef.current;
    const dropIndex = dragOverItemRef.current;
    
    if (draggedIndex === dropIndex) {
      setIsDragging(false);
      return;
    }
    
    // Create a new array with the updated order
    const roomsCopy = [...rooms];
    const draggedRoom = roomsCopy[draggedIndex];
    roomsCopy.splice(draggedIndex, 1);
    roomsCopy.splice(dropIndex, 0, draggedRoom);
    
    // Get the IDs in the new order and call the API
    const roomIds = roomsCopy.map(room => room.id);
    reorderRoomsMutation.mutate(roomIds);
    
    // Reset refs and dragging state
    draggedItemRef.current = null;
    dragOverItemRef.current = null;
    setIsDragging(false);
  };
  
  const handleDeleteRoom = (room: Room) => {
    setRoomToDelete(room);
  };
  
  const confirmDeleteRoom = () => {
    if (roomToDelete) {
      deleteRoomMutation.mutate(roomToDelete.id);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      {/* Tabs navigation */}
      <div className="border-b border-gray-200">
        <div className="px-4 sm:px-6">
          <nav className="-mb-px flex space-x-4 overflow-x-auto scrollbar-hide" aria-label="Rooms">
            {roomsLoading ? (
              <div className="py-4 px-1 text-gray-500">Loading rooms...</div>
            ) : !rooms?.length ? (
              <div className="py-4 px-1 text-gray-500">No rooms yet</div>
            ) : (
              rooms.map((room, index) => (
                <div
                  key={room.id}
                  className={`relative flex items-center group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <GripVertical className="h-4 w-4 mr-1 text-gray-400 invisible group-hover:visible" />
                  <button
                    className={`whitespace-nowrap py-4 px-2 border-b-2 font-medium text-sm ${
                      activeRoomId === room.id
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    aria-current={activeRoomId === room.id ? "page" : undefined}
                    onClick={() => setActiveRoomId(room.id)}
                  >
                    {room.name}
                  </button>
                  <button 
                    className="ml-1 invisible group-hover:visible text-red-500 hover:text-red-700 focus:outline-none"
                    onClick={() => handleDeleteRoom(room)}
                    title="Delete room"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
            
            <Dialog open={addRoomDialogOpen} onOpenChange={setAddRoomDialogOpen}>
              <DialogTrigger asChild>
                <button className="text-indigo-600 border-transparent whitespace-nowrap py-4 px-1 border-b-0 font-medium text-sm flex items-center">
                  <Plus className="h-5 w-5 mr-1" />
                  Add Room
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Room</DialogTitle>
                </DialogHeader>
                <RoomForm 
                  onSubmit={(data) => {
                    addRoomMutation.mutate(data.name);
                  }}
                  isSubmitting={addRoomMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </nav>
        </div>
      </div>
      
      {/* Delete Room Confirmation Dialog */}
      <AlertDialog open={!!roomToDelete} onOpenChange={(open) => !open && setRoomToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the room "{roomToDelete?.name}"? 
              This will permanently remove all products, accessories, and installation charges 
              associated with this room.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteRoom} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Room content */}
      <div className="px-4 py-5 sm:p-6">
        {!activeRoomId ? (
          <div className="text-center py-8">
            {roomsLoading ? (
              <p className="text-gray-500">Loading rooms...</p>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">No rooms yet. Add your first room to start building the quotation.</p>
                <Button 
                  onClick={() => setAddRoomDialogOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Room
                </Button>
              </div>
            )}
          </div>
        ) : activeRoomLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading room data...</p>
          </div>
        ) : !activeRoom ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading room data. Please try again.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Products Section */}
              <div>
                <ProductList 
                  roomId={activeRoom.id} 
                  products={activeRoom.products} 
                />
              </div>
              
              {/* Accessories and Images */}
              <div>
                <div className="mb-6">
                  <AccessoryList 
                    roomId={activeRoom.id} 
                    accessories={activeRoom.accessories} 
                  />
                </div>
                
                <div>
                  <ImageUpload 
                    roomId={activeRoom.id} 
                    images={activeRoom.images} 
                  />
                </div>
              </div>
            </div>
            
            {/* Installation Charges - moved below products and accessories */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Installation Charges</h3>
                {!addingInstallation && (
                  <Button 
                    onClick={() => setAddingInstallation(true)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    size="sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Charge
                  </Button>
                )}
              </div>
              
              {/* List installation charges */}
              {activeRoom.installationCharges && activeRoom.installationCharges.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {activeRoom.installationCharges.map((charge) => (
                    <div key={charge.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{charge.cabinetType || "Installation Charge"}</h4>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {charge.widthMm && charge.heightMm ? 
                              `${charge.widthMm} mm × ${charge.heightMm} mm (${
                                typeof charge.areaSqft === 'number' 
                                  ? charge.areaSqft.toFixed(2) 
                                  : parseFloat(String(charge.areaSqft)).toFixed(2)
                              } sq.ft)` : 
                              "Dimensions not set"}
                          </div>
                          <div className="text-sm text-gray-500">
                            Price per sq.ft: ₹{typeof charge.pricePerSqft === 'number' 
                              ? charge.pricePerSqft.toFixed(2) 
                              : parseFloat(String(charge.pricePerSqft)).toFixed(2)}
                          </div>
                          <div className="font-medium text-indigo-600">
                            Total: ₹{typeof charge.amount === 'number' 
                              ? charge.amount.toFixed(2) 
                              : parseFloat(String(charge.amount)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingInstallationId(charge.id || null)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (charge.id) {
                              apiRequest("DELETE", `/api/installation-charges/${charge.id}`)
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: [`/api/rooms/${activeRoom.id}`] });
                                  queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
                                  // Invalidate installation charges query for this quotation
                                  queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}/installation-charges`] });
                                  toast({
                                    title: "Installation charge deleted",
                                    description: "The installation charge has been deleted successfully.",
                                  });
                                })
                                .catch(() => {
                                  toast({
                                    title: "Error",
                                    description: "Failed to delete installation charge.",
                                    variant: "destructive",
                                  });
                                });
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 mb-4">
                  No installation charges added yet. Click the "Add Charge" button to add one.
                </div>
              )}
              
              {/* Installation charges total */}
              {activeRoom.installationCharges && activeRoom.installationCharges.length > 0 && (
                <div className="flex justify-end p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Installation Charges Total</div>
                    <div className="font-bold text-lg text-indigo-600">
                      ₹{activeRoom.installationCharges.reduce((sum, charge) => {
                        const amount = typeof charge.amount === 'number' 
                          ? charge.amount 
                          : parseFloat(String(charge.amount));
                        return sum + amount;
                      }, 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Editing an installation charge */}
              {editingInstallationId !== null && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium">Edit Installation Charge</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingInstallationId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <InstallationCalculator
                    roomId={activeRoom.id}
                    quotationId={quotationId}
                    charge={activeRoom.installationCharges?.find(charge => charge.id === editingInstallationId) || null}
                    onSaveSuccess={() => setEditingInstallationId(null)}
                  />
                </div>
              )}
              
              {/* Adding a new installation charge */}
              {addingInstallation && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium">Add New Installation Charge</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddingInstallation(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <InstallationCalculator
                    roomId={activeRoom.id}
                    quotationId={quotationId}
                    onSaveSuccess={() => setAddingInstallation(false)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}