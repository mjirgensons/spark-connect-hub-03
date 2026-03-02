import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Copy, Trash2, Send, Eye, Code, X, Mail, MessageSquare, Shield, Settings, FlaskConical, CreditCard } from "lucide-react";
import EmailCommLogTab from "./EmailCommLogTab";
import EmailConsentTab from "./EmailConsentTab";
import EmailSettingsTab from "./EmailSettingsTab";
import EmailWF8TestTab from "./EmailWF8TestTab";
import EmailWF9StripeTab from "./EmailWF9StripeTab";

interface EmailTemplate {
  id: string;
  template_key: string;
  category: string;
  customer_type: string;
  display_name: string;
  subject: string;
  html_body: string;
  plain_text_body: string | null;
  from_email: string;
  from_name: string;
  reply_to: string;
  locale: string;
  variables_schema: string[];
  is_active: boolean;
  requires_consent: boolean;
  casl_category: string;
  version: number;
  created_at: string;
  updated_at: string;
}

type InternalTab = "templates" | "comm-log" | "consent" | "settings" | "wf8-test" | "wf9-stripe";

const CATEGORY_COLORS: Record<string, string> = {
  transactional: "bg-blue-600 text-white hover:bg-blue-700",
  lifecycle: "bg-yellow-600 text-white hover:bg-yellow-700",
  marketing: "bg-green-600 text-white hover:bg-green-700",
  operational: "bg-muted-foreground text-white hover:bg-muted-foreground/80",
};

const CASL_LABELS: Record<string, string> = {
  transactional: "Exempt",
  implied: "2yr implied",
  express: "Required",
};

const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const generateSampleData = (variables: string[]): Record<string, string> => {
  const samples: Record<string, string> = {
    customer_name: "John Doe",
    order_number: "FM-20260228-0001",
    order_items: "[{product_name: 'Shaker Cabinet', quantity: 2, unit_price: '$899', total_price: '$1,798'}]",
    subtotal: "1,798.00",
    shipping_cost: "149.00",
    hst_amount: "253.11",
    total: "2,200.11",
    shipping_name: "John Doe",
    shipping_address_line_1: "123 King St W",
    shipping_city: "Toronto",
    shipping_province: "ON",
    shipping_postal_code: "M5V 1J2",
    estimated_delivery: "March 15, 2026",
    order_url: "#",
    receipt_url: "#",
    amount: "2,200.11",
    currency: "CAD",
    payment_method_last4: "4242",
    paid_at: "Feb 28, 2026",
    retry_url: "#",
    support_email: "support@fitmatch.ca",
    tracking_number: "1Z999AA10123456784",
    carrier: "UPS",
    tracking_url: "#",
    delivery_date: "March 15, 2026",
    review_url: "#",
    refund_amount: "899.00",
    original_amount: "2,200.11",
    refund_method: "Original payment method",
    refund_date: "Feb 28, 2026",
    quote_number: "FMQ-20260228-0001",
    seller_name: "Euro Kitchen Supply",
    price: "4,500.00",
    lead_time_days: "14",
    includes_drawings: "Yes",
    includes_countertop: "No",
    view_url: "#",
    project_id: "PRJ-001",
    project_status: "In Progress",
    status_description: "Contractors have been assigned.",
    next_steps: "Installation scheduled for next week.",
    project_url: "#",
    reset_url: "#",
    expiry_minutes: "60",
    login_url: "#",
    browse_url: "#",
    how_it_works_url: "#",
    product_name: "Milano Shaker Cabinet",
    product_image_url: "/placeholder.svg",
    cart_items: "[{name: 'Shaker Cabinet', quantity: 1, price: '$899', image_url: '/placeholder.svg'}]",
    cart_total: "899.00",
    cart_url: "#",
    bundle_url: "#",
    matching_url: "#",
    newsletter_subject: "This Month at FitMatch",
    newsletter_body: "<p>Check out our latest arrivals and deals!</p>",
    promo_headline: "Spring Kitchen Sale — 20% Extra Off",
    promo_body: "<p>Refresh your kitchen this spring with incredible deals.</p>",
    promo_code: "SPRING2026",
    promo_url: "#",
    expiry_date: "March 31, 2026",
    alert_type: "New Order",
    alert_message: "A new order FM-20260228-0001 was placed.",
    entity_type: "order",
    entity_id: "abc-123",
    admin_url: "#",
    unsubscribe_url: "#",
    preferences_url: "#",
    contractors: "[{name: 'Mike Builder', trade_type: 'Cabinet Installer', rating: '4.8'}]",
    countertop_options: "[{material: 'Quartz', finish: 'Polished', thickness: '3cm', price: '2,500'}]",
    appliances: "[{name: 'Bosch Dishwasher', brand: 'Bosch', dimensions: '24\" W', price: '1,299'}]",
    products: "[{name: 'Shaker Cabinet', image_url: '/placeholder.svg', retail_price: '1,800', sale_price: '899', discount: '50'}]",
  };
  const result: Record<string, string> = {};
  variables.forEach((v) => {
    result[v] = samples[v] || `[${v}]`;
  });
  return result;
};

const replaceVariables = (html: string, vars: Record<string, string>) => {
  let result = html;
  Object.entries(vars).forEach(([key, val]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
  });
  return result;
};

const emptyTemplate: Omit<EmailTemplate, "id" | "created_at" | "updated_at"> = {
  template_key: "",
  category: "transactional",
  customer_type: "client",
  display_name: "",
  subject: "",
  html_body: "",
  plain_text_body: "",
  from_email: "orders@fitmatch.ca",
  from_name: "FitMatch",
  reply_to: "support@fitmatch.ca",
  locale: "en-CA",
  variables_schema: [],
  is_active: true,
  requires_consent: false,
  casl_category: "transactional",
  version: 1,
};

const AdminEmailTemplatesTab = () => {
  const { toast } = useToast();
  const [internalTab, setInternalTab] = useState<InternalTab>("templates");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterCustomerType, setFilterCustomerType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editorForm, setEditorForm] = useState<typeof emptyTemplate>({ ...emptyTemplate });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"code" | "preview">("code");
  const [plainTextOpen, setPlainTextOpen] = useState(false);
  const [newVarInput, setNewVarInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("category")
      .order("display_name");
    if (error) {
      toast({ title: "Error loading templates", description: error.message, variant: "destructive" });
    } else {
      setTemplates((data || []) as unknown as EmailTemplate[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (filterCustomerType !== "all" && t.customer_type !== filterCustomerType) return false;
      if (filterStatus !== "all") {
        if (filterStatus === "active" && !t.is_active) return false;
        if (filterStatus === "inactive" && t.is_active) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!t.display_name.toLowerCase().includes(q) && !t.template_key.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [templates, filterCategory, filterCustomerType, filterStatus, search]);

  const handleToggleActive = async (template: EmailTemplate) => {
    const { error } = await supabase
      .from("email_templates")
      .update({ is_active: !template.is_active } as any)
      .eq("id", template.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("email_templates").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Template deleted" });
      fetchTemplates();
    }
  };

  const openEditor = (mode: "create" | "edit", template?: EmailTemplate) => {
    setEditorMode(mode);
    setPreviewMode("code");
    setPlainTextOpen(false);
    setNewVarInput("");
    if (mode === "edit" && template) {
      setEditingId(template.id);
      setEditorForm({
        template_key: template.template_key,
        category: template.category,
        customer_type: template.customer_type,
        display_name: template.display_name,
        subject: template.subject,
        html_body: template.html_body,
        plain_text_body: template.plain_text_body || "",
        from_email: template.from_email,
        from_name: template.from_name,
        reply_to: template.reply_to,
        locale: template.locale,
        variables_schema: Array.isArray(template.variables_schema) ? template.variables_schema : [],
        is_active: template.is_active,
        requires_consent: template.requires_consent,
        casl_category: template.casl_category,
        version: template.version,
      });
    } else {
      setEditingId(null);
      setEditorForm({ ...emptyTemplate });
    }
    setEditorOpen(true);
  };

  const openDuplicate = (template: EmailTemplate) => {
    openEditor("create");
    setEditorForm({
      template_key: template.template_key + "_copy",
      category: template.category,
      customer_type: template.customer_type,
      display_name: template.display_name + " (Copy)",
      subject: template.subject,
      html_body: template.html_body,
      plain_text_body: template.plain_text_body || "",
      from_email: template.from_email,
      from_name: template.from_name,
      reply_to: template.reply_to,
      locale: template.locale,
      variables_schema: Array.isArray(template.variables_schema) ? [...template.variables_schema] : [],
      is_active: false,
      requires_consent: template.requires_consent,
      casl_category: template.casl_category,
      version: 1,
    });
  };

  const updateForm = (key: string, value: any) => {
    setEditorForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "display_name" && editorMode === "create") {
        next.template_key = slugify(value);
      }
      if (key === "casl_category") {
        next.requires_consent = value !== "transactional";
      }
      return next;
    });
  };

  const addVariable = () => {
    const v = newVarInput.trim().replace(/\s+/g, "_").toLowerCase();
    if (v && !editorForm.variables_schema.includes(v)) {
      updateForm("variables_schema", [...editorForm.variables_schema, v]);
      setNewVarInput("");
    }
  };

  const removeVariable = (v: string) => {
    updateForm("variables_schema", editorForm.variables_schema.filter((x) => x !== v));
  };

  const handleSave = async () => {
    if (!editorForm.template_key || !editorForm.display_name || !editorForm.subject || !editorForm.html_body) {
      toast({ title: "Missing required fields", description: "Template key, name, subject, and HTML body are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editorMode === "edit" && editingId) {
      const { error } = await supabase
        .from("email_templates")
        .update({
          ...editorForm,
          version: editorForm.version + 1,
        } as any)
        .eq("id", editingId);
      if (error) toast({ title: "Error saving", description: error.message, variant: "destructive" });
      else {
        toast({ title: "Template saved (v" + (editorForm.version + 1) + ")" });
        setEditorOpen(false);
        fetchTemplates();
      }
    } else {
      const { error } = await supabase.from("email_templates").insert([editorForm] as any);
      if (error) toast({ title: "Error creating", description: error.message, variant: "destructive" });
      else {
        toast({ title: "Template created" });
        setEditorOpen(false);
        fetchTemplates();
      }
    }
    setSaving(false);
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      // Get n8n integration for webhook URL
      const { data: integrationData } = await supabase
        .from("integrations")
        .select("config, webhook_url")
        .eq("service_name", "n8n")
        .maybeSingle();

      const config = integrationData?.config as any;
      const baseUrl = config?.webhook_base_url || config?.base_url || integrationData?.webhook_url || "";

      if (!baseUrl) {
        toast({ title: "n8n not configured", description: "Set up the n8n integration first.", variant: "destructive" });
        setSendingTest(false);
        return;
      }

      // Get admin email
      const { data: adminData } = await supabase.from("admin_emails").select("email").limit(1).maybeSingle();
      const testEmail = adminData?.email || "admin@fitmatch.ca";

      const webhookUrl = baseUrl.replace(/\/+$/, "") + "/webhook/email-test";
      const { data, error } = await supabase.functions.invoke("test-integration", {
        body: {
          service_name: "n8n",
          webhook_test_url: webhookUrl,
          webhook_test_payload: {
            template_key: editorForm.template_key,
            test_mode: true,
            to_email: testEmail,
          },
        },
      });

      if (error || data?.status !== "healthy") {
        toast({ title: "Test email failed", description: data?.message || error?.message || "Check n8n webhook.", variant: "destructive" });
      } else {
        toast({ title: "Test email sent", description: `Sent to ${testEmail} via n8n.` });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSendingTest(false);
  };

  const previewHtml = useMemo(() => {
    const sampleData = generateSampleData(editorForm.variables_schema);
    return replaceVariables(editorForm.html_body, sampleData);
  }, [editorForm.html_body, editorForm.variables_schema]);

  // Tab buttons
  const tabs: { id: InternalTab; label: string; icon: React.ElementType }[] = [
    { id: "templates", label: "Templates", icon: Mail },
    { id: "comm-log", label: "Communication Log", icon: MessageSquare },
    { id: "consent", label: "Consent", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "wf8-test", label: "WF-8 Test", icon: FlaskConical },
  ];

  return (
    <div className="space-y-6">
      {/* Internal tab bar */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={internalTab === tab.id ? "default" : "outline"}
              size="sm"
              className="border-2"
              onClick={() => setInternalTab(tab.id)}
            >
              <Icon className="w-4 h-4 mr-1" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {internalTab === "templates" && (
        <TemplatesView
          templates={filtered}
          loading={loading}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterCustomerType={filterCustomerType}
          setFilterCustomerType={setFilterCustomerType}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          search={search}
          setSearch={setSearch}
          onEdit={(t) => openEditor("edit", t)}
          onDuplicate={openDuplicate}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onNew={() => openEditor("create")}
        />
      )}

      {internalTab === "comm-log" && <EmailCommLogTab />}

      {internalTab === "consent" && <EmailConsentTab />}

      {internalTab === "settings" && <EmailSettingsTab />}

      {internalTab === "wf8-test" && <EmailWF8TestTab />}
      {/* Template Editor Sheet */}
      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle className="font-serif">
              {editorMode === "edit" ? "Edit Template" : "New Template"}
            </SheetTitle>
          </SheetHeader>
          <div className="p-6 space-y-6">
            {/* Row 1: Key + Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Display Name *</Label>
                <Input value={editorForm.display_name} onChange={(e) => updateForm("display_name", e.target.value)} placeholder="Order Confirmation" />
              </div>
              <div>
                <Label>Template Key *</Label>
                <Input value={editorForm.template_key} onChange={(e) => updateForm("template_key", e.target.value)} className="font-mono text-sm" placeholder="order_confirmation" />
              </div>
            </div>

            {/* Row 2: Settings */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={editorForm.category} onValueChange={(v) => updateForm("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="lifecycle">Lifecycle</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Customer Type</Label>
                <Select value={editorForm.customer_type} onValueChange={(v) => updateForm("customer_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="builder">Builder</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>CASL Category</Label>
                <Select value={editorForm.casl_category} onValueChange={(v) => updateForm("casl_category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactional">Transactional (exempt)</SelectItem>
                    <SelectItem value="implied">Implied (2yr)</SelectItem>
                    <SelectItem value="express">Express (required)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={editorForm.requires_consent}
                  onCheckedChange={(v) => updateForm("requires_consent", !!v)}
                />
                <Label className="text-sm">Requires Consent</Label>
              </div>
              <div>
                <Label className="text-sm mr-2">Locale:</Label>
                <Input value={editorForm.locale} onChange={(e) => updateForm("locale", e.target.value)} className="inline w-24 text-sm" />
              </div>
            </div>

            {/* Row 3: Sender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>From Email</Label>
                <Input value={editorForm.from_email} onChange={(e) => updateForm("from_email", e.target.value)} />
              </div>
              <div>
                <Label>From Name</Label>
                <Input value={editorForm.from_name} onChange={(e) => updateForm("from_name", e.target.value)} />
              </div>
              <div>
                <Label>Reply-To</Label>
                <Input value={editorForm.reply_to} onChange={(e) => updateForm("reply_to", e.target.value)} />
              </div>
            </div>

            {/* Row 4: Subject */}
            <div>
              <Label>Subject *</Label>
              <Input value={editorForm.subject} onChange={(e) => updateForm("subject", e.target.value)} placeholder="Order {{order_number}} Confirmed" />
              <p className="text-xs text-muted-foreground mt-1">Use {"{{variable}}"} for dynamic content</p>
            </div>

            {/* Row 5: HTML Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>HTML Body *</Label>
                <div className="flex gap-1">
                  <Button size="sm" variant={previewMode === "code" ? "default" : "outline"} className="border-2 h-7 text-xs" onClick={() => setPreviewMode("code")}>
                    <Code className="w-3 h-3 mr-1" /> Code
                  </Button>
                  <Button size="sm" variant={previewMode === "preview" ? "default" : "outline"} className="border-2 h-7 text-xs" onClick={() => setPreviewMode("preview")}>
                    <Eye className="w-3 h-3 mr-1" /> Preview
                  </Button>
                </div>
              </div>
              {previewMode === "code" ? (
                <>
                  <p className="text-xs text-muted-foreground mb-1">
                    Handlebars: {"{{variable}}"}, {"{{#each items}}...{{/each}}"}, {"{{#if cond}}...{{/if}}"}
                  </p>
                  <Textarea
                    value={editorForm.html_body}
                    onChange={(e) => updateForm("html_body", e.target.value)}
                    className="font-mono text-xs min-h-[500px]"
                    placeholder="<!DOCTYPE html>..."
                  />
                </>
              ) : (
                <div className="border-2 border-border bg-background min-h-[500px]">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full min-h-[500px] border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
            </div>

            {/* Row 6: Plain text */}
            <div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setPlainTextOpen(!plainTextOpen)}>
                {plainTextOpen ? "▼" : "▶"} Plain Text Fallback
              </Button>
              {plainTextOpen && (
                <Textarea
                  value={editorForm.plain_text_body || ""}
                  onChange={(e) => updateForm("plain_text_body", e.target.value)}
                  className="mt-2 text-sm min-h-[120px]"
                  placeholder="Plain text version..."
                />
              )}
            </div>

            {/* Row 7: Variables */}
            <div>
              <Label>Template Variables</Label>
              <div className="flex flex-wrap gap-1 mt-2 mb-2">
                {editorForm.variables_schema.map((v) => (
                  <Badge key={v} variant="outline" className="border-2 text-xs gap-1">
                    <code>{v}</code>
                    <button onClick={() => removeVariable(v)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newVarInput}
                  onChange={(e) => setNewVarInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVariable())}
                  placeholder="Add variable name"
                  className="text-sm"
                />
                <Button variant="outline" size="sm" className="border-2" onClick={addVariable}>Add</Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t-2 border-border">
              <Button onClick={handleSave} disabled={saving} className="border-2">
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" className="border-2" onClick={handleSendTest} disabled={sendingTest}>
                <Send className="w-4 h-4 mr-1" />
                {sendingTest ? "Sending..." : "Send Test"}
              </Button>
              <Button variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// Templates list sub-component
interface TemplatesViewProps {
  templates: EmailTemplate[];
  loading: boolean;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  filterCustomerType: string;
  setFilterCustomerType: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  onEdit: (t: EmailTemplate) => void;
  onDuplicate: (t: EmailTemplate) => void;
  onDelete: (id: string) => void;
  onToggleActive: (t: EmailTemplate) => void;
  onNew: () => void;
}

const TemplatesView = ({
  templates, loading, filterCategory, setFilterCategory, filterCustomerType, setFilterCustomerType,
  filterStatus, setFilterStatus, search, setSearch, onEdit, onDuplicate, onDelete, onToggleActive, onNew,
}: TemplatesViewProps) => (
  <div className="space-y-4">
    {/* Filters */}
    <div className="flex flex-wrap items-center gap-3">
      <Select value={filterCategory} onValueChange={setFilterCategory}>
        <SelectTrigger className="w-40 border-2"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="transactional">Transactional</SelectItem>
          <SelectItem value="lifecycle">Lifecycle</SelectItem>
          <SelectItem value="marketing">Marketing</SelectItem>
          <SelectItem value="operational">Operational</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterCustomerType} onValueChange={setFilterCustomerType}>
        <SelectTrigger className="w-36 border-2"><SelectValue placeholder="Customer" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="client">Client</SelectItem>
          <SelectItem value="contractor">Contractor</SelectItem>
          <SelectItem value="seller">Seller</SelectItem>
          <SelectItem value="builder">Builder</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-32 border-2"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search templates..."
        className="w-48 border-2"
      />
      <div className="ml-auto">
        <Button onClick={onNew} className="border-2">
          <Plus className="w-4 h-4 mr-1" /> New Template
        </Button>
      </div>
    </div>

    {/* Table */}
    <div className="border-2 border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Template</TableHead>
            <TableHead className="text-xs">Category</TableHead>
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs">Subject</TableHead>
            <TableHead className="text-xs">CASL</TableHead>
            <TableHead className="text-xs">Active</TableHead>
            <TableHead className="text-xs">Ver</TableHead>
            <TableHead className="text-xs">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : templates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No templates found.</TableCell>
            </TableRow>
          ) : (
            templates.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <p className="text-sm font-semibold text-foreground">{t.display_name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{t.template_key}</p>
                </TableCell>
                <TableCell>
                  <Badge className={CATEGORY_COLORS[t.category] || ""}>{t.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-2 text-xs capitalize">{t.customer_type}</Badge>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="text-xs truncate" title={t.subject}>{t.subject.length > 50 ? t.subject.slice(0, 50) + "…" : t.subject}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-2 text-xs">{CASL_LABELS[t.casl_category] || t.casl_category}</Badge>
                </TableCell>
                <TableCell>
                  <Switch checked={t.is_active} onCheckedChange={() => onToggleActive(t)} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">v{t.version}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(t)} title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(t)} title="Duplicate">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete template?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;{t.display_name}&quot;. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(t.id)} className="bg-destructive text-destructive-foreground">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </div>
);

export default AdminEmailTemplatesTab;
