import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import Breadcrumbs from "@/components/Breadcrumbs";

const ContractorJobDetail = () => {
  const { jobId } = useParams();
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/contractor/dashboard" }, { label: "Jobs", href: "/contractor/jobs" }, { label: "Job Detail" }]} />
      <h1 className="font-serif text-2xl md:text-3xl font-bold">Job Detail</h1>
      <Card className="border-2 border-foreground p-8 text-center" style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}>
        <p className="text-sm text-muted-foreground">
          Job <span className="font-mono font-semibold text-foreground">{jobId}</span> details will appear here once jobs are available.
        </p>
      </Card>
    </div>
  );
};

export default ContractorJobDetail;
