export const MM_TO_INCH = 0.0393701;

export const fmtDim = (mm: number): string | null => {
  if (!mm || mm <= 0) return null;
  return `${mm}mm / ${(mm * MM_TO_INCH).toFixed(1)}″`;
};

export const fmt2 = (n: number): string =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const getOptPrice = (opt: any): number => {
  if (opt.inclusion_status === "included") return 0;
  const disc = Number(opt.price_discounted);
  const retail = Number(opt.price_retail);
  return disc > 0 ? disc : retail > 0 ? retail : 0;
};

/**
 * Returns true if the option is a delivery/shipping type (should be excluded from add-on lists).
 */
export const isDeliveryOption = (opt: any): boolean => {
  const nameLower = (opt.option_name || "").toLowerCase();
  const typeLower = (opt.option_type || "").toLowerCase();
  return (
    nameLower.includes("delivery") ||
    nameLower.includes("shipping") ||
    typeLower === "delivery" ||
    typeLower === "shipping"
  );
};
