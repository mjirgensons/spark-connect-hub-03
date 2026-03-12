import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

interface SortableTableHeadProps {
  label: string;
  sortKey: string;
  currentSort: string | null;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

const SortableTableHead = ({
  label,
  sortKey,
  currentSort,
  currentDirection,
  onSort,
  className,
}: SortableTableHeadProps) => {
  const isActive = currentSort === sortKey;

  return (
    <TableHead
      className={cn("py-2 px-3 cursor-pointer select-none hover:bg-accent/50 transition-colors", className)}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && currentDirection === "asc" ? (
          <ArrowUp className="w-3 h-3 text-foreground" />
        ) : isActive && currentDirection === "desc" ? (
          <ArrowDown className="w-3 h-3 text-foreground" />
        ) : (
          <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />
        )}
      </span>
    </TableHead>
  );
};

export function useTableSort<T>(defaultKey: string | null = null, defaultDir: SortDirection = "desc") {
  const [sortKey, setSortKey] = (await import("react")).useState<string | null>(defaultKey);
  const [sortDirection, setSortDirection] = (await import("react")).useState<SortDirection>(defaultDir);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
      if (sortDirection === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortData = (data: T[]) => {
    if (!sortKey || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  };

  return { sortKey, sortDirection, handleSort, sortData };
}

export default SortableTableHead;
