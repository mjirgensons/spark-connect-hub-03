import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackFormView, trackFormSubmit } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Send, ChevronDown, ChevronUp, Info } from "lucide-react";

const layoutDescriptions: Record<string, string> = {
  "single-wall": "All cabinets along one wall — ideal for smaller kitchens or open-plan spaces.",
  "galley": "Two parallel walls of cabinets — efficient for narrow kitchens with maximum storage.",
  "l-shape": "Cabinets on two adjacent walls — versatile layout offering good counter space.",
  "u-shape": "Cabinets on three walls — maximum storage and workspace for larger kitchens.",
  "island": "Includes a freestanding island — perfect for open kitchens with social entertaining.",
  "other-layout": "A custom configuration — describe below so we can tailor our recommendations.",
};

const styleDescriptions: Record<string, string> = {
  "modern": "Clean lines, flat-panel doors, minimal hardware — sleek and contemporary.",
  "traditional": "Raised-panel doors, ornate details, warm tones — timeless and elegant.",
  "transitional": "A blend of modern simplicity and classic warmth — balanced and versatile.",
  "industrial": "Raw materials, dark finishes, metal accents — bold and urban.",
  "other-style": "Something unique — describe your vision so we can match it.",
};

const CTA = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    layout: "",
    primaryWall: "",
    secondaryWall: "",
    ceilingHeight: "",
    obstacles: "",
    style: "",
    budget: "",
    bundle: "",
    timeline: "",
    layoutOther: "",
    styleOther: "",
  });

  const [expandedSections, setExpandedSections] = useState({
    contact: true,
    project: false,
    preferences: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [caslConsent, setCaslConsent] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return "Please enter your name.";
    if (!formData.email.trim()) return "Please enter your email.";
    if (!formData.phone.trim()) return "Please enter your phone number.";
    if (!formData.projectType) return "Please select a project type.";
    if (!formData.layout) return "Please select a kitchen layout.";
    if (!formData.primaryWall.trim()) return "Please enter the primary wall length.";
    if (showSecondaryWall && !formData.secondaryWall.trim()) return "Please enter the secondary wall length for your layout.";
    if (!formData.ceilingHeight.trim()) return "Please enter the ceiling height.";
    if (!formData.style) return "Please select a style.";
    if (!formData.budget) return "Please select a budget range.";
    if (!formData.bundle) return "Please select a bundle preference.";
    if (!formData.timeline) return "Please select a timeline.";
    if (formData.layout === "other-layout" && !formData.layoutOther.trim()) return "Please describe your layout.";
    if (formData.style === "other-style" && !formData.styleOther.trim()) return "Please describe your style.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!caslConsent) {
      toast({ title: "Consent required", description: "Please consent to receive communications to submit your request.", variant: "destructive" });
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      toast({ title: "Missing information", description: validationError, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        projectType: formData.projectType,
        layout: formData.layout,
        primaryWall: formData.primaryWall.trim(),
        secondaryWall: showSecondaryWall ? formData.secondaryWall.trim() : "",
        ceilingHeight: formData.ceilingHeight.trim(),
        obstacles: formData.obstacles.trim(),
        style: formData.style,
        budget: formData.budget,
        bundle: formData.bundle,
        timeline: formData.timeline,
        layoutOther: formData.layout === "other-layout" ? formData.layoutOther.trim() : "",
        styleOther: formData.style === "other-style" ? formData.styleOther.trim() : "",
        caslConsent: true,
      };

      const { data, error } = await supabase.functions.invoke("submit-cabinet-match", {
        body: payload,
      });
      if (error) throw error;
      trackFormSubmit("cabinet-match", { projectType: formData.projectType, layout: formData.layout, budget: formData.budget });
      setSubmitted(true);
    } catch (err: any) {
      console.error("Submit error:", err);
      toast({
        title: "Submission failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSecondaryWall = formData.layout === "l-shape" || formData.layout === "u-shape";

  useEffect(() => {
    trackFormView("cabinet-match");
  }, []);

  if (submitted) {
    return (
      <section id="contact" className="py-20 md:py-32 bg-foreground relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[hsl(var(--gold))]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[hsl(var(--gold))]/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 border-2 border-[hsl(var(--gold))] rounded-none flex items-center justify-center">
              <Send className="w-8 h-8 text-[hsl(var(--gold))]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-background mb-4">
              Thank You, {formData.name || "Friend"}!
            </h2>
            <p className="text-lg text-background/70 mb-2">
              Our cabinet matching engine is processing your requirements.
            </p>
            <p className="text-background/60">
              Expect tailored recommendations on WhatsApp to <span className="text-[hsl(var(--gold))] font-semibold">your number</span> within 24 hours.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 md:py-32 bg-foreground relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-[hsl(var(--gold))]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[hsl(var(--gold))]/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-background mb-4">
            Match Your Perfect Cabinets
          </h2>
          <p className="text-lg text-background/70">
            Answer a few questions and our matching engine will deliver the best premium European cabinet options directly to your WhatsApp.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">

          {/* Section 1: Contact */}
          <div className="border border-background/20 bg-background/5 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => toggleSection("contact")}
              aria-expanded={expandedSections.contact}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 border border-[hsl(var(--gold))] flex items-center justify-center text-[hsl(var(--gold))] font-serif font-bold text-sm">1</span>
                <span className="text-background font-serif font-semibold text-lg">Your Contact Information</span>
              </div>
              {expandedSections.contact ? <ChevronUp className="w-5 h-5 text-background/60" /> : <ChevronDown className="w-5 h-5 text-background/60" />}
            </button>
            {expandedSections.contact && (
              <div className="px-5 pb-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-background/80 text-sm">Your Name *</Label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="e.g. John Smith"
                      className="bg-background/10 border-background/20 text-background placeholder:text-background/40 focus-visible:ring-[hsl(var(--gold))]"
                    />
                    <p className="text-xs text-background/40">For personalized recommendations.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-background/80 text-sm">Your Email *</Label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="john@example.com"
                      className="bg-background/10 border-background/20 text-background placeholder:text-background/40 focus-visible:ring-[hsl(var(--gold))]"
                    />
                    <p className="text-xs text-background/40">For follow-up details.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-background/80 text-sm">Phone Number with Country Code *</Label>
                  <Input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="bg-background/10 border-background/20 text-background placeholder:text-background/40 focus-visible:ring-[hsl(var(--gold))]"
                  />
                  <p className="text-xs text-background/40">We'll deliver your tailored cabinet matches via WhatsApp.</p>
                </div>
                <Button
                  type="button"
                  variant="gold"
                  size="lg"
                  onClick={() => setExpandedSections({ contact: false, project: true, preferences: false })}
                  className="w-full sm:w-auto"
                >
                  Continue to Project Details
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Section 2: Project Details */}
          <div className="border border-background/20 bg-background/5 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => toggleSection("project")}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 border border-[hsl(var(--gold))] flex items-center justify-center text-[hsl(var(--gold))] font-serif font-bold text-sm">2</span>
                <span className="text-background font-serif font-semibold text-lg">About Your Kitchen Project</span>
              </div>
              {expandedSections.project ? <ChevronUp className="w-5 h-5 text-background/60" /> : <ChevronDown className="w-5 h-5 text-background/60" />}
            </button>
            {expandedSections.project && (
              <div className="px-5 pb-6 space-y-6">
                {/* Project Type */}
                <div className="space-y-3">
                  <Label className="text-background/80 text-sm">What type of project is this? *</Label>
                  <RadioGroup
                    value={formData.projectType}
                    onValueChange={(v) => updateField("projectType", v)}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {[
                      { value: "new", label: "New Installation" },
                      { value: "renovation", label: "Kitchen Renovation" },
                      { value: "other-project", label: "Other" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                          formData.projectType === opt.value
                            ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10"
                            : "border-background/20 hover:border-background/40"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} className="border-background/40 text-[hsl(var(--gold))]" />
                        <span className="text-background text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Layout */}
                <div className="space-y-2">
                  <Label className="text-background/80 text-sm">Kitchen Layout *</Label>
                  <Select value={formData.layout} onValueChange={(v) => updateField("layout", v)}>
                    <SelectTrigger className="bg-background/10 border-background/20 text-background focus:ring-[hsl(var(--gold))]">
                      <SelectValue placeholder="Select your kitchen layout" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="single-wall">Single Wall</SelectItem>
                      <SelectItem value="galley">Galley</SelectItem>
                      <SelectItem value="l-shape">L-Shape</SelectItem>
                      <SelectItem value="u-shape">U-Shape</SelectItem>
                      <SelectItem value="island">Kitchen with Island</SelectItem>
                      <SelectItem value="other-layout">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.layout && layoutDescriptions[formData.layout] && (
                    <div className="flex items-start gap-2 p-3 bg-[hsl(var(--gold))]/10 border border-[hsl(var(--gold))]/20">
                      <Info className="w-4 h-4 text-[hsl(var(--gold))] mt-0.5 shrink-0" />
                      <p className="text-xs text-background/70">{layoutDescriptions[formData.layout]}</p>
                    </div>
                  )}
                  {formData.layout === "other-layout" && (
                    <Input
                      value={formData.layoutOther}
                      onChange={(e) => updateField("layoutOther", e.target.value)}
                      placeholder="Please describe your layout"
                      className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
                    />
                  )}
                </div>

                {/* Measurements */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-background/80 text-sm">Primary Cabinet Wall Length *</Label>
                    <Input
                      required
                      value={formData.primaryWall}
                      onChange={(e) => updateField("primaryWall", e.target.value)}
                      placeholder="e.g. 120 inches / 300 cm"
                      className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
                    />
                  </div>
                  {showSecondaryWall && (
                    <div className="space-y-2">
                      <Label className="text-background/80 text-sm">Secondary Wall Length</Label>
                      <Input
                        value={formData.secondaryWall}
                        onChange={(e) => updateField("secondaryWall", e.target.value)}
                        placeholder="e.g. 96 inches / 240 cm"
                        className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-background/80 text-sm">Floor-to-Ceiling Height *</Label>
                    <Input
                      required
                      value={formData.ceilingHeight}
                      onChange={(e) => updateField("ceilingHeight", e.target.value)}
                      placeholder="e.g. 96 inches / 240 cm"
                      className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
                    />
                  </div>
                </div>

                {/* Obstacles */}
                <div className="space-y-2">
                  <Label className="text-background/80 text-sm">Fixed Obstacles (windows, doorways, etc.)</Label>
                  <Textarea
                    value={formData.obstacles}
                    onChange={(e) => updateField("obstacles", e.target.value)}
                    placeholder="Describe any windows, doorways, pipes, or other fixed elements with approximate dimensions and location..."
                    rows={3}
                    className="bg-background/10 border-background/20 text-background placeholder:text-background/40 resize-none"
                  />
                  <p className="text-xs text-background/40">Helps prevent fitting issues with your cabinet configuration.</p>
                </div>

                <Button
                  type="button"
                  variant="gold"
                  size="lg"
                  onClick={() => setExpandedSections({ contact: false, project: false, preferences: true })}
                  className="w-full sm:w-auto"
                >
                  Continue to Preferences
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Section 3: Preferences */}
          <div className="border border-background/20 bg-background/5 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => toggleSection("preferences")}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 border border-[hsl(var(--gold))] flex items-center justify-center text-[hsl(var(--gold))] font-serif font-bold text-sm">3</span>
                <span className="text-background font-serif font-semibold text-lg">Style & Preferences</span>
              </div>
              {expandedSections.preferences ? <ChevronUp className="w-5 h-5 text-background/60" /> : <ChevronDown className="w-5 h-5 text-background/60" />}
            </button>
            {expandedSections.preferences && (
              <div className="px-5 pb-6 space-y-6">
                {/* Style */}
                <div className="space-y-2">
                  <Label className="text-background/80 text-sm">Aesthetic / Style *</Label>
                  <Select value={formData.style} onValueChange={(v) => updateField("style", v)}>
                    <SelectTrigger className="bg-background/10 border-background/20 text-background focus:ring-[hsl(var(--gold))]">
                      <SelectValue placeholder="Select your preferred style" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="modern">Modern / Contemporary</SelectItem>
                      <SelectItem value="traditional">Traditional / Classic</SelectItem>
                      <SelectItem value="transitional">Transitional</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="other-style">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.style && styleDescriptions[formData.style] && (
                    <div className="flex items-start gap-2 p-3 bg-[hsl(var(--gold))]/10 border border-[hsl(var(--gold))]/20">
                      <Info className="w-4 h-4 text-[hsl(var(--gold))] mt-0.5 shrink-0" />
                      <p className="text-xs text-background/70">{styleDescriptions[formData.style]}</p>
                    </div>
                  )}
                  {formData.style === "other-style" && (
                    <Input
                      value={formData.styleOther}
                      onChange={(e) => updateField("styleOther", e.target.value)}
                      placeholder="Describe your vision"
                      className="bg-background/10 border-background/20 text-background placeholder:text-background/40"
                    />
                  )}
                </div>

                {/* Budget */}
                <div className="space-y-3">
                  <Label className="text-background/80 text-sm">Budget Range *</Label>
                  <RadioGroup
                    value={formData.budget}
                    onValueChange={(v) => updateField("budget", v)}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  >
                    {[
                      { value: "under-5k", label: "Under $5K" },
                      { value: "5k-10k", label: "$5K – $10K" },
                      { value: "10k-15k", label: "$10K – $15K" },
                      { value: "over-15k", label: "Over $15K" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-2 p-3 border cursor-pointer transition-colors text-center justify-center ${
                          formData.budget === opt.value
                            ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10"
                            : "border-background/20 hover:border-background/40"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} className="sr-only" />
                        <span className="text-background text-sm font-medium">{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Bundle */}
                <div className="space-y-3">
                  <Label className="text-background/80 text-sm">Interested in Bundled Solutions?</Label>
                  <p className="text-xs text-background/40">Countertops, sinks, faucets, appliances — simplifies sourcing.</p>
                  <RadioGroup
                    value={formData.bundle}
                    onValueChange={(v) => updateField("bundle", v)}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {[
                      { value: "full", label: "Yes, Full Bundle" },
                      { value: "some", label: "Yes, Some Items" },
                      { value: "no", label: "No, Just Cabinets" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-2 p-3 border cursor-pointer transition-colors text-center justify-center ${
                          formData.bundle === opt.value
                            ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10"
                            : "border-background/20 hover:border-background/40"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} className="sr-only" />
                        <span className="text-background text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <Label className="text-background/80 text-sm">When do you want to start? *</Label>
                  <Select value={formData.timeline} onValueChange={(v) => updateField("timeline", v)}>
                    <SelectTrigger className="bg-background/10 border-background/20 text-background focus:ring-[hsl(var(--gold))]">
                      <SelectValue placeholder="Select your timeline" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="urgent">Within 5 Days (Urgent)</SelectItem>
                      <SelectItem value="1-3-weeks">Within 1–3 Weeks</SelectItem>
                      <SelectItem value="1-3-months">Within 1–3 Months</SelectItem>
                      <SelectItem value="3-plus">3+ Months</SelectItem>
                      <SelectItem value="exploring">Just Exploring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* CASL Consent */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="casl-consent"
                      checked={caslConsent}
                      onCheckedChange={(v) => setCaslConsent(v === true)}
                      className="mt-0.5 border-background/40 data-[state=checked]:bg-[hsl(var(--gold))] data-[state=checked]:border-[hsl(var(--gold))]"
                    />
                    <label htmlFor="casl-consent" className="text-sm text-background/70 leading-relaxed cursor-pointer">
                      I consent to receive emails from FitMatch about my cabinet match request and related offers. I can unsubscribe at any time.
                    </label>
                  </div>
                  <p className="text-xs text-background/40 pl-7">
                    FitMatch, 137 Chrislea Rd, Woodbridge, ON L4L 8N6 | info@fitmatch.ca
                  </p>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-background/10">
                  <Button type="submit" variant="gold" size="xl" className="w-full" disabled={isSubmitting}>
                    <Send className="w-5 h-5" />
                    {isSubmitting ? "Submitting..." : "Get My Cabinet Matches"}
                  </Button>
                  <p className="text-xs text-background/40 text-center mt-4">
                    No commitment required. Matched results delivered to your WhatsApp in minutes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
};

export default CTA;
