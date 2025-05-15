import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Image, Upload, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Image as ImageType, imageTypeEnum } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

interface ImageUploadProps {
  roomId: number;
  images: ImageType[];
}

export default function ImageUpload({ roomId, images }: ImageUploadProps) {
  const [imageToDelete, setImageToDelete] = useState<ImageType | null>(null);
  const { toast } = useToast();
  
  // Get the image type options
  const imageTypes = Object.values(imageTypeEnum.enumValues);

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch(`/api/rooms/${roomId}/images`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      toast({
        title: "Image uploaded",
        description: "Image has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to upload image: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update image type mutation
  const updateImageMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: string }) => {
      return await apiRequest("PATCH", `/api/images/${id}`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      toast({
        title: "Image updated",
        description: "Image type has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update image: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      await apiRequest("DELETE", `/api/images/${imageId}`);
    },
    onSuccess: () => {
      setImageToDelete(null);
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      toast({
        title: "Image deleted",
        description: "Image has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete image.",
        variant: "destructive",
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length) {
      acceptedFiles.forEach(file => {
        uploadMutation.mutate(file);
      });
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.svg']
    },
    maxSize: 5242880, // 5MB
  });

  const handleDeleteImage = () => {
    if (imageToDelete) {
      deleteImageMutation.mutate(imageToDelete.id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Design Images</h3>
      </div>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'} rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
      >
        <input {...getInputProps()} />
        <div className="flex justify-center mb-4">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 mb-2">
          {isDragActive ? "Drop the files here..." : "Drag and drop images here or"}
        </p>
        <Button variant="outline" type="button" className="mb-2">
          <Plus className="mr-2 h-4 w-4" />
          Select Files
        </Button>
        <p className="text-xs text-gray-400 mt-2">Supported formats: JPEG, PNG, GIF</p>
        {uploadMutation.isPending && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-xs text-indigo-600 mt-1">Uploading...</p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-6">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-w-1 aspect-h-1 rounded-md overflow-hidden bg-gray-100 mb-2">
                  <img 
                    src={image.path} 
                    alt={image.filename} 
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageToDelete(image);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor={`image-type-${image.id}`} className="mb-1 block text-sm font-medium">
                    Image Type
                  </Label>
                  <Select
                    value={image.type || 'OTHER'}
                    onValueChange={(value) => 
                      updateImageMutation.mutate({ id: image.id, type: value })
                    }
                  >
                    <SelectTrigger id={`image-type-${image.id}`} className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {imageTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this image. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteImage}
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
