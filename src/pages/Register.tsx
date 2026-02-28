import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Home,
  Wrench,
  Store,
  Building2,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import { z } from "zod";

type UserType = "client" | "contractor" | "seller" | "builder";

const roles: { type: UserType; icon: React.ElementType; label: string; sub: string }[] = [
  { type: "client", icon: Home, label: "I'm a Homeowner", sub: "Buy cabinets for your renovation" },
  { type: "contractor", icon: Wrench, label: "I'm a Contractor", sub: "Get matched to local projects" },
  { type: "seller", icon: Store, label: "I Sell Cabinets / Products", sub: "List inventory and reach buyers" },
  { type: "builder", icon: Building2, label: "I'm a Builder / Developer", sub: "Buy in volume for projects" },
];

const tradeTypes = [
  "General Contractor",
  "Cabinet Installer",
  "Plumber",
  "Electrician",
  "Drywall / Wall Builder",
  "Countertop Installer",
  "Painter",
];

const gtaAreas = [
  "Toronto",
  "North York",
  "Scarborough",
  "Etobicoke",
  "Mississauga",
  "Brampton",
  "Vaughan",
  "Richmond Hill",
  "Markham",
  "Oakville",
  "Burlington",
  "Hamilton",
  "Ajax",
  "Pickering",
  "Oshawa",
  "Newmarket",
];

const clientNeeds = ["Kitchen", "Vanity", "Bathroom", "Closet", "Other"];

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

  // Client fields
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  // Contractor fields
  const [companyName, setCompanyName] = useState("");
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState("");

  // Seller fields
  const [storeName, setStoreName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [website, setWebsite] = useState("");

  // Builder fields
  const [builderCompany, setBuilderCompany] = useState("");
  const [builderType, setBuilderType] = useState("");
  const [annualVolume, setAnnualVolume] = useState("");

  const toggleList = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    const parsed = baseSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      toast({ title: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) {
        toast({ title: "Registration failed", description: signUpError.message, variant: "destructive" });
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        toast({ title: "Registration failed", description: "No user ID returned", variant: "destructive" });
        return;
      }

      // Build metadata based on role
      let extraFields: Record<string, unknown> = {};
      switch (selectedRole) {
        case "client":
          extraFields = { phone, postal_code: postalCode, looking_for: lookingFor };
          break;
        case "contractor":
          extraFields = {
            company_name: companyName || null,
            trades: selectedTrades,
            service_areas: serviceAreas,
            years_experience: yearsExperience,
          };
          break;
        case "seller":
          extraFields = {
            company_name: storeName,
            seller_type: companyType,
            website: website || null,
          };
          break;
        case "builder":
          extraFields = {
            company_name: builderCompany,
            builder_type: builderType,
            annual_volume: annualVolume,
          };
          break;
      }

      // Insert profile — will only succeed after email confirmation,
      // but we attempt it now. If RLS blocks (user not confirmed yet),
      // we handle gracefully.
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        user_type: selectedRole,
        full_name: parsed.data.fullName,
        email: parsed.data.email,
        phone: phone || null,
        company_name: companyName || storeName || builderCompany || null,
        location: postalCode || null,
      });

      if (profileError) {
        // Profile insert may fail if email not confirmed yet — that's OK
        console.warn("Profile insert deferred:", profileError.message);
      }

      toast({
        title: "Check your email!",
        description: "We've sent a confirmation link to " + parsed.data.email + ". Please verify your email to sign in.",
      });

      navigate("/login");
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
          Choose your role to get started.
        </p>

        {/* Role selection */}
        {!selectedRole ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {roles.map((r) => (
              <button
                key={r.type}
                onClick={() => setSelectedRole(r.type)}
                className="border-2 border-foreground p-6 bg-card text-left hover:bg-muted transition-colors"
                style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
              >
                <r.icon className="w-8 h-8 mb-3 text-foreground" />
                <h3 className="font-sans font-bold text-base mb-1">{r.label}</h3>
                <p className="text-sm text-muted-foreground">{r.sub}</p>
              </button>
            ))}
          </div>
        ) : (
          <div>
            {/* Selected role indicator */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setSelectedRole(null)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={16} /> Change role
              </button>
              <Badge variant="outline" className="border-foreground font-mono text-xs uppercase">
                {roles.find((r) => r.type === selectedRole)?.label}
              </Badge>
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-2 border-foreground bg-card p-6 md:p-8 space-y-6"
              style={{ boxShadow: "6px 6px 0 0 hsl(var(--foreground))" }}
            >
              {/* Common fields */}
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

              {/* === CLIENT FIELDS === */}
              {selectedRole === "client" && (
                <>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">Phone (optional)</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
                  </div>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">Postal Code</Label>
                    <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} placeholder="e.g. M5V 2T6" />
                  </div>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">What are you looking for?</Label>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {clientNeeds.map((n) => (
                        <label key={n} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={lookingFor.includes(n)} onCheckedChange={() => toggleList(lookingFor, n, setLookingFor)} />
                          <span className="text-sm">{n}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* === CONTRACTOR FIELDS === */}
              {selectedRole === "contractor" && (
                <>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">Company Name (optional)</Label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
                  </div>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">Trade Types *</Label>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {tradeTypes.map((t) => (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={selectedTrades.includes(t)} onCheckedChange={() => toggleList(selectedTrades, t, setSelectedTrades)} />
                          <span className="text-sm">{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">Service Areas</Label>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {gtaAreas.map((a) => (
                        <label key={a} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={serviceAreas.includes(a)} onCheckedChange={() => toggleList(serviceAreas, a, setServiceAreas)} />
                          <span className="text-sm">{a}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">Years of Experience</Label>
                    <Input type="number" min="0" max="60" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} className={inputClass} />
                  </div>
                </>
              )}

              {/* === SELLER FIELDS === */}
              {selectedRole === "seller" && (
                <>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">Company / Store Name *</Label>
                    <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className={inputClass} required />
                  </div>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">Company Type *</Label>
                    <Select value={companyType} onValueChange={setCompanyType}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cabinet Maker">Cabinet Maker</SelectItem>
                        <SelectItem value="Reseller">Reseller</SelectItem>
                        <SelectItem value="Appliance Vendor">Appliance Vendor</SelectItem>
                        <SelectItem value="Countertop Supplier">Countertop Supplier</SelectItem>
                        <SelectItem value="Fixture Supplier">Fixture Supplier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">Website (optional)</Label>
                    <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://" />
                  </div>
                </>
              )}

              {/* === BUILDER FIELDS === */}
              {selectedRole === "builder" && (
                <>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">Company Name *</Label>
                    <Input value={builderCompany} onChange={(e) => setBuilderCompany(e.target.value)} className={inputClass} required />
                  </div>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">Company Type *</Label>
                    <Select value={builderType} onValueChange={setBuilderType}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Developer">Developer</SelectItem>
                        <SelectItem value="Architect">Architect</SelectItem>
                        <SelectItem value="Designer">Designer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={sectionClass}>
                    <Label className="font-sans text-sm font-semibold">Typical Annual Project Volume</Label>
                    <Input value={annualVolume} onChange={(e) => setAnnualVolume(e.target.value)} className={inputClass} placeholder="e.g. 10-20 units" />
                  </div>
                </>
              )}

              <Button type="submit" disabled={loading} className="w-full">
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
          </div>
        )}

        {!selectedRole && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-foreground underline">
              Sign In
            </Link>
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Register;
