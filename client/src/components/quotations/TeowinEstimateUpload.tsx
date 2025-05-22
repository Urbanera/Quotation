import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, Image, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface TeowinEstimateUploadProps {
  roomId: number;
  quotationId: number;
  teowinEstimateUrl?: string | null;
  teowinEstimateType?: string | null;
  teowinEstimateName?: string | null;
}

export default function TeowinEstimateUpload({
  roomId,
  quotationId,
  teowinEstimateUrl,
  teowinEstimateType,
  teowinEstimateName
}: TeowinEstimateUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile || !roomId) return;
    
    try {
      setIsUploading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Make API request
      const response = await fetch(`/api/rooms/${roomId}/teowin-estimate`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload Teowin estimate");
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/quotations/${quotationId}/rooms`] });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      
      // Clear selected file
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Success",
        description: "Teowin estimate uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload Teowin estimate",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Determine if the file is an image or PDF
  const isImage = teowinEstimateType?.startsWith('image/');
  
  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-gray-900">Teowin Estimate</h3>
        {teowinEstimateUrl && (
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="ml-auto mr-2"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Teowin Estimate: {teowinEstimateName}</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">
                {isImage ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={teowinEstimateUrl} 
                      alt="Teowin Estimate" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <iframe 
                    src={teowinEstimateUrl} 
                    className="w-full h-full"
                    title="Teowin Estimate PDF"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {teowinEstimateUrl ? (
        <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50 mb-3">
          {isImage ? (
            <Image className="h-5 w-5 text-blue-500" />
          ) : (
            <FileText className="h-5 w-5 text-red-500" />
          )}
          <span className="text-sm font-medium">{teowinEstimateName}</span>
          
          <a 
            href={teowinEstimateUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-auto"
          >
            <Button variant="ghost" size="sm">
              Open in New Tab
            </Button>
          </a>
        </div>
      ) : (
        <div className="text-center p-3 border rounded-md bg-gray-50 mb-3">
          <p className="text-sm text-gray-500">No Teowin estimate uploaded yet</p>
        </div>
      )}
      
      <div className="flex items-center space-x-3">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <Button 
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className={isUploading ? "opacity-70" : ""}
        >
          {isUploading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </div>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-1" />
              Upload Estimate
            </>
          )}
        </Button>
      </div>
    </div>
  );
}