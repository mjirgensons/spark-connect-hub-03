import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { getOptPrice, isDeliveryOption } from "@/lib/productHelpers";

export function useProductCart(product: any, productOptions: any[]) {
  const { dispatch, getItemQuantity } = useCart();
  const qtyInCart = product ? getItemQuantity(product.id) : 0;

  const [checkedAddOns, setCheckedAddOns] = useState<Set<string>>(new Set());
  const [deliveryChoice, setDeliveryChoice] = useState<'delivery' | 'pickup'>('delivery');

  // Initialize included add-ons as checked
  useEffect(() => {
    if (productOptions.length > 0) {
      const included = new Set<string>();
      productOptions.forEach((opt: any) => {
        if (opt.inclusion_status === "included") included.add(opt.id);
      });
      setCheckedAddOns(included);
    }
  }, [productOptions]);

  const toggleAddOn = useCallback((optId: string) => {
    setCheckedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(optId)) next.delete(optId);
      else next.add(optId);
      return next;
    });
  }, []);

  const displayOpts = productOptions.filter((o: any) => {
    if (!o.option_name) return false;
    return !isDeliveryOption(o);
  });

  const addOnTotal = productOptions
    .filter((opt: any) => checkedAddOns.has(opt.id) && !isDeliveryOption(opt))
    .reduce((sum: number, opt: any) => sum + getOptPrice(opt), 0);

  const productPrice = product ? Number(product.price_discounted_usd) : 0;
  const grandTotal = productPrice + addOnTotal;

  const hasSimpleWidth = product?.width_mm && product.width_mm > 0;
  const hasWallA = product?.wall_a_length_mm && product.wall_a_length_mm > 0;
  const hasWallB = product?.wall_b_length_mm && product.wall_b_length_mm > 0;

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    const dOpt = product.delivery_option || 'pickup_only';
    const effectiveChoice: 'delivery' | 'pickup' | null =
      dOpt === 'delivery' ? 'delivery'
      : dOpt === 'pickup_only' ? 'pickup'
      : deliveryChoice;

    dispatch({
      type: "ADD_ITEM",
      payload: {
        productId: product.id,
        name: product.product_name,
        image: product.main_image_url || "/placeholder.svg",
        price: product.price_discounted_usd,
        dimensions: hasSimpleWidth
          ? `${product.width_mm} × ${product.height_mm} × ${product.depth_mm} mm`
          : hasWallA
          ? `A: ${product.wall_a_length_mm}${hasWallB ? ` × B: ${product.wall_b_length_mm}` : ""} | H: ${product.height_mm} × D: ${product.depth_mm} mm`
          : `${product.height_mm} × ${product.depth_mm} mm`,
        maxStock: product.stock_level,
        sellerId: product.seller_id || undefined,
        deliveryChoice: effectiveChoice,
        deliveryPrice: effectiveChoice === 'delivery' ? Number(product.delivery_price) || 0 : 0,
        deliveryPrepDays: effectiveChoice === 'delivery' ? (product.delivery_prep_days || 5) : (product.pickup_prep_days || 5),
        pickupAddress: product.pickup_address || '',
        pickupCity: product.pickup_city || '',
        pickupProvince: product.pickup_province || 'Ontario',
      },
    });

    productOptions
      .filter((opt: any) => checkedAddOns.has(opt.id) && opt.option_name && !isDeliveryOption(opt))
      .forEach((opt: any) => {
        const isIncluded = opt.inclusion_status === "included";
        const price = isIncluded ? 0 : getOptPrice(opt);
        dispatch({
          type: "ADD_ITEM",
          payload: {
            productId: `${product.id}_option_${opt.id}`,
            name: `${opt.option_name} (for ${product.product_name})`,
            image: product.main_image_url || "/placeholder.svg",
            price,
            dimensions: "",
            maxStock: 1,
          },
        });
      });

    toast.success(qtyInCart > 0 ? "Cart updated" : "Added to cart", {
      action: { label: "View Cart", onClick: () => (window.location.href = "/cart") },
    });
  }, [product, productOptions, checkedAddOns, deliveryChoice, dispatch, qtyInCart, hasSimpleWidth, hasWallA, hasWallB]);

  return {
    qtyInCart,
    checkedAddOns,
    toggleAddOn,
    deliveryChoice,
    setDeliveryChoice,
    displayOpts,
    addOnTotal,
    productPrice,
    grandTotal,
    handleAddToCart,
  };
}
