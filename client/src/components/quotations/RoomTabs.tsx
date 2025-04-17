import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Grip, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Room, RoomWithItems, InstallationCharge } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProductList from "./ProductList";
import AccessoryList from "./AccessoryList";
import ImageUpload from "./ImageUpload";
import RoomForm from "./RoomForm";
import InstallationCalculator from "./InstallationCalculator";

interface RoomTabsProps {
  quotationId: number;
}

export default function RoomTabs({ quotationId }: RoomTabsProps) {
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [addRoomDialogOpen, setAddRoomDialogOpen] = useState(false);
  const [editingInstallationId, setEditingInstallationId] = useState<number | null>(null);
  const [addingInstallation, setAddingInstallation] = useState(false);
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
              rooms.map((room) => (
                <button
                  key={room.id}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeRoomId === room.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  aria-current={activeRoomId === room.id ? "page" : undefined}
                  onClick={() => setActiveRoomId(room.id)}
                >
                  {room.name}
                </button>
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
                              `${charge.widthMm} mm × ${charge.heightMm} mm (${charge.areaSqft.toFixed(2)} sq.ft)` : 
                              "Dimensions not set"}
                          </div>
                          <div className="text-sm text-gray-500">
                            Price per sq.ft: ₹{charge.pricePerSqft.toFixed(2)}
                          </div>
                          <div className="font-medium text-indigo-600">
                            Total: ₹{charge.amount.toFixed(2)}
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
                      ₹{activeRoom.installationCharges.reduce((sum, charge) => sum + charge.amount, 0).toFixed(2)}
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