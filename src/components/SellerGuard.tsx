import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

interface SellerGuardProps {
  children: ReactNode;
}

/**
 * Route guard for /seller/* pages.
 * Requires: authenticated + user_type='seller' + seller_status='approved'.
 * Pending sellers get redirected to /seller/pending.
 */
const SellerGuard = ({ children }: SellerGuardProps) => {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile || profile.user_type !== "seller") {
    return <Navigate to="/" replace />;
  }

  // Check seller_status — field may be null/undefined for legacy rows
  const sellerStatus = (profile as Record<string, unknown>).seller_status as string | null;
  if (sellerStatus !== "approved") {
    return <Navigate to="/seller/pending" replace />;
  }

  return <>{children}</>;
};

export default SellerGuard;
