import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "fitmatch_wishlist";

interface WishlistContextValue {
  items: string[];
  loading: boolean;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextValue>({
  items: [],
  loading: true,
  toggleWishlist: () => {},
  isInWishlist: () => false,
  wishlistCount: 0,
});

export const useWishlist = () => useContext(WishlistContext);

const readLocalStorage = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocalStorage = (items: string[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const prevUserId = useRef<string | null>(null);

  // Fetch from Supabase for authenticated users
  const fetchFromSupabase = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", userId);
    return (data || []).map((r) => r.product_id);
  }, []);

  // Merge localStorage into Supabase on login
  const mergeOnLogin = useCallback(async (userId: string) => {
    const localItems = readLocalStorage();
    if (localItems.length > 0) {
      const rows = localItems.map((pid) => ({ user_id: userId, product_id: pid }));
      await supabase.from("wishlists").upsert(rows, { onConflict: "user_id,product_id", ignoreDuplicates: true });
      localStorage.removeItem(STORAGE_KEY);
    }
    const serverItems = await fetchFromSupabase(userId);
    setItems(serverItems);
  }, [fetchFromSupabase]);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      const justLoggedIn = prevUserId.current === null && user.id;
      prevUserId.current = user.id;

      if (justLoggedIn) {
        mergeOnLogin(user.id).finally(() => setLoading(false));
      } else {
        fetchFromSupabase(user.id).then((ids) => {
          setItems(ids);
          setLoading(false);
        });
      }
    } else {
      prevUserId.current = null;
      setItems(readLocalStorage());
      setLoading(false);
    }
  }, [user, authLoading, fetchFromSupabase, mergeOnLogin]);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const isIn = items.includes(productId);

      if (user) {
        // Optimistic update
        setItems((prev) => (isIn ? prev.filter((id) => id !== productId) : [...prev, productId]));
        if (isIn) {
          await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
        } else {
          await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
        }
      } else {
        const updated = isIn ? items.filter((id) => id !== productId) : [...items, productId];
        setItems(updated);
        writeLocalStorage(updated);
      }
    },
    [items, user]
  );

  const isInWishlist = useCallback((productId: string) => items.includes(productId), [items]);

  return (
    <WishlistContext.Provider value={{ items, loading, toggleWishlist, isInWishlist, wishlistCount: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
};
