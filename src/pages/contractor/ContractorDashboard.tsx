import { Card } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { Briefcase, FolderOpen, CheckCircle, Star } from "lucide-react";

const stats = [
  { label: "Available Jobs", value: "0", icon: Briefcase },
  { label: "Active Projects", value: "0", icon: FolderOpen },
  { label: "Completed Jobs", value: "0", icon: CheckCircle },
  { label: "Rating", value: "N/A", icon: Star },
];

const ContractorDashboard = () => {
  const { profile } = useProfile();

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl md:text-3xl font-bold">
        Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="border-2 border-foreground p-5 flex items-center gap-4"
            style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
          >
            <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-mono text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card
        className="border-2 border-foreground p-8 text-center"
        style={{ boxShadow: "4px 4px 0 0 hsl(var(--foreground))" }}
      >
        <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="font-sans font-bold text-lg mb-2">New Opportunities</p>
        <p className="text-sm text-muted-foreground">
          No open jobs yet. Check back soon as clients start projects in your area.
        </p>
      </Card>
    </div>
  );
};

export default ContractorDashboard;
