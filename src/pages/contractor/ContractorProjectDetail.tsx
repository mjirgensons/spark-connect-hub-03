import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import Breadcrumbs from "@/components/Breadcrumbs";

const ContractorProjectDetail = () => {
  const { projectId } = useParams();
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/contractor/dashboard" }, { label: "Projects", href: "/contractor/projects" }, { label: "Project Detail" }]} />
      <h1 className="font-serif text-2xl md:text-3xl font-bold">Project Detail</h1>
      <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        <p className="text-sm text-muted-foreground">
          Project <span className="font-mono font-semibold text-foreground">{projectId}</span> details will be available once projects are active.
        </p>
      </Card>
    </div>
  );
};

export default ContractorProjectDetail;
