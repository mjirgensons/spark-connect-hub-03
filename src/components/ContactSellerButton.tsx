import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ContactSellerButtonProps {
  productId: string;
  sellerId: string;
  productName: string;
}

const ContactSellerButton = ({ productId, sellerId, productName }: ContactSellerButtonProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  // Don't show if user is the seller
  if (user?.id === sellerId) return null;

  const handleClick = async () => {
    if (!user) {
      navigate(`/login?redirect=/product/${productId}`);
      return;
    }

    setStarting(true);
    try {
      // Check existing conversation
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("product_id", productId)
        .eq("buyer_id", user.id)
        .eq("seller_id", sellerId)
        .maybeSingle();

      if (existing) {
        navigate(`/messages/${existing.id}`);
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          product_id: productId,
          buyer_id: user.id,
          seller_id: sellerId,
          subject: productName,
        })
        .select("id")
        .single();

      if (error) throw error;
      navigate(`/messages/${newConv.id}`);
    } catch (err: any) {
      toast.error("Could not start conversation");
    } finally {
      setStarting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={starting || loading}
      className="shadow-[0_4px_12px_hsla(var(--muted-foreground),0.3)]"
    >
      {starting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
      Contact Seller
    </Button>
  );
};

export default ContactSellerButton;
