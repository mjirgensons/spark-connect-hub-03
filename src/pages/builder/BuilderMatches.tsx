import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

const BuilderMatches = () => (
  <div className="space-y-6">
    <h1 className="font-serif text-2xl md:text-3xl font-bold">Matches</h1>
    <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
      <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="font-sans font-bold text-lg mb-2">No matches yet</p>
      <p className="text-sm text-muted-foreground">Your bulk match results will appear here after you create a project or use Quick Bulk Match.</p>
    </Card>
  </div>
);

export default BuilderMatches;
