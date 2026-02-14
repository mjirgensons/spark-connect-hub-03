import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Users, Eye, MousePointerClick, Clock, TrendingUp, ArrowUpRight, BarChart3, Target } from "lucide-react";

interface AnalyticsEvent {
  id: string;
  session_id: string;
  event_type: string;
  event_category: string | null;
  event_label: string | null;
  event_value: number | null;
  page_path: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface AnalyticsSession {
  id: string;
  session_id: string;
  first_page: string | null;
  last_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  page_count: number;
  event_count: number;
  is_bounce: boolean;
  started_at: string;
  last_activity_at: string;
  duration_seconds: number;
  screen_width: number | null;
  screen_height: number | null;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--gold))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
];

const AnalyticsDashboard = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [sessions, setSessions] = useState<AnalyticsSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7d");

  const fetchData = async () => {
    setLoading(true);
    const now = new Date();
    const daysBack = dateRange === "24h" ? 1 : dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const since = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    const [eventsRes, sessionsRes] = await Promise.all([
      supabase
        .from("analytics_events")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("analytics_sessions")
        .select("*")
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .limit(1000),
    ]);

    if (eventsRes.data) setEvents(eventsRes.data as unknown as AnalyticsEvent[]);
    if (sessionsRes.data) setSessions(sessionsRes.data as unknown as AnalyticsSession[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Computed metrics
  const totalSessions = sessions.length;
  const totalPageViews = events.filter((e) => e.event_type === "page_view").length;
  const totalClicks = events.filter((e) => e.event_type === "click").length;
  const formViews = events.filter((e) => e.event_type === "form_view").length;
  const formSubmits = events.filter((e) => e.event_type === "form_submit").length;
  const bounceRate = totalSessions > 0 ? Math.round((sessions.filter((s) => s.is_bounce).length / totalSessions) * 100) : 0;
  const conversionRate = formViews > 0 ? Math.round((formSubmits / formViews) * 100) : 0;

  // Daily pageviews chart data
  const dailyData = () => {
    const days: Record<string, { pageviews: number; sessions: number; clicks: number }> = {};
    events.forEach((e) => {
      const day = e.created_at.split("T")[0];
      if (!days[day]) days[day] = { pageviews: 0, sessions: 0, clicks: 0 };
      if (e.event_type === "page_view") days[day].pageviews++;
      if (e.event_type === "click") days[day].clicks++;
    });
    sessions.forEach((s) => {
      const day = s.started_at.split("T")[0];
      if (!days[day]) days[day] = { pageviews: 0, sessions: 0, clicks: 0 };
      days[day].sessions++;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date: date.slice(5), ...data }));
  };

  // Top pages
  const topPages = () => {
    const pages: Record<string, number> = {};
    events
      .filter((e) => e.event_type === "page_view" && e.page_path)
      .forEach((e) => {
        pages[e.page_path!] = (pages[e.page_path!] || 0) + 1;
      });
    return Object.entries(pages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));
  };

  // Traffic sources
  const trafficSources = () => {
    const sources: Record<string, number> = {};
    sessions.forEach((s) => {
      const source = s.utm_source || (s.referrer ? new URL(s.referrer).hostname : "Direct");
      sources[source] = (sources[source] || 0) + 1;
    });
    return Object.entries(sources)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  };

  // CTA clicks breakdown
  const ctaClicks = () => {
    const ctas: Record<string, number> = {};
    events
      .filter((e) => e.event_type === "click" && e.event_category === "cta")
      .forEach((e) => {
        const label = e.event_label || "Unknown";
        ctas[label] = (ctas[label] || 0) + 1;
      });
    return Object.entries(ctas)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count]) => ({ label, count }));
  };

  // Funnel data
  const funnelData = () => [
    { stage: "Page Views", count: totalPageViews, color: CHART_COLORS[0] },
    { stage: "Section Views", count: events.filter((e) => e.event_type === "section_view").length, color: CHART_COLORS[1] },
    { stage: "CTA Clicks", count: totalClicks, color: CHART_COLORS[2] },
    { stage: "Form Views", count: formViews, color: CHART_COLORS[3] },
    { stage: "Form Submits", count: formSubmits, color: CHART_COLORS[4] },
  ];

  // Device breakdown
  const deviceBreakdown = () => {
    let mobile = 0, tablet = 0, desktop = 0;
    sessions.forEach((s) => {
      if (!s.screen_width) return;
      if (s.screen_width < 768) mobile++;
      else if (s.screen_width < 1024) tablet++;
      else desktop++;
    });
    return [
      { name: "Mobile", value: mobile },
      { name: "Tablet", value: tablet },
      { name: "Desktop", value: desktop },
    ].filter((d) => d.value > 0);
  };

  // Recent events
  const recentEvents = events.slice(0, 20);

  const chartConfig = {
    pageviews: { label: "Page Views", color: "hsl(var(--primary))" },
    sessions: { label: "Sessions", color: "hsl(var(--gold))" },
    clicks: { label: "Clicks", color: "hsl(var(--chart-3, 30 80% 55%))" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Site Analytics</h2>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalSessions}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalPageViews}</p>
                <p className="text-xs text-muted-foreground">Page Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MousePointerClick className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalClicks}</p>
                <p className="text-xs text-muted-foreground">CTA Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bounce rate + pages/session */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{bounceRate}%</p>
                <p className="text-xs text-muted-foreground">Bounce Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalSessions > 0 ? (totalPageViews / totalSessions).toFixed(1) : "0"}
                </p>
                <p className="text-xs text-muted-foreground">Pages/Session</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{formViews}</p>
                <p className="text-xs text-muted-foreground">Form Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{formSubmits}</p>
                <p className="text-xs text-muted-foreground">Form Submits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Traffic Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={dailyData()}>
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pageviews" fill="var(--color-pageviews)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sessions" fill="var(--color-sessions)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData().map((stage, i) => {
                const maxCount = Math.max(...funnelData().map((s) => s.count), 1);
                const width = Math.max((stage.count / maxCount) * 100, 5);
                return (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{stage.stage}</span>
                      <span className="font-medium text-foreground">{stage.count}</span>
                    </div>
                    <div className="h-6 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{ width: `${width}%`, backgroundColor: stage.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {trafficSources().length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
            ) : (
              <ChartContainer
                config={{ value: { label: "Visits", color: "hsl(var(--primary))" } }}
                className="h-[200px] w-full"
              >
                <PieChart>
                  <Pie
                    data={trafficSources()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {trafficSources().map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {topPages().length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
            ) : (
              <div className="space-y-2">
                {topPages().map((p) => (
                  <div key={p.path} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground truncate max-w-[180px]">{p.path}</span>
                    <Badge variant="secondary">{p.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Devices</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceBreakdown().length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
            ) : (
              <ChartContainer
                config={{ value: { label: "Sessions", color: "hsl(var(--primary))" } }}
                className="h-[200px] w-full"
              >
                <PieChart>
                  <Pie
                    data={deviceBreakdown()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {deviceBreakdown().map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA Click Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">CTA Click Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {ctaClicks().length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No CTA clicks recorded yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CTA Label</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ctaClicks().map((c) => (
                  <TableRow key={c.label}>
                    <TableCell className="font-medium">{c.label}</TableCell>
                    <TableCell className="text-right">{c.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Events Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No events recorded yet</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Page</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{e.event_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{e.event_category || "—"}</TableCell>
                      <TableCell className="text-sm truncate max-w-[200px]">{e.event_label || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.page_path || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
