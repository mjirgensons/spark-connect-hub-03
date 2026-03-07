import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  dimensions: string;
  maxStock: number;
  itemType?: 'main' | 'addon' | 'delivery';
  // Delivery fields (per-product)
  deliveryChoice?: 'delivery' | 'pickup' | null;
  deliveryPrice?: number;
  deliveryPrepDays?: number;
  pickupAddress?: string;
  pickupCity?: string;
  pickupProvince?: string;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; payload: CartItem[] };

const recalc = (items: CartItem[]): CartState => ({
  items,
  itemCount: items.filter((i) => i.itemType === 'main' || (!i.itemType && !i.productId.includes("_option_"))).length,
  subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
});

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const pid = action.payload.productId;
      const isAddon = pid.includes("_option_");

      if (!isAddon) {
        // MAIN PRODUCT: remove old main + ALL its old add-ons, then add fresh
        const cleaned = state.items.filter(
          (i) => i.productId !== pid && !i.productId.startsWith(pid + "_option_")
        );
        return recalc([...cleaned, { ...action.payload, itemType: 'main' as const, quantity: 1 }]);
      }

      // ADD-ON: never remove anything. Just check for duplicate — skip if exists, append if new.
      if (state.items.some((i) => i.productId === pid)) {
        return state; // already exists, skip
      }
      return recalc([...state.items, { ...action.payload, itemType: 'addon' as const, quantity: 1 }]);
    }
    case "REMOVE_ITEM":
      return recalc(state.items.filter((i) => i.productId !== action.payload));
    case "UPDATE_QUANTITY": {
      const { productId, quantity } = action.payload;
      if (quantity < 1) return state;
      const items = state.items.map((i) => {
        if (i.productId !== productId) return i;
        return { ...i, quantity: Math.min(quantity, i.maxStock) };
      });
      return recalc(items);
    }
    case "CLEAR_CART":
      return recalc([]);
    case "HYDRATE": {
      const seen = new Set<string>();
      const deduped = action.payload.filter((item) => {
        if (seen.has(item.productId)) return false;
        seen.add(item.productId);
        return true;
      });
      return recalc(deduped);
    }
    default:
      return state;
  }
};

interface CartContextValue extends CartState {
  dispatch: React.Dispatch<CartAction>;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], itemCount: 0, subtotal: 0 });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fm_cart");
      if (saved) {
        const items = JSON.parse(saved) as CartItem[];
        if (Array.isArray(items) && items.length > 0) {
          dispatch({ type: "HYDRATE", payload: items });
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("fm_cart", JSON.stringify(state.items));
  }, [state.items]);

  const getItemQuantity = (productId: string) =>
    state.items.find((i) => i.productId === productId)?.quantity ?? 0;

  return (
    <CartContext.Provider value={{ ...state, dispatch, getItemQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
