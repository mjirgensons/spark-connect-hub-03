import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, Wrench, Target, TrendingDown, Shield, Lock, Award,
  Users, Star, DollarSign, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Package, Wrench, Target, TrendingDown, Shield, Lock, Award,
  Users, Star, DollarSign, Zap,
};

const TrustSignals = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["trust-signals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trust_signals")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const stats = data?.filter((s) => s.type === "stat") ?? [];
  const guarantees = data?.filter((s) => s.type === "guarantee") ?? [];

  return (
    <section className="bg-muted/50 py-16 md:py-20">
      <div className="container mx-auto px-4">
        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : stats.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => {
              const Icon = iconMap[s.icon_name] || Package;
              return (
                <div key={s.id} className="flex flex-col items-center">
                  <Icon className="w-6 h-6 text-primary mb-2" />
                  <span className="font-serif text-3xl md:text-4xl font-bold text-foreground">{s.title}</span>
                  <span className="text-sm text-muted-foreground mt-1">{s.label}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Guarantees */}
        {isLoading ? (
          <div className="border-t border-border mt-12 pt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ) : guarantees.length > 0 ? (
          <div className="border-t border-border mt-12 pt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {guarantees.map((g) => {
                const Icon = iconMap[g.icon_name] || Package;
                return (
                  <Card key={g.id} className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--foreground))] sm:shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-5 flex items-start gap-4">
                    <Icon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{g.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{g.label}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : null}

        <p className="text-center text-sm text-muted-foreground mt-12">
          Trusted by contractors across the GTA
        </p>
      </div>
    </section>
  );
};

export default TrustSignals;
