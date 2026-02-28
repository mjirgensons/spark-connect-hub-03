import { Heart } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";

interface WishlistButtonProps {
  productId: string;
  size?: "sm" | "md";
}

const WishlistButton = ({ productId, size = "md" }: WishlistButtonProps) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const active = isInWishlist(productId);
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(productId);
      }}
      className="p-1.5 rounded-sm bg-background/80 backdrop-blur-sm border border-border hover:bg-background transition-colors"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={`${iconSize} transition-colors ${
          active ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"
        }`}
      />
    </button>
  );
};

export default WishlistButton;
