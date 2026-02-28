import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { MapPin, Mail, Send } from "lucide-react";

const AboutPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    // Placeholder — wire to edge function or Supabase later
    await new Promise((r) => setTimeout(r, 800));
    toast({ title: "Message sent!", description: "We'll get back to you shortly." });
    setForm({ name: "", email: "", message: "" });
    setSending(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-foreground text-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 border-background/40 text-background text-xs font-mono uppercase tracking-widest">
            About Us
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Redefining How the GTA Renovates
          </h1>
          <p className="text-lg md:text-xl opacity-90">
            FitMatch is a marketplace platform for discounted and overstock premium European cabinetry in the Greater Toronto Area.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <h2 className="font-serif text-3xl font-bold">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed">
            The kitchen and bathroom renovation market is broken. Homeowners wait 6–8 weeks for custom cabinets, pay $15K–$30K+ for mid-range quality, and manage separate contracts for plumbing, electrical, countertops, and installation.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Meanwhile, European cabinet manufacturers and resellers sit on warehouses of surplus, overstock, and cancelled-order inventory — premium products with nowhere to go.
          </p>
          <p className="text-foreground leading-relaxed font-medium">
            FitMatch bridges that gap. We match surplus cabinet inventory to customer opening dimensions, bundle contractors, countertops, and appliances, and reduce kitchen and bathroom renovation timelines by up to 80%.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4 max-w-3xl">
          <div
            className="border-2 border-foreground p-8 md:p-12"
            style={{ boxShadow: "6px 6px 0 0 hsl(var(--foreground))" }}
          >
            <h2 className="font-serif text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              To make premium European cabinetry accessible to every homeowner, contractor, and builder in the GTA — at a fraction of the cost and time of traditional custom orders — by intelligently matching existing inventory to real-world spaces.
            </p>
          </div>
        </div>
      </section>

      {/* Location + Contact */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Location */}
            <div>
              <h2 className="font-serif text-3xl font-bold mb-4">Where We Are</h2>
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-sans font-semibold">Greater Toronto Area</p>
                  <p className="text-sm text-muted-foreground">Ontario, Canada</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-sans font-semibold">hello@fitmatch.ca</p>
                  <p className="text-sm text-muted-foreground">We typically respond within 24 hours</p>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div>
              <h2 className="font-serif text-3xl font-bold mb-4">Get in Touch</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="border-2 border-foreground"
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="border-2 border-foreground"
                />
                <Textarea
                  placeholder="Your message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="border-2 border-foreground resize-none"
                />
                <Button type="submit" disabled={sending} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? "Sending…" : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
