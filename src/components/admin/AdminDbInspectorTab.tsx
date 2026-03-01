import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database, Copy, RefreshCw, AlertTriangle } from "lucide-react";

const AdminDbInspectorTab = () => {
  const { toast } = useToast();
  const [schemaText, setSchemaText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const exportSchema = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc("get_full_schema_dump" as any);
      if (rpcError) throw rpcError;
      setSchemaText(data as string);
      setLastExport(new Date().toLocaleString());
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg);
      if (msg.includes("does not exist")) {
        setError(
          "Function get_full_schema_dump() does not exist. The migration SQL may not have been applied yet."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(schemaText);
      toast({ title: "Schema copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Please select and copy manually", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5" />
                Database Schema Inspector
              </CardTitle>
              <CardDescription className="mt-1">
                Export the live database schema for external development tools (n8n, AI assistants).
                This queries the actual database, not migration files.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportSchema} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                Export Full Schema
              </Button>
              {schemaText && (
                <Button variant="outline" onClick={copyToClipboard} className="border-2">
                  <Copy className="w-4 h-4 mr-1" /> Copy to Clipboard
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Export Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Textarea
            readOnly
            value={schemaText}
            placeholder="Click 'Export Full Schema' to generate..."
            className="font-mono text-xs min-h-[600px] w-full border-2 border-foreground"
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          />

          <p className="text-xs text-muted-foreground">
            This dump includes: all table names, column names with types, defaults, NOT NULL constraints,
            primary keys, foreign keys, indexes, RLS policies, triggers, row counts, and distinct values
            for enum/type/status/category columns. Paste this into any AI conversation to give full database context.
          </p>

          {lastExport && (
            <p className="text-xs text-muted-foreground">Last export: {lastExport}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDbInspectorTab;
