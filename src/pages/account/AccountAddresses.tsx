import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, MapPin, Star } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

const PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick",
  "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia",
  "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon",
];

const postalCodeRegex = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;

const addressSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  address_line_1: z.string().trim().min(1, "Address is required").max(200),
  address_line_2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  province: z.string().min(1, "Province is required"),
  postal_code: z.string().trim().regex(postalCodeRegex, "Format: A1A 1A1"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

type AddressForm = z.infer<typeof addressSchema>;

const AccountAddresses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["account-addresses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { full_name: "", address_line_1: "", address_line_2: "", city: "", province: "Ontario", postal_code: "", phone: "" },
  });

  const province = watch("province");

  const openNew = () => {
    setEditing(null);
    reset({ full_name: "", address_line_1: "", address_line_2: "", city: "", province: "Ontario", postal_code: "", phone: "" });
    setDialogOpen(true);
  };

  const openEdit = (addr: any) => {
    setEditing(addr.id);
    reset({
      full_name: addr.full_name,
      address_line_1: addr.address_line_1,
      address_line_2: addr.address_line_2 || "",
      city: addr.city,
      province: addr.province,
      postal_code: addr.postal_code,
      phone: addr.phone || "",
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: AddressForm) => {
      if (editing) {
        const { error } = await supabase.from("shipping_addresses").update(values as any).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shipping_addresses").insert([{ ...values, user_id: user!.id }] as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account-addresses"] });
      setDialogOpen(false);
      toast({ title: editing ? "Address updated" : "Address added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account-addresses"] });
      toast({ title: "Address deleted" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      // Unset all defaults first
      await supabase.from("shipping_addresses").update({ is_default: false } as any).eq("user_id", user!.id);
      const { error } = await supabase.from("shipping_addresses").update({ is_default: true } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account-addresses"] });
      toast({ title: "Default address updated" });
    },
  });

  const fieldClass = "border-2 border-border focus:ring-0 focus:border-foreground";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-serif">Saved Addresses</h1>
        <Button className="gap-2 border-2 shadow-[3px_3px_0px_0px_hsl(var(--foreground))]" onClick={openNew}>
          <Plus className="w-4 h-4" /> Add Address
        </Button>
      </div>

      {!addresses || addresses.length === 0 ? (
        <Card className="border-2 border-border">
          <CardContent className="p-8 text-center">
            <MapPin className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No saved addresses yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <Card key={addr.id} className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--foreground))]">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-sm">{addr.full_name}</p>
                    {addr.is_default && <Badge variant="secondary" className="text-[10px] mt-1">Default</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(addr)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteMutation.mutate(addr.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {addr.address_line_1}
                  {addr.address_line_2 ? `, ${addr.address_line_2}` : ""}<br />
                  {addr.city}, {addr.province} {addr.postal_code}
                </p>
                {addr.phone && <p className="text-xs text-muted-foreground">{addr.phone}</p>}
                {!addr.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 text-xs gap-1 mt-1"
                    onClick={() => setDefaultMutation.mutate(addr.id)}
                  >
                    <Star className="w-3 h-3" /> Set as Default
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-2 border-border shadow-[6px_6px_0px_0px_hsl(var(--foreground))] max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Address" : "Add New Address"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input {...register("full_name")} className={fieldClass} />
              {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <Label>Address Line 1 *</Label>
              <Input {...register("address_line_1")} className={fieldClass} />
              {errors.address_line_1 && <p className="text-xs text-destructive mt-1">{errors.address_line_1.message}</p>}
            </div>
            <div>
              <Label>Address Line 2</Label>
              <Input {...register("address_line_2")} className={fieldClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City *</Label>
                <Input {...register("city")} className={fieldClass} />
                {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <Label>Province *</Label>
                <Select value={province} onValueChange={(v) => setValue("province", v)}>
                  <SelectTrigger className="border-2 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Postal Code *</Label>
                <Input {...register("postal_code")} placeholder="A1A 1A1" className={fieldClass} />
                {errors.postal_code && <p className="text-xs text-destructive mt-1">{errors.postal_code.message}</p>}
              </div>
              <div>
                <Label>Phone</Label>
                <Input {...register("phone")} className={fieldClass} />
              </div>
            </div>
            <Button type="submit" className="w-full border-2 shadow-[3px_3px_0px_0px_hsl(var(--foreground))]" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Update Address" : "Save Address"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountAddresses;
