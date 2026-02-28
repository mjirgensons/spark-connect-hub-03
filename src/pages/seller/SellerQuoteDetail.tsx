import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import Breadcrumbs from "@/components/Breadcrumbs";

const SellerQuoteDetail = () => {
  const { quoteId } = useParams();
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/seller/dashboard" }, { label: "Quotes", href: "/seller/quotes" }, { label: "Quote Detail" }]} />
      <h1 className="font-serif text-2xl md:text-3xl font-bold">Quote Detail</h1>
      <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        <p className="text-sm text-muted-foreground">
          Quote <span className="font-mono font-semibold text-foreground">{quoteId}</span> details will appear here.
        </p>
      </Card>
    </div>
  );
};

export default SellerQuoteDetail;
