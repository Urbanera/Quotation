import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RotateCcw, RotateCw, Crop, Save, X } from "lucide-react";
import Cropper from "react-easy-crop";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageType } from "@shared/schema";

interface ImageEditorProps {
  image: ImageType | null;
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageEditor({ image, isOpen, onClose, roomId }: ImageEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const { toast } = useToast();

  const onCropComplete = useCallback((croppedArea: CropArea, croppedAreaPixels: PixelCrop) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: PixelCrop,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const rotRad = (rotation * Math.PI) / 180;

    // Calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // Set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Translate canvas context to a central location to allow rotating around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Draw rotated image
    ctx.drawImage(image, 0, 0);

    // Crop the image
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) {
      throw new Error('No 2d context');
    }

    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      croppedCanvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/jpeg', 0.95);
    });
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = (rotation * Math.PI) / 180;
    return {
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const updateImageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/images/${image?.id}/edit`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to update image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
      toast({
        title: "Image updated",
        description: "Image has been edited successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update image: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleSave = async () => {
    if (!image || !croppedAreaPixels) return;

    try {
      const croppedImageBlob = await getCroppedImg(
        image.path,
        croppedAreaPixels,
        rotation
      );

      const formData = new FormData();
      formData.append('image', croppedImageBlob, image.filename);
      formData.append('rotation', rotation.toString());
      
      updateImageMutation.mutate(formData);
    } catch (error) {
      console.error('Error cropping image:', error);
      toast({
        title: "Error",
        description: "Failed to process image.",
        variant: "destructive",
      });
    }
  };

  const handleRotate = (degrees: number) => {
    setRotation(prev => (prev + degrees) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setIsCropping(false);
  };

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-[70vh]">
          {/* Crop Area */}
          <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
            <Cropper
              image={image.path}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={undefined}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              showGrid={isCropping}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                },
              }}
            />
          </div>

          {/* Controls */}
          <div className="mt-4 space-y-4">
            {/* Zoom Control */}
            <div className="flex items-center space-x-4">
              <Label className="w-16">Zoom:</Label>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <span className="w-16 text-sm text-gray-600">{zoom.toFixed(1)}x</span>
            </div>

            {/* Rotation Control */}
            <div className="flex items-center space-x-4">
              <Label className="w-16">Rotation:</Label>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={-180}
                max={180}
                step={1}
                className="flex-1"
              />
              <span className="w-16 text-sm text-gray-600">{rotation}°</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotate(-90)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  90° Left
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotate(90)}
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  90° Right
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCropping(!isCropping)}
                >
                  <Crop className="h-4 w-4 mr-1" />
                  {isCropping ? 'Hide Grid' : 'Show Grid'}
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                >
                  Reset
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateImageMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {updateImageMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}