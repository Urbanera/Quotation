import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Image, Upload, Plus, Trash2, GripVertical, Eye, Edit, Play } from "lucide-react";
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
import ImageSlideshow from "./ImageSlideshow";
import ImageEditor from "./ImageEditor";

interface ImageUploadProps {
  roomId: number;
  images: ImageType[];
}

export default function ImageUpload({ roomId, images }: ImageUploadProps) {
  const [imageToDelete, setImageToDelete] = useState<ImageType | null>(null);
  const [draggedImage, setDraggedImage] = useState<ImageType | null>(null);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [imageToEdit, setImageToEdit] = useState<ImageType | null>(null);
  const { toast } = useToast();
  
  // Get the image type options
  const imageTypes = Object.values(imageTypeEnum.enumValues);

  // Function to get default order based on image type
  const getDefaultOrder = (imageType: string): number => {
    const typeOrder = {
      'TOP VIEW 3D': 0,
      'TOP VIEW 2D': 1,
      'VIEW 1 3D': 2,
      'VIEW 1 2D': 3,
      'VIEW 2 3D': 4,
      'VIEW 2 2D': 5,
      'VIEW 3 3D': 6,
      'VIEW 3 2D': 7,
      'VIEW 4 3D': 8,
      'VIEW 4 2D': 9,
      'WARDROBE 3D': 10,
      'WARDROBE 2D': 11,
      'OTHER': 12
    };
    return typeOrder[imageType as keyof typeof typeOrder] ?? 99;
  };

  // Sort images by order and then by type priority
  const sortedImages = [...images].sort((a, b) => {
    // First sort by order field
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    // If order is the same, sort by type priority
    return getDefaultOrder(a.type || 'OTHER') - getDefaultOrder(b.type || 'OTHER');
  });

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

  // Reorder images mutation
  const reorderImagesMutation = useMutation({
    mutationFn: async (imageIds: number[]) => {
      await apiRequest("POST", `/api/rooms/${roomId}/images/reorder`, { imageIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      toast({
        title: "Images reordered",
        description: "Image order has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder images.",
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

  // Handle type change with dropdown select
  const handleTypeChange = (imageId: number, newType: string) => {
    updateImageMutation.mutate({ id: imageId, type: newType });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, image: ImageType) => {
    setDraggedImage(image);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetImage: ImageType) => {
    e.preventDefault();
    
    if (!draggedImage || draggedImage.id === targetImage.id) {
      setDraggedImage(null);
      return;
    }

    const draggedIndex = sortedImages.findIndex(img => img.id === draggedImage.id);
    const targetIndex = sortedImages.findIndex(img => img.id === targetImage.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedImage(null);
      return;
    }

    // Create new order array
    const newOrder = [...sortedImages];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    // Extract image IDs in the new order
    const imageIds = newOrder.map(img => img.id);

    // Update the order
    reorderImagesMutation.mutate(imageIds);
    setDraggedImage(null);
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
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

      {sortedImages.length > 0 && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>Drag and drop images to reorder them. The order will be applied to presentations and PDF documents.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSlideshow(true)}
              >
                <Play className="h-4 w-4 mr-1" />
                View Slideshow
              </Button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedImages.map((image, index) => (
              <div 
                key={image.id} 
                className={`relative border rounded-lg p-4 bg-white shadow-sm cursor-move transition-all ${
                  draggedImage?.id === image.id ? 'opacity-50 transform scale-95' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, image)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, image)}
                onDragEnd={handleDragEnd}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <GripVertical className="h-4 w-4 mr-1" />
                    <span>#{index + 1}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setImageToEdit(image)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setImageToDelete(image)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div 
                  className="relative aspect-w-16 aspect-h-9 rounded-md overflow-hidden bg-gray-100 mb-4 cursor-pointer group"
                  onClick={() => {
                    setSlideshowIndex(index);
                    setIsSlideshow(true);
                  }}
                >
                  <img 
                    src={image.path} 
                    alt={image.filename} 
                    className="object-contain w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </div>
                
                <div className="mb-2 z-50">
                  <Label htmlFor={`image-type-${image.id}`} className="text-sm font-medium mb-2 block">
                    Image Type
                  </Label>
                  
                  <div className="relative z-50">
                    <Select
                      value={image.type || 'OTHER'}
                      onValueChange={(value) => handleTypeChange(image.id, value)}
                    >
                      <SelectTrigger id={`image-type-${image.id}`} className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        className="z-[1000] w-[200px]"
                        align="start"
                        sideOffset={5}
                      >
                        {imageTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

      {/* Image Slideshow */}
      <ImageSlideshow
        images={sortedImages}
        isOpen={isSlideshow}
        onClose={() => setIsSlideshow(false)}
        roomId={roomId}
        initialIndex={slideshowIndex}
      />

      {/* Image Editor */}
      <ImageEditor
        image={imageToEdit}
        isOpen={!!imageToEdit}
        onClose={() => setImageToEdit(null)}
        roomId={roomId}
      />
    </div>
  );
}
