import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

const SellerPending = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="font-serif text-3xl font-bold text-foreground">FitMatch</h1>

        <div className="border-2 border-foreground bg-card p-8 space-y-4" style={{ boxShadow: "6px 6px 0 0 hsl(var(--foreground))" }}>
          <Clock className="w-12 h-12 text-primary mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-foreground">Registration Under Review</h2>
          <p className="text-muted-foreground">
            Thank you for registering as a seller on FitMatch. Our team is reviewing your application and will notify you by email once approved. This usually takes 1–2 business days.
          </p>
        </div>

        <Button asChild variant="outline" className="border-2 border-foreground">
          <Link to="/">Return to Homepage</Link>
        </Button>
      </div>
    </div>
  );
};

export default SellerPending;
