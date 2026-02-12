import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter (per-IP, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max requests
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Validation helpers
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

const VALID_PROJECT_TYPES = ["new", "renovation", "other-project"];
const VALID_LAYOUTS = ["single-wall", "galley", "l-shape", "u-shape", "island", "other-layout"];
const VALID_STYLES = ["modern", "traditional", "transitional", "industrial", "other-style"];

function validateBody(body: Record<string, unknown>): string | null {
  // Required string fields with max lengths
  const requiredStrings: [string, number][] = [
    ["name", 100],
    ["email", 255],
    ["phone", 30],
    ["projectType", 50],
    ["layout", 50],
    ["primaryWall", 50],
    ["ceilingHeight", 50],
    ["style", 50],
    ["budget", 100],
    ["bundle", 100],
    ["timeline", 100],
  ];

  for (const [field, maxLen] of requiredStrings) {
    const val = body[field];
    if (val == null || (typeof val === "string" && val.trim() === "")) {
      return `Missing required field: ${field}`;
    }
    if (typeof val !== "string" && typeof val !== "number") {
      return `Invalid type for field: ${field}`;
    }
    if (String(val).length > maxLen) {
      return `Field '${field}' exceeds maximum length of ${maxLen}`;
    }
  }

  // Email format
  if (!EMAIL_RE.test(String(body.email).trim())) {
    return "Invalid email format";
  }

  // Phone format
  if (!PHONE_RE.test(String(body.phone).trim())) {
    return "Invalid phone format";
  }

  // Enum validation
  if (!VALID_PROJECT_TYPES.includes(String(body.projectType).trim())) {
    return "Invalid project type";
  }
  if (!VALID_LAYOUTS.includes(String(body.layout).trim())) {
    return "Invalid layout value";
  }
  if (!VALID_STYLES.includes(String(body.style).trim())) {
    return "Invalid style value";
  }

  // Optional fields length check
  const optionalStrings: [string, number][] = [
    ["secondaryWall", 50],
    ["obstacles", 500],
    ["layoutOther", 200],
    ["styleOther", 200],
  ];
  for (const [field, maxLen] of optionalStrings) {
    if (body[field] != null && String(body[field]).length > maxLen) {
      return `Field '${field}' exceeds maximum length of ${maxLen}`;
    }
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Rate limiting by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Payload size check (max 10KB)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 10240) {
    return new Response(JSON.stringify({ error: "Payload too large" }), {
      status: 413,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL");
    if (!WEBHOOK_URL) {
      console.error("N8N_WEBHOOK_URL secret is not configured");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();

    // Validate all inputs
    const validationError = validateBody(body);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Build sanitized payload
    const payload = {
      name: String(body.name).trim(),
      email: String(body.email).trim(),
      phone: String(body.phone).trim(),
      projectType: String(body.projectType).trim(),
      layout: String(body.layout).trim(),
      primaryWall: `${String(body.primaryWall).trim()} mm`,
      secondaryWall: body.secondaryWall ? `${String(body.secondaryWall).trim()} mm` : "",
      ceilingHeight: `${String(body.ceilingHeight).trim()} mm`,
      obstacles: body.obstacles ? String(body.obstacles).trim() : "",
      style: String(body.style).trim(),
      budget: String(body.budget).trim(),
      bundle: String(body.bundle).trim(),
      timeline: String(body.timeline).trim(),
      layoutOther: body.layoutOther ? String(body.layoutOther).trim() : "",
      styleOther: body.styleOther ? String(body.styleOther).trim() : "",
    };

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return new Response(JSON.stringify({ success: true, status: webhookResponse.status }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Unable to process request. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
