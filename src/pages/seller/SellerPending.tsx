import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Clock, CheckCircle, Loader2, RefreshCw } from "lucide-react";

const SellerPending = () => {
  const navigate = useNavigate();
  const [approved, setApproved] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkStatus = useCallback(async (showToast = false) => {
    setChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChecking(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("seller_status")
        .eq("id", user.id)
        .single();

      if (profile?.seller_status === "approved") {
        setApproved(true);
      } else if (showToast) {
        toast({ title: "Your registration is still under review" });
      }
    } catch {
      if (showToast) {
        toast({ title: "Could not check status", variant: "destructive" });
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus(false);
  }, [checkStatus]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="font-serif text-3xl font-bold text-foreground">FitMatch</h1>

        <div className="border-2 border-foreground bg-card p-8 space-y-4" style={{ boxShadow: "6px 6px 0 0 hsl(var(--foreground))" }}>
          {checking && !approved ? (
            <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
          ) : approved ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <h2 className="font-serif text-2xl font-bold text-green-700">Your Account Has Been Approved!</h2>
              <p className="text-muted-foreground">
                Welcome to FitMatch! You now have full access to the seller portal. Start listing your products and managing your business.
              </p>
              <Button className="w-full mt-2" onClick={() => navigate("/seller/dashboard")}>
                Go to Seller Portal
              </Button>
            </>
          ) : (
            <>
              <Clock className="w-12 h-12 text-primary mx-auto" />
              <h2 className="font-serif text-2xl font-bold text-foreground">Registration Under Review</h2>
              <p className="text-muted-foreground">
                Thank you for registering as a seller on FitMatch. Our team is reviewing your application and will notify you by email once approved. This usually takes 1–2 business days.
              </p>
              <Button
                variant="outline"
                className="w-full border-2 border-foreground mt-2"
                onClick={() => checkStatus(true)}
                disabled={checking}
              >
                {checking ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Check Status
              </Button>
            </>
          )}
        </div>

        {!approved && (
          <div className="flex flex-col gap-3">
            <Button asChild variant="outline" className="border-2 border-foreground">
              <Link to="/">Return to Homepage</Link>
            </Button>
            <Link to="/login" className="text-sm font-semibold text-foreground underline hover:text-primary">
              Log In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerPending;
