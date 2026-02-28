import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { dispatchWebhook } from "@/lib/webhookDispatcher";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Search, Loader2 } from "lucide-react";

interface QuoteItem {
  product_id: string | null;
  product_name: string;
  quantity: number;
  notes: string;
  image?: string;
}

const projectTypes = [
  { value: "renovation", label: "Renovation" },
  { value: "new_build", label: "New Build" },
  { value: "multi_unit", label: "Multi-Unit" },
  { value: "commercial", label: "Commercial" },
  { value: "resale", label: "Resale" },
  { value: "other", label: "Other" },
];

const timelines = [
  { value: "asap", label: "ASAP" },
  { value: "1-2_weeks", label: "1–2 weeks" },
  { value: "2-4_weeks", label: "2–4 weeks" },
  { value: "1-2_months", label: "1–2 months" },
  { value: "3+_months", label: "3+ months" },
];

const QuoteRequest = () => {
  const navigate = useNavigate();
  const { items: cartItems } = useCart();
  const { user } = useAuth();

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [timeline, setTimeline] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Search dialog state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Pre-fill from cart
  useEffect(() => {
    if (cartItems.length > 0) {
      setQuoteItems(
        cartItems.map((ci) => ({
          product_id: ci.productId,
          product_name: ci.name,
          quantity: ci.quantity,
          notes: "",
          image: ci.image,
        }))
      );
    }
  }, []);

  // Pre-fill from user profile
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, phone, company_name")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setContactName(data.full_name || "");
        setContactEmail(data.email || "");
        setContactPhone(data.phone || "");
        setCompanyName(data.company_name || "");
      }
    };
    fetchProfile();
  }, [user]);

  // If not logged in, pre-fill email from auth
  useEffect(() => {
    if (user?.email && !contactEmail) setContactEmail(user.email);
  }, [user]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("products")
      .select("id, product_name, main_image_url, price_discounted_usd")
      .is("deleted_at", null)
      .ilike("product_name", `%${q}%`)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const addProduct = (product: any) => {
    if (quoteItems.some((i) => i.product_id === product.id)) {
      toast.info("Already added");
      return;
    }
    setQuoteItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.product_name,
        quantity: 1,
        notes: "",
        image: product.main_image_url,
      },
    ]);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeItem = (idx: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof QuoteItem, value: any) => {
    setQuoteItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      toast.error("Please fill in all required contact fields.");
      return;
    }
    if (quoteItems.length === 0) {
      toast.error("Please add at least one product.");
      return;
    }
    setSubmitting(true);

    try {
      // 1. Create quote_request
      const { data: qr, error: qrErr } = await supabase
        .from("quote_requests")
        .insert({
          contact_name: contactName.trim(),
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim() || null,
          company_name: companyName.trim() || null,
          project_type: projectType || null,
          project_timeline: timeline || null,
          delivery_address: deliveryAddress.trim() || null,
          notes: notes.trim() || null,
          user_id: user?.id || null,
          quote_number: "TEMP", // trigger will generate
        } as any)
        .select()
        .single();

      if (qrErr) throw qrErr;

      // 2. Create items
      const itemsPayload = quoteItems.map((qi) => ({
        quote_request_id: qr.id,
        product_id: qi.product_id,
        product_name: qi.product_name,
        quantity: qi.quantity,
        notes: qi.notes || null,
      }));

      const { error: itemsErr } = await supabase
        .from("quote_request_items")
        .insert(itemsPayload);

      if (itemsErr) throw itemsErr;

      // 3. Fire webhook
      dispatchWebhook(
        {
          eventType: "quote.created",
          data: {
            quote_request_id: qr.id,
            quote_number: qr.quote_number,
            contact_name: contactName,
            contact_email: contactEmail,
            company_name: companyName || null,
            project_type: projectType || null,
            items: quoteItems.map((qi) => ({
              product_name: qi.product_name,
              quantity: qi.quantity,
              notes: qi.notes,
            })),
            notes: notes || null,
          },
        },
        "/webhook/quote-created"
      );

      // 4. Navigate to success
      navigate(`/quote-success?qn=${encodeURIComponent(qr.quote_number)}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit quote request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 pt-24 md:pt-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Request a Quote</h1>
            <p className="text-muted-foreground text-sm">Get custom pricing for your project. We'll respond within 1–2 business days.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1 — Contact */}
          <Card className="border-2 border-border shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name">Full Name *</Label>
                  <Input id="contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} required maxLength={100} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-email">Email *</Label>
                  <Input id="contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required maxLength={255} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-phone">Phone *</Label>
                  <Input id="contact-phone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required maxLength={20} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} maxLength={100} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2 — Project Details */}
          <Card className="border-2 border-border shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Project Type</Label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((pt) => (
                        <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Timeline</Label>
                  <Select value={timeline} onValueChange={setTimeline}>
                    <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                    <SelectContent>
                      {timelines.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="delivery-addr">Delivery Address</Label>
                <Textarea id="delivery-addr" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={2} maxLength={500} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3 — Items */}
          <Card className="border-2 border-border shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-lg">Products</CardTitle>
              <Button type="button" variant="outline" size="sm" className="border-2" onClick={() => setSearchOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
            </CardHeader>
            <CardContent>
              {quoteItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No products added yet. Add from search or go to cart first.</p>
              ) : (
                <div className="space-y-3">
                  {quoteItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start border-2 border-border p-3">
                      {item.image && (
                        <img src={item.image} alt={item.product_name} className="w-14 h-14 object-cover border border-border shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm font-medium truncate">{item.product_name}</p>
                        <div className="flex gap-3 items-center">
                          <div className="flex items-center gap-1">
                            <Label className="text-xs">Qty:</Label>
                            <Input
                              type="number"
                              min={1}
                              max={999}
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 h-8 text-xs"
                            />
                          </div>
                          <Input
                            placeholder="Notes for this item..."
                            value={item.notes}
                            onChange={(e) => updateItem(idx, "notes", e.target.value)}
                            className="h-8 text-xs flex-1"
                            maxLength={500}
                          />
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeItem(idx)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 4 — Submit */}
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={submitting} className="shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Quote Request
            </Button>
          </div>
        </form>
      </main>
      <Footer />

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="border-2 border-border shadow-[6px_6px_0px_0px_hsl(var(--foreground))]">
          <DialogHeader>
            <DialogTitle className="font-serif">Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            {searching && <p className="text-xs text-muted-foreground text-center">Searching...</p>}
            <div className="max-h-60 overflow-y-auto space-y-1">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded text-left transition-colors"
                >
                  {p.main_image_url && (
                    <img src={p.main_image_url} alt="" className="w-10 h-10 object-cover border border-border" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.product_name}</p>
                    <p className="text-xs text-muted-foreground">${Number(p.price_discounted_usd).toLocaleString()}</p>
                  </div>
                </button>
              ))}
              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No products found.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuoteRequest;
