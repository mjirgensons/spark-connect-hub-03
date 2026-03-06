import React, { createContext, useContext, useState, ReactNode } from "react";

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
}

interface CheckoutContextValue extends CheckoutState {
  setStep: (s: number) => void;
  setInfo: (i: CheckoutInfo) => void;
  reset: () => void;
}

const initial: CheckoutState = {
  step: 1,
  info: null,
};

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

export const CheckoutProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<CheckoutState>(initial);

  const setStep = (step: number) => setState((s) => ({ ...s, step }));
  const setInfo = (info: CheckoutInfo) => setState((s) => ({ ...s, info }));
  const reset = () => setState(initial);

  return (
    <CheckoutContext.Provider
      value={{ ...state, setStep, setInfo, reset }}
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
