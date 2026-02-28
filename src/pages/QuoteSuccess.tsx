import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const QuoteSuccess = () => {
  const [params] = useSearchParams();
  const quoteNumber = params.get("qn") || "—";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20 pt-24 md:pt-20 flex justify-center">
        <Card className="max-w-lg w-full border-2 border-border shadow-[6px_6px_0px_0px_hsl(var(--foreground))] text-center">
          <CardContent className="p-10 space-y-5">
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <h1 className="text-2xl font-serif font-bold text-foreground">Quote Request Submitted!</h1>
            <p className="text-muted-foreground">
              Your quote number is <span className="font-mono font-bold text-foreground">{quoteNumber}</span>.
            </p>
            <p className="text-sm text-muted-foreground">We'll review your request and respond within <strong>1–2 business days</strong>.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild>
                <Link to="/browse">Continue Browsing</Link>
              </Button>
              <Button variant="outline" className="border-2" asChild>
                <Link to="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default QuoteSuccess;
