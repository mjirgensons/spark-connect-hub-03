import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

const SellerQuotes = () => (
  <div className="space-y-6">
    <Breadcrumbs items={[{ label: "Dashboard", href: "/seller/dashboard" }, { label: "Quotes" }]} />
    <h1 className="font-serif text-2xl md:text-3xl font-bold">Quote Requests</h1>
    <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="font-sans font-bold text-lg mb-2">No quote requests yet</p>
      <p className="text-sm text-muted-foreground">
        When clients can't find a match, they can request custom quotes. Those requests will appear here.
      </p>
    </Card>
  </div>
);

export default SellerQuotes;
