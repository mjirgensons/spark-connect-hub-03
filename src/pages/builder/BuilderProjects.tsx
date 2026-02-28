import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, PlusCircle } from "lucide-react";

const BuilderProjects = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="font-serif text-2xl md:text-3xl font-bold">Projects</h1>
      <Button asChild><Link to="/builder/projects/new"><PlusCircle size={16} className="mr-2" /> New Project</Link></Button>
    </div>
    <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
      <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="font-sans font-bold text-lg mb-2">No projects yet</p>
      <p className="text-sm text-muted-foreground">Create your first bulk project to find cabinetry for multiple units at volume pricing.</p>
    </Card>
  </div>
);

export default BuilderProjects;
