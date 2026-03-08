import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  mainImage: string;
  additionalImages: string[];
  productName: string;
  discountPercentage: number;
}

const ProductGallery = React.memo(({ mainImage, additionalImages, productName, discountPercentage }: ProductGalleryProps) => {
  const allImages = [mainImage, ...additionalImages].filter(Boolean);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);
  const showArrows = allImages.length > 5;

  const currentImage = allImages[selectedIndex];

  const goTo = (dir: -1 | 1) => {
    setSelectedIndex((prev) => (prev + dir + allImages.length) % allImages.length);
  };

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbRef.current) {
      const active = thumbRef.current.children[selectedIndex] as HTMLElement;
      active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedIndex]);

  // Keyboard nav in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goTo(-1);
      if (e.key === "ArrowRight") goTo(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, allImages.length]);

  const scrollThumbs = (dir: -1 | 1) => {
    thumbRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-md border bg-secondary/30 cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={currentImage}
            alt={productName}
            className="w-full h-full object-cover transition-all duration-300"
          />
          {discountPercentage > 0 && (
            <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-sm font-extrabold px-3 py-1.5 rounded-full">
              {discountPercentage}% OFF
            </div>
          )}
        </div>

        {/* Thumbnail row */}
        {allImages.length > 1 && (
          <div className="relative flex items-center gap-1">
            {showArrows && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-8 shrink-0"
                onClick={() => scrollThumbs(-1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <div
              ref={thumbRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {allImages.map((url, i) => (
                <div
                  key={i}
                  className={`shrink-0 w-16 h-16 overflow-hidden rounded border cursor-pointer transition-all duration-200 ${
                    i === selectedIndex
                      ? "ring-2 ring-primary border-primary"
                      : "opacity-70 hover:opacity-100 border-border"
                  }`}
                  style={{ scrollSnapAlign: "center" }}
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
            {showArrows && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-8 shrink-0"
                onClick={() => scrollThumbs(1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
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
              alt={`${productName} — image ${selectedIndex + 1}`}
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
});

ProductGallery.displayName = "ProductGallery";

export default ProductGallery;
