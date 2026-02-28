import { Card } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

const ContractorJobs = () => (
  <div className="space-y-6">
    <h1 className="font-serif text-2xl md:text-3xl font-bold">Available Jobs</h1>
    <Card
      className="border-2 border-foreground p-8 text-center"
      style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
    >
      <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="font-sans font-bold text-lg mb-2">No open jobs yet</p>
      <p className="text-sm text-muted-foreground">
        Open jobs in your area will appear here when clients need your trade. Make sure your profile is complete to get matched.
      </p>
    </Card>
  </div>
);

export default ContractorJobs;
