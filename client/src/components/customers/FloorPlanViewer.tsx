import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Customer } from "@shared/schema";
import { FileText, Image, ExternalLink } from "lucide-react";
import { useFloorPlanUpload } from "@/hooks/use-floor-plan-upload";

interface FloorPlanViewerProps {
  customer: Customer;
  onUpdate?: () => void;
}

export function FloorPlanViewer({ customer, onUpdate }: FloorPlanViewerProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const floorPlanMutation = useFloorPlanUpload();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile || !customer?.id) return;
    
    await floorPlanMutation.mutate(
      { customerId: customer.id, file: selectedFile },
      {
        onSuccess: () => {
          setSelectedFile(null);
          setUploadDialogOpen(false);
          if (onUpdate) onUpdate();
        }
      }
    );
  };
  
  // Determine if the floor plan is an image or PDF
  const isImage = customer?.floorPlanType?.startsWith('image/');
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Floor Plan</h3>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Upload Floor Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Floor Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="floorPlan" className="text-sm font-medium">
                  Select a file (Image or PDF)
                </label>
                <input
                  id="floorPlan"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-500">
                  Supported formats: Images (JPG, PNG) and PDF files
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || floorPlanMutation.isPending}
                  className="relative"
                >
                  {floorPlanMutation.isPending && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  )}
                  <span className={floorPlanMutation.isPending ? "opacity-0" : ""}>
                    Upload
                  </span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {customer?.floorPlanUrl ? (
        <div className="border rounded-md p-4 space-y-3">
          <div className="flex items-center space-x-2">
            {isImage ? (
              <Image className="h-5 w-5 text-blue-500" />
            ) : (
              <FileText className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium">{customer.floorPlanName}</span>
          </div>
          
          <div className="flex space-x-2">
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  View Floor Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Floor Plan: {customer.floorPlanName}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                  {isImage ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img 
                        src={customer.floorPlanUrl} 
                        alt="Floor Plan" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <iframe 
                      src={customer.floorPlanUrl} 
                      className="w-full h-full"
                      title="Floor Plan PDF"
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <a 
              href={customer.floorPlanUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                Open in New Tab
              </Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="border rounded-md p-4 text-center text-gray-500">
          <p>No floor plan uploaded yet</p>
          <p className="text-sm mt-1">
            Upload a floor plan to help with design planning
          </p>
        </div>
      )}
    </div>
  );
}