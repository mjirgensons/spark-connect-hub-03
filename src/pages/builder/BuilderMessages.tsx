import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

const BuilderMessages = () => (
  <div className="space-y-6">
    <Breadcrumbs items={[{ label: "Dashboard", href: "/builder/dashboard" }, { label: "Messages" }]} />
    <h1 className="font-serif text-2xl md:text-3xl font-bold">Messages</h1>
    <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="font-sans font-bold text-lg mb-2">No messages yet</p>
      <p className="text-sm text-muted-foreground">Your FitMatch assistant is available via the chat widget in the bottom-right corner. Direct messaging with sellers is coming soon.</p>
    </Card>
  </div>
);

export default BuilderMessages;
