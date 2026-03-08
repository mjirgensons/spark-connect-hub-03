import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCheckout, CheckoutInfo } from "@/contexts/CheckoutContext";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
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
import { Link } from "react-router-dom";

const provinces = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
];

const postalCodeRegex = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;

const infoSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  addressLine1: z.string().trim().min(1, "Address is required").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  province: z.string().min(1, "Province is required"),
  postalCode: z
    .string()
    .trim()
    .regex(postalCodeRegex, "Format: A1A 1A1"),
  saveAddress: z.boolean().default(false),
});

type InfoFormValues = z.infer<typeof infoSchema>;

const StepInformation = () => {
  const { info, setInfo, setStep } = useCheckout();
  const { user } = useAuth();
  const { profile } = useProfile();

  const defaults: InfoFormValues = info ?? {
    email: user?.email ?? "",
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "Ontario",
    postalCode: "",
    saveAddress: false,
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InfoFormValues>({
    resolver: zodResolver(infoSchema),
    defaultValues: defaults,
  });

  const province = watch("province");
  const saveAddress = watch("saveAddress");

  const onSubmit = (data: InfoFormValues) => {
    setInfo(data as CheckoutInfo);
    setStep(2);
  };

  const fieldClass =
    "border-2 border-border focus:ring-0 focus:border-foreground";
  const errorClass = "text-xs text-destructive mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      {user ? (
        <p className="text-sm text-muted-foreground">
          Logged in as <span className="font-medium text-foreground">{user.email}</span>
        </p>
      ) : (
        <div className="flex items-center justify-between border-2 border-border p-3">
          <span className="text-sm font-medium">Checkout as Guest</span>
          <Link to="/login" className="text-xs text-muted-foreground underline hover:text-foreground">
            Sign In instead
          </Link>
        </div>
      )}

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input id="email" {...register("email")} className={fieldClass} />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="fullName">Full Name *</Label>
        <Input id="fullName" {...register("fullName")} className={fieldClass} />
        {errors.fullName && <p className={errorClass}>{errors.fullName.message}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...register("phone")} className={fieldClass} />
      </div>

      <div>
        <Label htmlFor="addressLine1">Address Line 1 *</Label>
        <Input id="addressLine1" {...register("addressLine1")} className={fieldClass} />
        {errors.addressLine1 && <p className={errorClass}>{errors.addressLine1.message}</p>}
      </div>

      <div>
        <Label htmlFor="addressLine2">Address Line 2</Label>
        <Input id="addressLine2" {...register("addressLine2")} className={fieldClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input id="city" {...register("city")} className={fieldClass} />
          {errors.city && <p className={errorClass}>{errors.city.message}</p>}
        </div>
        <div>
          <Label>Province *</Label>
          <Select value={province} onValueChange={(v) => setValue("province", v)}>
            <SelectTrigger className="border-2 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.province && <p className={errorClass}>{errors.province.message}</p>}
        </div>
      </div>

      <div className="max-w-[200px]">
        <Label htmlFor="postalCode">Postal Code *</Label>
        <Input
          id="postalCode"
          {...register("postalCode")}
          placeholder="A1A 1A1"
          className={fieldClass}
        />
        {errors.postalCode && <p className={errorClass}>{errors.postalCode.message}</p>}
      </div>

      {user && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="saveAddress"
            checked={saveAddress}
            onCheckedChange={(c) => setValue("saveAddress", !!c)}
          />
          <Label htmlFor="saveAddress" className="text-sm cursor-pointer">
            Save this address for future orders
          </Label>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
        Continue to Review
      </Button>
    </form>
  );
};

export default StepInformation;
