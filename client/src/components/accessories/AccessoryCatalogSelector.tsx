import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search } from "lucide-react";
import { type AccessoryCatalog } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AccessoryCatalogSelectorProps {
  roomId: number;
  onAdd?: () => void;
}

export default function AccessoryCatalogSelector({ roomId, onAdd }: AccessoryCatalogSelectorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  // Fetch accessory catalog
  const { data: accessories, isLoading } = useQuery<AccessoryCatalog[]>({
    queryKey: ["/api/accessory-catalog"],
    queryFn: async () => {
      const res = await fetch("/api/accessory-catalog");
      if (!res.ok) throw new Error("Failed to fetch accessory catalog");
      return res.json();
    },
  });

  // Add accessory to room mutation
  const addAccessoryMutation = useMutation({
    mutationFn: async (item: AccessoryCatalog) => {
      // Prepare accessory data for the room
      const accessoryData = {
        name: item.name,
        description: item.description || '',
        sellingPrice: item.sellingPrice,
      };

      const res = await apiRequest("POST", `/api/rooms/${roomId}/accessories`, accessoryData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Accessory added to room successfully",
      });
      
      // Invalidate the room query to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      
      // Call the onAdd callback if provided
      if (onAdd) onAdd();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add accessory: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter accessories based on category and search query
  const filteredAccessories = accessories?.filter((item) => {
    // Filter by category
    if (category !== "all" && item.category !== category) {
      return false;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const handleAddAccessory = (item: AccessoryCatalog) => {
    addAccessoryMutation.mutate(item);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add From Catalog
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Accessory From Catalog</DialogTitle>
          <DialogDescription>
            Select accessories from the catalog to add to this room.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code or description..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs defaultValue="all" value={category} onValueChange={setCategory}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="handle">Handles</TabsTrigger>
              <TabsTrigger value="kitchen">Kitchen</TabsTrigger>
              <TabsTrigger value="light">Lighting</TabsTrigger>
              <TabsTrigger value="wardrobe">Wardrobe</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAccessories?.length === 0 ? (
            <div className="text-center p-8 bg-muted/50 rounded-lg">
              <h3 className="text-lg font-medium">No accessories found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccessories?.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="flex flex-col h-full">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-md">{item.name}</CardTitle>
                      <CardDescription className="text-xs flex items-center space-x-1">
                        <span>{item.code}</span>
                        {item.size && (
                          <>
                            <span>•</span>
                            <span>{item.size}</span>
                          </>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 pb-0 flex-grow">
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 flex justify-between items-center">
                      <div className="font-semibold">₹{item.sellingPrice.toLocaleString('en-IN')}</div>
                      <Button
                        size="sm"
                        onClick={() => handleAddAccessory(item)}
                        disabled={addAccessoryMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </CardFooter>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}