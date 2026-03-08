import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProductData(id: string | undefined) {
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("id", id!)
        .is("deleted_at", null)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: productOptions = [] } = useQuery({
    queryKey: ["product-options", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_options")
        .select("*")
        .eq("product_id", id!)
        .order("sort_order");
      return data || [];
    },
    enabled: !!id,
  });

  const { data: productAppliances = [] } = useQuery({
    queryKey: ["product-appliances", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_compatible_appliances")
        .select("*")
        .eq("product_id", id!)
        .order("sort_order");
      return data || [];
    },
    enabled: !!id,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related-products", product?.category_id, product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, product_name, main_image_url, price_retail_usd, price_discounted_usd, discount_percentage")
        .eq("category_id", product!.category_id!)
        .eq("listing_status", "approved")
        .is("deleted_at", null)
        .neq("id", product!.id)
        .limit(6);
      return data || [];
    },
    enabled: !!product?.category_id,
  });

  useEffect(() => {
    if (product) {
      const desc = product.short_description || `${product.product_name} — ${product.color} ${product.material} cabinet. $${Number(product.price_discounted_usd).toLocaleString()} (${product.discount_percentage}% off). Available at FitMatch.`;
      document.title = `${product.product_name} | FitMatch`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", desc);
    }
  }, [product]);

  return {
    product,
    isLoading,
    error,
    productOptions,
    productAppliances,
    relatedProducts,
  };
}
