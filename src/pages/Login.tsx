import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { LogIn } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast({ title: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
        return;
      }

      // Fetch profile to determine redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Something went wrong", variant: "destructive" });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, seller_status")
        .eq("id", user.id)
        .single();

      if (profile?.user_type) {
        if (profile.user_type === "seller" && profile.seller_status !== "approved") {
          navigate("/seller/pending");
        } else {
          navigate(`/${profile.user_type}/dashboard`);
        }
      } else {
        // Fallback — might be admin or profile not created yet
        navigate("/");
      }
    } catch {
      toast({ title: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-12">
        <div
          className="w-full max-w-md border-2 border-foreground bg-card p-8"
          style={{ boxShadow: "6px 6px 0 0 hsl(var(--foreground))" }}
        >
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">Sign In to FitMatch</h1>
            <p className="text-sm text-muted-foreground">Welcome back. Enter your credentials below.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="font-sans text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 border-2 border-foreground"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="font-sans text-sm font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 border-2 border-foreground"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              onClick={() => toast({ title: "Coming soon", description: "Password reset is not yet available." })}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Forgot password?
            </button>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-foreground underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
