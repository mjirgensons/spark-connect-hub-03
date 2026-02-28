import React, { createContext, useContext, useState, ReactNode } from "react";

export type ShippingMethod = "standard" | "express" | "pickup";

export interface CheckoutInfo {
  email: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  saveAddress: boolean;
}

export interface CheckoutState {
  step: number;
  info: CheckoutInfo | null;
  shippingMethod: ShippingMethod | null;
  shippingCost: number;
}

interface CheckoutContextValue extends CheckoutState {
  setStep: (s: number) => void;
  setInfo: (i: CheckoutInfo) => void;
  setShippingMethod: (m: ShippingMethod) => void;
  setShippingCost: (c: number) => void;
  reset: () => void;
}

const initial: CheckoutState = {
  step: 1,
  info: null,
  shippingMethod: null,
  shippingCost: 0,
};

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<CheckoutState>(initial);

  const setStep = (step: number) => setState((s) => ({ ...s, step }));
  const setInfo = (info: CheckoutInfo) => setState((s) => ({ ...s, info }));
  const setShippingMethod = (shippingMethod: ShippingMethod) =>
    setState((s) => ({ ...s, shippingMethod }));
  const setShippingCost = (shippingCost: number) =>
    setState((s) => ({ ...s, shippingCost }));
  const reset = () => setState(initial);

  return (
    <CheckoutContext.Provider
      value={{ ...state, setStep, setInfo, setShippingMethod, setShippingCost, reset }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used within CheckoutProvider");
  return ctx;
};
