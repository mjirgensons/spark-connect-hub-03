import { Lock, RotateCcw } from "lucide-react";

const badges = [
  { icon: Lock, label: "Secure Checkout" },
  { icon: RotateCcw, label: "30-Day Returns" },
];

const TrustBadgeBar = () => (
  <div className="flex flex-wrap justify-center gap-4 md:gap-8 py-3">
    {badges.map((b) => (
      <span key={b.label} className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
        <b.icon className="w-4 h-4" />
        {b.label}
      </span>
    ))}
  </div>
);

export default TrustBadgeBar;
