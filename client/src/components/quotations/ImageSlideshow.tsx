import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Edit, Maximize2, Minimize2 } from "lucide-react";
import { Image as ImageType } from "@shared/schema";
import ImageEditor from "./ImageEditor";

interface ImageSlideshowProps {
  images: ImageType[];
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  initialIndex?: number;
}

export default function ImageSlideshow({ 
  images, 
  isOpen, 
  onClose, 
  roomId,
  initialIndex = 0 
}: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  const currentImage = images[currentIndex];

  if (!currentImage || images.length === 0) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`${isFullscreen ? 'max-w-none max-h-none w-screen h-screen' : 'max-w-6xl max-h-[90vh]'} p-0 overflow-hidden`}>
          <DialogHeader className="sr-only">
            <DialogTitle>Image Slideshow</DialogTitle>
            <DialogDescription>
              View and navigate through room images. Use arrow keys to navigate or click thumbnails to jump to specific images.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold">
                  {currentImage.type || 'Untitled'} ({currentIndex + 1} of {images.length})
                </h3>
                <span className="text-sm text-gray-600">
                  {currentImage.filename}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditorOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Image Display */}
            <div className="flex-1 relative bg-gray-100 flex items-center justify-center p-8">
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={currentImage.path}
                  alt={currentImage.filename}
                  className="max-w-full max-h-full object-contain"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    objectFit: 'contain',
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              </div>
              
              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white z-10"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white z-10"
                    onClick={goToNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex space-x-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentIndex 
                          ? 'border-blue-500 shadow-lg' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={image.path}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image Info */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>Type: {currentImage.type || 'Not specified'}</span>
                  <span>Position: #{currentIndex + 1}</span>
                </div>
                <div className="text-xs">
                  Use arrow keys to navigate • ESC to close
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Editor */}
      <ImageEditor
        image={currentImage}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        roomId={roomId}
      />
    </>
  );
}