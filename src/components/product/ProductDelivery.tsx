import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Truck, MapPin } from "lucide-react";
import ContactSellerButton from "@/components/ContactSellerButton";

interface ProductDeliveryProps {
  product: any;
  deliveryChoice: 'delivery' | 'pickup';
  setDeliveryChoice: (v: 'delivery' | 'pickup') => void;
}

const ProductDelivery = ({ product, deliveryChoice, setDeliveryChoice }: ProductDeliveryProps) => {
  const dOpt = product.delivery_option;
  const hasAnyDeliveryField = dOpt === 'delivery' || dOpt === 'pickup_only' || dOpt === 'both';

  if (!hasAnyDeliveryField) {
    return (
      <div className="border rounded-md p-4 bg-muted/30">
        <p className="text-sm font-semibold text-foreground mb-2">Delivery & Pickup</p>
        <p className="text-xs text-muted-foreground mb-3">Contact seller for delivery and pickup arrangements</p>
        {product.seller_id && (
          <ContactSellerButton productId={product.id} sellerId={product.seller_id} productName={product.product_name} />
        )}
      </div>
    );
  }

  if (dOpt === 'delivery') {
    return (
      <div className="border rounded-md p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">Delivery & Pickup</p>
        <div className="flex items-start gap-2">
          <Truck className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Delivery Available</p>
            <p className="text-xs text-muted-foreground">
              ${Number(product.delivery_price || 0).toFixed(2)} — {product.delivery_zone || 'Local area'}
            </p>
            <p className="text-xs text-muted-foreground">
              Estimated {product.delivery_prep_days || 5} business days preparation
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (dOpt === 'pickup_only') {
    return (
      <div className="border rounded-md p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">Delivery & Pickup</p>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Pickup Only</p>
            <p className="text-xs text-muted-foreground">
              {[product.pickup_address, product.pickup_city, product.pickup_province, product.pickup_postal_code].filter(Boolean).join(', ')}
            </p>
            {product.pickup_phone && (
              <p className="text-xs text-muted-foreground">Phone: {product.pickup_phone}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Estimated {product.pickup_prep_days || 5} business days preparation
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              We'll notify you when your order is ready for pickup. Please do not visit before receiving confirmation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // dOpt === 'both'
  return (
    <div className="border rounded-md p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">Delivery & Pickup</p>
      <RadioGroup value={deliveryChoice} onValueChange={(v) => setDeliveryChoice(v as 'delivery' | 'pickup')}>
        <label className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer transition-colors ${deliveryChoice === 'delivery' ? 'border-foreground bg-muted/30' : 'border-border'}`}>
          <RadioGroupItem value="delivery" id="del-delivery" className="mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-muted-foreground" />
              <Label htmlFor="del-delivery" className="text-sm font-medium cursor-pointer">
                Delivery — ${Number(product.delivery_price || 0).toFixed(2)}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{product.delivery_zone || 'Local area'}</p>
            <p className="text-xs text-muted-foreground">Est. {product.delivery_prep_days || 5} business days prep</p>
          </div>
        </label>
        <label className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer transition-colors ${deliveryChoice === 'pickup' ? 'border-foreground bg-muted/30' : 'border-border'}`}>
          <RadioGroupItem value="pickup" id="del-pickup" className="mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <Label htmlFor="del-pickup" className="text-sm font-medium cursor-pointer">Pickup — Free</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {[product.pickup_address, product.pickup_city, product.pickup_province].filter(Boolean).join(', ')}
            </p>
            {product.pickup_phone && <p className="text-xs text-muted-foreground">Phone: {product.pickup_phone}</p>}
            <p className="text-xs text-muted-foreground">Est. {product.pickup_prep_days || 5} business days prep</p>
          </div>
        </label>
      </RadioGroup>
    </div>
  );
};

export default ProductDelivery;
