import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PageHeader from "./PageHeader";
import { Download, Upload, FileUp } from "lucide-react";
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ 
    totalRows?: number, 
    successCount?: number, 
    errorCount?: number, 
    errors?: string[] 
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  // Handle export
  const handleExport = () => {
    window.location.href = "/api/accessory-catalog/export";
  };
  
  // Handle file selection for import
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }
    
    // Upload file
    const formData = new FormData();
    formData.append('file', file);
    
    setImporting(true);
    setImportResults(null);
    
    fetch('/api/accessory-catalog/import', {
      method: 'POST',
      body: formData,
    })
      .then(res => {
        if (!res.ok) throw new Error("Import failed");
        return res.json();
      })
      .then(results => {
        setImportResults(results);
        if (results.successCount > 0) {
          queryClient.invalidateQueries({ queryKey: ["/api/accessory-catalog"] });
          toast({
            title: "Import successful",
            description: `${results.successCount} items imported successfully`,
          });
        }
      })
      .catch(error => {
        toast({
          title: "Import failed",
          description: error.message,
          variant: "destructive",
        });
      })
      .finally(() => {
        setImporting(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });
  };

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
    <>
      <PageHeader
        title="Accessory Catalog"
        description="Manage and organize accessories by category"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Import Accessories from CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to import accessories in bulk.
                    The CSV must include code, name, and category columns.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="csv-file" className="text-sm font-medium">
                      CSV File
                    </label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="csv-file"
                        type="file" 
                        accept=".csv"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                        disabled={importing}
                      />
                      {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required columns: code, name, category (handle, kitchen, light, wardrobe)
                    </p>
                  </div>
                  
                  {importResults && (
                    <div className="rounded-md border p-4 mt-4">
                      <h4 className="text-sm font-medium mb-2">Import Results</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Total rows:</div>
                        <div>{importResults.totalRows}</div>
                        <div>Successful imports:</div>
                        <div>{importResults.successCount}</div>
                        <div>Failed imports:</div>
                        <div>{importResults.errorCount}</div>
                      </div>
                      
                      {importResults.errors && importResults.errors.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium mb-1">Errors:</h5>
                          <div className="max-h-32 overflow-y-auto text-xs">
                            <ul className="list-disc list-inside space-y-1">
                              {importResults.errors.map((error, index) => (
                                <li key={index} className="text-destructive">{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setImportDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
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
          </div>
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
    </>
  );
}