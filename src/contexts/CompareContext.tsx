import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "fitmatch_compare";
const MAX_COMPARE = 4;

interface CompareContextType {
  compareIds: string[];
  addToCompare: (productId: string) => void;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  compareCount: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  const addToCompare = useCallback((productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) return prev;
      if (prev.length >= MAX_COMPARE) {
        toast({ title: "Comparison full", description: "You can compare up to 4 products. Remove one first.", variant: "destructive" });
        return prev;
      }
      return [...prev, productId];
    });
  }, [toast]);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  const isInCompare = useCallback((productId: string) => compareIds.includes(productId), [compareIds]);

  const clearCompare = useCallback(() => setCompareIds([]), []);

  return (
    <CompareContext.Provider value={{ compareIds, addToCompare, removeFromCompare, isInCompare, clearCompare, compareCount: compareIds.length }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
};
