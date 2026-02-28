import { Card } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";

const ClientProjects = () => (
  <div className="space-y-6">
    <h1 className="font-serif text-2xl md:text-3xl font-bold">My Projects</h1>
    <Card
      className="border-2 border-foreground p-8 text-center"
      style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
    >
      <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="font-sans font-bold text-lg mb-2">No active projects yet</p>
      <p className="text-sm text-muted-foreground">
        When you purchase a cabinet, your project will appear here with contractor matching, delivery tracking, and installation details.
      </p>
    </Card>
  </div>
);

export default ClientProjects;
