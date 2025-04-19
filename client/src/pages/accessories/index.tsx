import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from "@/components/layout/MainLayout";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { accessoryCatalogFormSchema, type AccessoryCatalog } from "@shared/schema";
import AccessoryCatalogForm from "@/components/accessories/AccessoryCatalogForm";
import AccessoryCatalogItem from "@/components/accessories/AccessoryCatalogItem";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AccessoryCatalogPage() {
  const { toast } = useToast();
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch accessory catalog data
  const { data: accessories, isLoading, error } = useQuery<AccessoryCatalog[]>({
    queryKey: ["/api/accessory-catalog"],
    queryFn: async () => {
      const res = await fetch("/api/accessory-catalog");
      if (!res.ok) throw new Error("Failed to fetch accessory catalog");
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/accessory-catalog", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Accessory catalog item created successfully",
      });
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/accessory-catalog"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create accessory: ${error.message}`,
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

  return (
    <MainLayout>
      <PageHeader
        title="Accessory Catalog"
        description="Manage and organize accessories by category"
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add New Accessory
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Accessory</DialogTitle>
                <DialogDescription>
                  Create a new accessory item for your catalog.
                </DialogDescription>
              </DialogHeader>
              <AccessoryCatalogForm
                onSubmit={createMutation.mutate}
                isSubmitting={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accessories by name, code or description..."
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center p-4 text-destructive">
          Error loading accessory catalog. Please try again.
        </div>
      ) : filteredAccessories?.length === 0 ? (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-medium">No accessories found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery
              ? "Try adjusting your search or filter criteria"
              : "Add your first accessory to the catalog"}
          </p>
          <Button
            className="mt-4"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Accessory
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAccessories?.map((item) => (
            <AccessoryCatalogItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </MainLayout>
  );
}