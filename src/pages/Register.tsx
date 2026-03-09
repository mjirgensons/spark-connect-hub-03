import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  ShoppingBag,
  Wrench,
  Store,
  UserPlus,
  Loader2,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { z } from "zod";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type UserType = "client" | "contractor" | "seller";

const roles: { type: UserType; icon: React.ElementType; label: string; sub: string }[] = [
  { type: "client", icon: ShoppingBag, label: "I'm a Buyer", sub: "Browse and purchase premium cabinetry" },
  { type: "seller", icon: Store, label: "I'm a Seller", sub: "List and sell your cabinet products" },
  { type: "contractor", icon: Wrench, label: "I'm a Contractor", sub: "Find projects and connect with clients" },
];

const provinces = ["ON", "BC", "AB", "QC", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "YT", "NU"];

const postalCodeRegex = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;

const baseSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Register = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);

  // Shared fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Seller fields
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [gstHstNumber, setGstHstNumber] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");

  // OTP state
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start cooldown timer
  const startCooldown = useCallback(() => {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const sendOtp = async (targetEmail: string) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-verification-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to send verification code", variant: "destructive" });
        return false;
      }
      startCooldown();
      return true;
    } catch {
      toast({ title: "Failed to send verification code", variant: "destructive" });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    const parsed = baseSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      toast({ title: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }

    // Seller-specific validation
    if (selectedRole === "seller") {
      if (!businessName.trim()) {
        toast({ title: "Business Name is required", variant: "destructive" });
        return;
      }
      if (!businessType) {
        toast({ title: "Business Type is required", variant: "destructive" });
        return;
      }
      if (!phone.trim()) {
        toast({ title: "Phone is required", variant: "destructive" });
        return;
      }
      if (!street.trim() || !city.trim() || !province || !postalCode.trim()) {
        toast({ title: "Complete business address is required", variant: "destructive" });
        return;
      }
      if (!postalCodeRegex.test(postalCode.trim())) {
        toast({ title: "Invalid postal code format (e.g. A1A 1A1)", variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      // Build metadata
      const metadata: Record<string, unknown> = {
        full_name: parsed.data.fullName,
        user_type: selectedRole,
      };

      if (selectedRole === "seller") {
        metadata.company_name = businessName.trim();
        metadata.business_type = businessType;
        metadata.phone = phone.trim();
        metadata.gst_hst_number = gstHstNumber.trim() || null;
        metadata.business_address = {
          street: street.trim(),
          city: city.trim(),
          province,
          postal_code: postalCode.trim(),
        };
        metadata.website = website.trim() || null;
        metadata.bio = bio.trim() || null;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: metadata,
        },
      });

      if (signUpError) {
        toast({ title: "Registration failed", description: signUpError.message, variant: "destructive" });
        return;
      }

      if (selectedRole === "seller") {
        // Fire-and-forget n8n webhook notification
        try {
          supabase.functions.invoke('notify-seller-registration', {
            body: {
              seller_name: parsed.data.fullName,
              company_name: businessName.trim(),
              email: parsed.data.email,
              phone: phone.trim(),
              business_type: businessType,
              website: website.trim() || null,
              description: bio.trim() || null,
            },
          }).catch((err) => console.warn('[webhook] notify-seller-registration failed:', err));
        } catch (err) {
          console.warn('[webhook] notify-seller-registration error:', err);
        }
      }

      // Send OTP and show verification UI
      const sent = await sendOtp(parsed.data.email);
      if (sent) {
        setShowOtp(true);
        toast({
          title: "Account created!",
          description: "Please verify your email with the code we sent.",
        });
      } else {
        // Even if OTP send fails, show the OTP screen so user can retry
        setShowOtp(true);
      }
    } catch {
      toast({ title: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({ title: "Please enter the 6-digit code", variant: "destructive" });
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otpCode, user_type: selectedRole }),
      });
      const result = await res.json();

      if (result.success) {
        // Mark email as verified in user metadata
        await supabase.auth.updateUser({
          data: { email_verified_at: new Date().toISOString() },
        });

        toast({ title: "Email verified!", description: "Welcome to FitMatch." });

        // Redirect based on role
        if (selectedRole === "seller") {
          navigate("/seller/pending");
        } else if (selectedRole === "client") {
          navigate("/client/dashboard");
        } else {
          navigate("/login");
        }
      } else {
        toast({
          title: "Verification failed",
          description: result.error || "Invalid or expired code.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Verification failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtpLoading(true);
    await sendOtp(email.trim().toLowerCase());
    setOtpLoading(false);
    toast({ title: "New code sent!", description: `Check ${email} for the new verification code.` });
  };

  const sectionClass = "space-y-3";
  const inputClass = "mt-1 border-2 border-foreground";

  // OTP Verification View
  if (showOtp) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-12 max-w-md">
          <div
            className="border-2 border-foreground bg-card p-6 md:p-8 space-y-6"
            style={{ boxShadow: "6px 6px 0 0 hsl(var(--foreground))" }}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-serif text-2xl font-bold">Verify Your Email</h2>
              <p className="text-muted-foreground text-sm">
                We sent a 6-digit verification code to{" "}
                <span className="font-semibold text-foreground">{email}</span>
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={otpLoading || otpCode.length !== 6}
              className="w-full"
            >
              {otpLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="flex flex-col items-center gap-3 text-sm">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || otpLoading}
                className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Resend Code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowOtp(false);
                  setOtpCode("");
                }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to registration
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-center mb-2">Join FitMatch</h1>
        <p className="text-center text-muted-foreground mb-8">
          Create your account to get started.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Common fields always visible */}
          <div
            className="border-2 border-foreground bg-card p-6 md:p-8 space-y-6 mb-8"
            style={{ boxShadow: "6px 6px 0 0 hsl(var(--foreground))" }}
          >
            <div className={sectionClass}>
              <Label className="font-sans text-sm font-semibold">Full Name *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required />
            </div>
            <div className={sectionClass}>
              <Label className="font-sans text-sm font-semibold">Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
            </div>
            <div className={sectionClass}>
              <Label className="font-sans text-sm font-semibold">Password *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required minLength={6} />
            </div>
          </div>

          {/* Role selection cards */}
          <h2 className="font-serif text-xl font-bold mb-4">I am a…</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {roles.map((r) => {
              const isSelected = selectedRole === r.type;
              return (
                <button
                  key={r.type}
                  type="button"
                  onClick={() => setSelectedRole(r.type)}
                  className={`border-2 p-6 bg-card text-left transition-colors ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-foreground hover:bg-muted"
                  }`}
                  style={{ boxShadow: isSelected ? "4px 4px 0 0 hsl(var(--primary))" : "4px 4px 0 0 hsl(var(--foreground))" }}
                >
                  <r.icon className={`w-8 h-8 mb-3 ${isSelected ? "text-primary" : "text-foreground"}`} />
                  <h3 className="font-sans font-bold text-base mb-1">{r.label}</h3>
                  <p className="text-sm text-muted-foreground">{r.sub}</p>
                </button>
              );
            })}
          </div>

          {/* Conditional seller fields */}
          {selectedRole === "seller" && (
            <div
              className="border-2 border-foreground bg-card p-6 md:p-8 space-y-6 mb-8"
              style={{ boxShadow: "6px 6px 0 0 hsl(var(--foreground))" }}
            >
              <h3 className="font-serif text-lg font-bold">Business Details</h3>

              <div className={sectionClass}>
                <Label className="font-sans text-sm font-semibold">Business Name *</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} required />
              </div>

              <div className={sectionClass}>
                <Label className="font-sans text-sm font-semibold">Business Type *</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                    <SelectItem value="Corporation">Corporation</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={sectionClass}>
                <Label className="font-sans text-sm font-semibold">Phone *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} required />
              </div>

              <div className={sectionClass}>
                <Label className="font-sans text-sm font-semibold">GST/HST Number</Label>
                <Input value={gstHstNumber} onChange={(e) => setGstHstNumber(e.target.value)} className={inputClass} placeholder="Enter if GST/HST registered" />
              </div>

              <div className={sectionClass}>
                <Label className="font-sans text-sm font-semibold">Street Address *</Label>
                <Input value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} required />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className={sectionClass}>
                  <Label className="font-sans text-sm font-semibold">City *</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} required />
                </div>
                <div className={sectionClass}>
                  <Label className="font-sans text-sm font-semibold">Province *</Label>
                  <Select value={province} onValueChange={setProvince}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={sectionClass}>
                <Label className="font-sans text-sm font-semibold">Postal Code *</Label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} placeholder="A1A 1A1" required />
              </div>

              <div className={sectionClass}>
                <Label className="font-sans text-sm font-semibold">Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://" />
              </div>

              <div className={sectionClass}>
                <Label className="font-sans text-sm font-semibold">Short Description</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={inputClass + " min-h-[100px]"}
                  maxLength={500}
                  placeholder="Tell buyers about your business and products"
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading || !selectedRole} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-foreground underline">
            Sign In
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  );
};

export default Register;
