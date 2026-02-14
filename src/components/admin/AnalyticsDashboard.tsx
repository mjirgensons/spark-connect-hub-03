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
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import {
  Users, Eye, MousePointerClick, Clock, TrendingUp, ArrowUpRight,
  BarChart3, Target, Info, UserCheck, UserPlus, Monitor, LayoutDashboard,
  Timer, Repeat,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

/** Small info icon with a tooltip explanation */
const InfoBadge = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help inline-block ml-1 shrink-0" />
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
      {text}
    </TooltipContent>
  </Tooltip>
);

/** KPI card with built-in info tooltip */
const KpiCard = ({
  icon: Icon,
  value,
  label,
  info,
  iconColor = "text-primary",
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  info: string;
  iconColor?: string;
}) => (
  <Card>
    <CardContent className="pt-5 pb-4">
      <div className="flex items-center gap-3">
        <Icon className={`w-7 h-7 ${iconColor}`} />
        <div className="min-w-0">
          <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center">
            {label}
            <InfoBadge text={info} />
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

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

  // ─── Computed metrics ───────────────────────────────────
  const totalSessions = sessions.length;
  const totalPageViews = events.filter((e) => e.event_type === "page_view").length;
  const totalClicks = events.filter((e) => e.event_type === "click").length;
  const formViews = events.filter((e) => e.event_type === "form_view").length;
  const formSubmits = events.filter((e) => e.event_type === "form_submit").length;
  const bounceRate = totalSessions > 0 ? Math.round((sessions.filter((s) => s.is_bounce).length / totalSessions) * 100) : 0;
  const conversionRate = formViews > 0 ? Math.round((formSubmits / formViews) * 100) : 0;

  // Unique visitors = unique session_ids (each browser tab/session generates a unique id stored in sessionStorage)
  const uniqueSessionIds = new Set(sessions.map((s) => s.session_id));
  const uniqueVisitors = uniqueSessionIds.size;

  // Returning visitors approximation: sessions that have is_bounce=false AND page_count > 1
  // (a rough proxy — truly returning visitors would need user-level tracking, but session re-engagement is a good signal)
  const engagedSessions = sessions.filter((s) => !s.is_bounce && s.page_count > 1).length;
  const newVisitors = totalSessions - engagedSessions;

  // Landing page views = page_view events where page_path is "/"
  const landingPageViews = events.filter((e) => e.event_type === "page_view" && e.page_path === "/").length;

  // Average session duration (seconds → formatted)
  const avgDuration = totalSessions > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / totalSessions)
    : 0;
  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  // Product views
  const productViews = events.filter((e) => e.event_type === "product_view").length;

  // Section views
  const sectionViews = events.filter((e) => e.event_type === "section_view").length;

  // ─── Chart data helpers ─────────────────────────────────
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

  const trafficSources = () => {
    const sources: Record<string, number> = {};
    sessions.forEach((s) => {
      const source = s.utm_source || (s.referrer ? (() => { try { return new URL(s.referrer).hostname; } catch { return "Unknown"; } })() : "Direct");
      sources[source] = (sources[source] || 0) + 1;
    });
    return Object.entries(sources)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  };

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

  const funnelData = () => [
    { stage: "Page Views", count: totalPageViews, color: CHART_COLORS[0] },
    { stage: "Section Views", count: sectionViews, color: CHART_COLORS[1] },
    { stage: "CTA Clicks", count: totalClicks, color: CHART_COLORS[2] },
    { stage: "Form Views", count: formViews, color: CHART_COLORS[3] },
    { stage: "Form Submits", count: formSubmits, color: CHART_COLORS[4] },
  ];

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
    <TooltipProvider delayDuration={200}>
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

        {/* Row 1: Core KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={Users}
            value={totalSessions}
            label="Sessions"
            info="Total browsing sessions in the selected period. A session starts when a user opens the site and ends after inactivity. Data from analytics_sessions table."
          />
          <KpiCard
            icon={Eye}
            value={totalPageViews}
            label="Page Views"
            info="Total number of pages loaded by all visitors. Each navigation to a new route triggers a 'page_view' event stored in analytics_events."
          />
          <KpiCard
            icon={MousePointerClick}
            value={totalClicks}
            label="CTA Clicks"
            info="Number of Call-to-Action button clicks (e.g. 'Get a Quote', 'Contact Us'). Tracked as 'click' events with category 'cta' in analytics_events."
          />
          <KpiCard
            icon={Target}
            value={`${conversionRate}%`}
            label="Conversion"
            info="Percentage of users who submitted a form after viewing it. Formula: (Form Submits ÷ Form Views) × 100. Higher = better lead capture."
          />
        </div>

        {/* Row 2: Visitor & engagement KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={UserPlus}
            value={uniqueVisitors}
            label="Unique Visitors"
            info="Count of distinct session IDs. Each browser tab generates a unique session ID stored in sessionStorage. Approximates unique visitors (not cross-device)."
          />
          <KpiCard
            icon={UserCheck}
            value={engagedSessions}
            label="Engaged Sessions"
            info="Sessions where the user viewed more than 1 page and didn't bounce. Indicates genuine interest. Calculated from sessions with is_bounce=false AND page_count > 1."
            iconColor="text-muted-foreground"
          />
          <KpiCard
            icon={Repeat}
            value={newVisitors}
            label="Single-page Sessions"
            info="Sessions where the visitor viewed only one page or bounced immediately. High numbers may indicate users aren't finding what they need. Equals Total Sessions minus Engaged Sessions."
            iconColor="text-muted-foreground"
          />
          <KpiCard
            icon={Timer}
            value={formatDuration(avgDuration)}
            label="Avg Duration"
            info="Average time a session lasts, in seconds. Calculated from (last_activity_at - started_at) stored in each session record. Longer = more engagement."
            iconColor="text-muted-foreground"
          />
        </div>

        {/* Row 3: More metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={LayoutDashboard}
            value={landingPageViews}
            label="Landing Page Views"
            info="How many times the homepage (/) was viewed. Tracked from 'page_view' events where page_path='/'. Shows landing page reach."
          />
          <KpiCard
            icon={ArrowUpRight}
            value={`${bounceRate}%`}
            label="Bounce Rate"
            info="Percentage of sessions where the user left without any interaction (single page, no clicks). Formula: (Bounced Sessions ÷ Total Sessions) × 100. Lower is better."
            iconColor="text-muted-foreground"
          />
          <KpiCard
            icon={BarChart3}
            value={totalSessions > 0 ? (totalPageViews / totalSessions).toFixed(1) : "0"}
            label="Pages / Session"
            info="Average number of pages viewed per session. Formula: Total Page Views ÷ Total Sessions. Higher means users explore more content."
            iconColor="text-muted-foreground"
          />
          <KpiCard
            icon={Monitor}
            value={productViews}
            label="Product Views"
            info="Number of individual product detail pages viewed. Tracked as 'product_view' events in analytics_events. Shows product interest level."
            iconColor="text-muted-foreground"
          />
        </div>

        {/* Row 4: Form funnel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={Eye}
            value={formViews}
            label="Form Views"
            info="How many times a lead form was shown to visitors. Tracked as 'form_view' events. The form becomes visible when users scroll to it or navigate to a form page."
            iconColor="text-muted-foreground"
          />
          <KpiCard
            icon={TrendingUp}
            value={formSubmits}
            label="Form Submits"
            info="Number of completed form submissions. Tracked as 'form_submit' events in analytics_events. Each submit represents a potential lead."
            iconColor="text-muted-foreground"
          />
          <KpiCard
            icon={Eye}
            value={sectionViews}
            label="Section Views"
            info="Number of landing page sections that entered the viewport. Tracked via Intersection Observer as 'section_view' events. Shows which sections users actually see."
            iconColor="text-muted-foreground"
          />
          <KpiCard
            icon={TrendingUp}
            value={`${totalSessions > 0 ? Math.round((formSubmits / totalSessions) * 100) : 0}%`}
            label="Lead Rate"
            info="Percentage of all sessions that resulted in a form submission. Formula: (Form Submits ÷ Total Sessions) × 100. Your overall lead generation efficiency."
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Daily Traffic Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                Daily Traffic
                <InfoBadge text="Bar chart showing daily page views and sessions over the selected period. Data aggregated from analytics_events (page_view type) and analytics_sessions (by started_at date)." />
              </CardTitle>
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                Conversion Funnel
                <InfoBadge text="Visualizes the user journey from first page view → section views → CTA clicks → form views → form submissions. Each bar shows how many users reached that stage. Drop-offs between stages reveal optimization opportunities." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnelData().map((stage) => {
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                Traffic Sources
                <InfoBadge text="Shows where visitors come from. 'Direct' = typed URL or bookmark. Other sources come from utm_source parameter or the HTTP referrer header stored in each session." />
              </CardTitle>
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                Top Pages
                <InfoBadge text="Most visited pages ranked by page_view count. Data from analytics_events where event_type='page_view', grouped by page_path." />
              </CardTitle>
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                Devices
                <InfoBadge text="Breakdown by screen width captured at session start. Mobile: <768px, Tablet: 768-1023px, Desktop: ≥1024px. Helps you understand which layouts matter most." />
              </CardTitle>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              CTA Click Breakdown
              <InfoBadge text="Lists every Call-to-Action button that was clicked, with click counts. Data from analytics_events where event_type='click' and event_category='cta'. The label comes from the button text passed to trackCTAClick()." />
            </CardTitle>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              Recent Events
              <InfoBadge text="Live feed of the last 20 tracked events from analytics_events table. Shows the exact event type, category, label, and which page it occurred on. Useful for real-time debugging of tracking." />
            </CardTitle>
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
    </TooltipProvider>
  );
};

export default AnalyticsDashboard;
