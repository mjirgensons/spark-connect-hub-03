import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  dimensions: string;
  maxStock: number;
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
  itemCount: items.reduce((s, i) => s + i.quantity, 0),
  subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
});

const isDeliveryItem = (name: string, productId: string) =>
  /delivery|shipping/i.test(name) || (productId.includes("_option_") && /delivery|shipping/i.test(name));

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.productId === action.payload.productId);
      const maxQty = isDeliveryItem(action.payload.name, action.payload.productId) ? 1 : action.payload.maxStock;
      if (existing) {
        // Already in cart — update quantity (but not for duplicates of add-ons)
        if (existing.productId.includes("_option_")) return state;
        const items = state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, quantity: Math.min(i.quantity + 1, maxQty) }
            : i
        );
        return recalc(items);
      }
      return recalc([...state.items, { ...action.payload, quantity: 1, maxStock: maxQty }]);
    }
    case "REMOVE_ITEM":
      return recalc(state.items.filter((i) => i.productId !== action.payload));
    case "UPDATE_QUANTITY": {
      const { productId, quantity } = action.payload;
      if (quantity < 1) return state;
      const items = state.items.map((i) => {
        if (i.productId !== productId) return i;
        const max = isDeliveryItem(i.name, i.productId) ? 1 : i.maxStock;
        return { ...i, quantity: Math.min(quantity, max) };
      });
      return recalc(items);
    }
    case "CLEAR_CART":
      return recalc([]);
    case "HYDRATE": {
      // Deduplicate by productId — keep first occurrence
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

  // Hydrate from localStorage on mount
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

  // Persist to localStorage on change
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
