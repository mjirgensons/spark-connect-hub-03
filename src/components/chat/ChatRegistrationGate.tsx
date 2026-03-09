import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from "lucide-react";

type View = "signup" | "otp" | "signin";

interface Props {
  dismissable: boolean;
  onDismiss: () => void;
  onAuthenticated: () => void;
  onVerificationComplete?: () => void;
  sessionId: string;
}

export default function ChatRegistrationGate({ dismissable, onDismiss, onAuthenticated, onVerificationComplete, sessionId }: Props) {
  const [view, setView] = useState<View>("signup");

  return (
    <div className="absolute inset-0 z-20 bg-background flex flex-col overflow-y-auto">
      {view === "signup" && (
        <SignUpView
          dismissable={dismissable}
          onDismiss={onDismiss}
          onOtp={(data) => setView("otp")}
          onSwitchToSignIn={() => setView("signin")}
          sessionId={sessionId}
          onAuthenticated={onAuthenticated}
        />
      )}
      {view === "otp" && (
        <OtpView
          onBack={() => setView("signup")}
          onAuthenticated={onAuthenticated}
          onVerificationComplete={onVerificationComplete}
          sessionId={sessionId}
        />
      )}
      {view === "signin" && (
        <SignInView
          onSwitchToSignUp={() => setView("signup")}
          onAuthenticated={onAuthenticated}
        />
      )}
    </div>
  );
}

/* ── Shared state for passing form data between signup → OTP ── */
let _pendingFormData: { email: string; name: string; marketingOptIn: boolean } | null = null;

/* ── View A: Sign Up ── */
function SignUpView({
  dismissable,
  onDismiss,
  onOtp,
  onSwitchToSignIn,
  sessionId,
  onAuthenticated,
}: {
  dismissable: boolean;
  onDismiss: () => void;
  onOtp: (d: any) => void;
  onSwitchToSignIn: () => void;
  sessionId: string;
  onAuthenticated: () => void;
}) {
  const [name, setName] = useState(_pendingFormData?.name ?? "");
  const [email, setEmail] = useState(_pendingFormData?.email ?? "");
  const [password, setPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Please fill all fields (password min 6 chars).");
      return;
    }
    setBusy(true);
    try {
      const { error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim(), user_type: "client" } },
      });
      if (authErr) throw authErr;
      // Account created with session (auto-confirm enabled). Now send custom OTP.
      _pendingFormData = { email: email.trim(), name: name.trim(), marketingOptIn };
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-verification-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
      } catch {
        // non-blocking — user can resend from OTP view
      }
      onOtp({ email: email.trim() });
    } catch (err: any) {
      setError(err.message || "Sign up failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 py-6">
      <p className="font-bold text-sm font-sans text-foreground">Create your free account</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Sign up to save your chat history and continue the conversation anytime.
      </p>
      <Input
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border-2 border-foreground text-sm h-9"
        style={{ borderRadius: 0 }}
        required
      />
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border-2 border-foreground text-sm h-9"
        style={{ borderRadius: 0 }}
        required
      />
      <Input
        type="password"
        placeholder="Password (min 6 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border-2 border-foreground text-sm h-9"
        style={{ borderRadius: 0 }}
        required
        minLength={6}
      />
      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          checked={marketingOptIn}
          onCheckedChange={(v) => setMarketingOptIn(v === true)}
          className="mt-0.5"
        />
        <span className="text-xs text-muted-foreground leading-snug">
          Send me product updates and promotions
        </span>
      </label>
      <p className="text-[10px] text-muted-foreground leading-snug">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={busy}
        className="w-full border-2 border-foreground font-bold text-sm h-9"
        style={{ borderRadius: 0 }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
      </Button>
      {dismissable && (
        <button type="button" onClick={onDismiss} className="text-xs text-muted-foreground hover:underline self-center">
          No thanks
        </button>
      )}
      <button type="button" onClick={onSwitchToSignIn} className="text-xs text-muted-foreground hover:underline self-center">
        Already have an account? <span className="text-foreground font-semibold">Sign in</span>
      </button>
    </form>
  );
}

/* ── View B: OTP ── */
function OtpView({
  onBack,
  onAuthenticated,
  onVerificationComplete,
  sessionId,
}: {
  onBack: () => void;
  onAuthenticated: () => void;
  onVerificationComplete?: () => void;
  sessionId: string;
}) {
  const email = _pendingFormData?.email ?? "";
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const submitOtp = useCallback(
    async (code: string) => {
      setError("");
      setBusy(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/functions/v1/verify-otp-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        const result = await res.json();
        if (!result.success) {
          setError(result.error || "Invalid code, please try again.");
          setDigits(Array(6).fill(""));
          setTimeout(() => inputsRef.current[0]?.focus(), 50);
          return;
        }
        // Mark email as verified in user metadata
        await supabase.auth.updateUser({ data: { email_verified_at: new Date().toISOString() } });
        if (_pendingFormData) {
          await callConsentEdge(_pendingFormData.email, _pendingFormData.marketingOptIn, sessionId);
        }
        _pendingFormData = null;
        onVerificationComplete?.();
        onAuthenticated();
      } catch {
        setError("Verification failed. Please try again.");
        setDigits(Array(6).fill(""));
        setTimeout(() => inputsRef.current[0]?.focus(), 50);
      } finally {
        setBusy(false);
      }
    },
    [email, onAuthenticated, sessionId]
  );

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      submitOtp(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      e.preventDefault();
      const next = text.split("");
      setDigits(next);
      submitOtp(text);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-verification-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!result.success && result.retry_after) {
        setResendCooldown(result.retry_after);
      }
    } catch {
      // non-blocking
    }
  };

  return (
    <div className="flex flex-col gap-3 px-5 py-6">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="w-3 h-3" /> Back
      </button>
      <p className="font-bold text-sm font-sans text-foreground">Check your email</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>. Enter it below to verify your account.
      </p>
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={busy}
            className="w-9 h-10 text-center text-sm font-mono border-2 border-foreground bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            style={{ borderRadius: 0 }}
          />
        ))}
      </div>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
      {busy && <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />}
      <button
        type="button"
        onClick={handleResend}
        disabled={resendCooldown > 0}
        className="text-xs text-muted-foreground hover:underline self-center disabled:opacity-50"
      >
        {resendCooldown > 0 ? `Resend in ${resendCooldown}s...` : "Resend code"}
      </button>
    </div>
  );
}

/* ── View C: Sign In ── */
function SignInView({
  onSwitchToSignUp,
  onAuthenticated,
}: {
  onSwitchToSignUp: () => void;
  onAuthenticated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authErr) throw authErr;
      onAuthenticated();
    } catch (err: any) {
      setError(err.message || "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetSent(true);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 py-6">
      <p className="font-bold text-sm font-sans text-foreground">Welcome back</p>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border-2 border-foreground text-sm h-9"
        style={{ borderRadius: 0 }}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border-2 border-foreground text-sm h-9"
        style={{ borderRadius: 0 }}
        required
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {resetSent && <p className="text-xs text-muted-foreground">Password reset link sent to your email.</p>}
      <Button
        type="submit"
        disabled={busy}
        className="w-full border-2 border-foreground font-bold text-sm h-9"
        style={{ borderRadius: 0 }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
      </Button>
      <button type="button" onClick={handleForgotPassword} className="text-xs text-muted-foreground hover:underline self-center">
        Forgot password?
      </button>
      <button type="button" onClick={onSwitchToSignUp} className="text-xs text-muted-foreground hover:underline self-center">
        Don't have an account? <span className="text-foreground font-semibold">Sign up</span>
      </button>
    </form>
  );
}

/* ── Helper ── */
async function callConsentEdge(email: string, marketingOptIn: boolean, sessionId: string) {
  try {
    await supabase.functions.invoke("save-marketing-consent", {
      body: {
        email,
        consent_type: "implied_inquiry",
        session_id: sessionId,
        page_url: window.location.href,
        marketing_opt_in: marketingOptIn,
      },
    });
  } catch {
    // non-blocking
  }
}
