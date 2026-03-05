import { ReactNode } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface SellerGuardProps {
  children: ReactNode;
}

/**
 * Route guard for /seller/* pages.
 * Admins with ?adminView=sellerId bypass seller checks.
 */
const SellerGuard = ({ children }: SellerGuardProps) => {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [searchParams] = useSearchParams();
  const adminViewSellerId = searchParams.get("adminView");

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["is-admin-check", session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_emails")
        .select("email")
        .eq("email", session?.user?.email ?? "")
        .maybeSingle();
      return !!data;
    },
    enabled: !!session?.user?.email && !!adminViewSellerId,
  });

  if (authLoading || profileLoading || (adminViewSellerId && adminLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Admin impersonation bypass
  if (adminViewSellerId && isAdmin) {
    return <>{children}</>;
  }

  if (!profile || profile.user_type !== "seller") {
    return <Navigate to="/" replace />;
  }

  const sellerStatus = (profile as Record<string, unknown>).seller_status as string | null;
  if (sellerStatus !== "approved") {
    return <Navigate to="/seller/pending" replace />;
  }

  return <>{children}</>;
};

export default SellerGuard;
