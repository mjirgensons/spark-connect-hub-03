import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Wrench,
  Store,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import { z } from "zod";

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

        toast({
          title: "Check your email!",
          description: "Verify your email, then your seller application will be reviewed.",
        });
        navigate("/seller/pending");
      } else {
        toast({
          title: "Check your email!",
          description: "We've sent a confirmation link to " + parsed.data.email + ". Please verify your email to sign in.",
        });
        navigate("/login");
      }
    } catch {
      toast({ title: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sectionClass = "space-y-3";
  const inputClass = "mt-1 border-2 border-foreground";

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
            <UserPlus className="w-4 h-4 mr-2" />
            {loading ? "Creating account…" : "Create Account"}
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
