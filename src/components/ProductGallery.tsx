import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  mainImage: string;
  additionalImages: string[];
  productName: string;
  discountPercentage: number;
}

const ProductGallery = ({ mainImage, additionalImages, productName, discountPercentage }: ProductGalleryProps) => {
  const allImages = [mainImage, ...additionalImages];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const currentImage = allImages[selectedIndex];

  const goTo = (dir: -1 | 1) => {
    setSelectedIndex((prev) => (prev + dir + allImages.length) % allImages.length);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Main display */}
        <div
          className="relative aspect-square overflow-hidden border bg-secondary/30 cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={currentImage}
            alt={productName}
            className="w-full h-full object-cover transition-all duration-300"
          />
          {discountPercentage > 0 && (
            <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-sm font-extrabold px-3 py-1.5 rounded-full shadow-lg">
              {discountPercentage}% OFF
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {allImages.map((url, i) => (
              <div
                key={i}
                className={`aspect-square overflow-hidden border bg-secondary/30 cursor-pointer transition-all duration-200 ${
                  i === selectedIndex ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
                }`}
                onClick={() => setSelectedIndex(i)}
              >
                <img
                  src={url}
                  alt={`${productName} view ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur-sm">
          <div className="relative flex items-center justify-center">
            {allImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10"
                onClick={() => goTo(-1)}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            )}
            <img
              src={allImages[selectedIndex]}
              alt={`${productName} full view`}
              className="max-h-[80vh] w-auto mx-auto object-contain"
            />
            {allImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10"
                onClick={() => goTo(1)}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-1">
            {selectedIndex + 1} / {allImages.length}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductGallery;
