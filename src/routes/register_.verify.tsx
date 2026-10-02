import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthError, AuthLayout, AuthStepper } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { apiPost, ApiRequestError } from "@/lib/api";
import { parseAuthContinueSearch, useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/register_/verify")({
  validateSearch: (s: Record<string, unknown>) => ({
    email: typeof s.email === "string" ? s.email : "",
    ...parseAuthContinueSearch(s),
  }),
  head: () => ({ meta: [{ title: "Verify email | Data Protection Officers Conference" }] }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email, redirect, category } = Route.useSearch();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function verify(nextCode = code) {
    if (nextCode.length !== 6 || !email) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost<{ accessToken: string; user: { firstName: string; role: string; permissions: string[] } }>(
        "/auth/otp/verify",
        { email, code: nextCode },
      );
      setSession(data.accessToken, data.user as never);
      notify.success("Email verified. Welcome to Data Protection Officers Conference.");
      if (redirect?.startsWith("/membership/apply") || redirect?.startsWith("/portal/apply")) {
        await navigate({ to: "/portal/apply", search: category ? { category } : {} });
      } else if (redirect?.startsWith("/support")) {
        await navigate({ to: "/portal/support" });
      } else {
        await navigate({ to: data.user.permissions?.includes("admin.access") ? "/admin" : "/portal" });
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        notify.error(err.message);
      }
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      const data = await apiPost<{ devOtp?: string; cooldownSeconds?: number }>("/auth/otp/resend", { email });
      notify.success("A new code is on its way.");
      if (data.devOtp) notify.info("Development OTP", data.devOtp);
      setCooldown(data.cooldownSeconds ?? 60);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 429) {
        notify.warning("Wait before requesting another code.");
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout variant="register">
      <AuthStepper step={2} steps={["Account details", "Verify email"]} />
      <h2 className="text-2xl font-semibold tracking-tight">Check your email</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the 6-digit code sent to <strong>{email || "your email"}</strong>.
      </p>
      <AuthError message={error} />
      <div className="mt-8 flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (v.length === 6) void verify(v);
          }}
          autoComplete="one-time-code"
        >
          <InputOTPGroup className="gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot key={i} index={i} className="h-14 w-11 text-2xl font-semibold" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button
        className="mt-6 h-auto w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        loading={loading}
        loadingText="Verifying…"
        onClick={() => void verify()}
      >
        Verify
        <ArrowRight className="h-4 w-4" />
      </Button>
      <div className="mt-4 text-center">
        <Button
          type="button"
          variant="outline"
          className="rounded-full text-xs"
          disabled={cooldown > 0}
          loading={resending}
          onClick={() => void resend()}
        >
          {cooldown > 0 ? `Resend in 0:${String(cooldown).padStart(2, "0")}` : "Resend code"}
        </Button>
      </div>
      <p className="mt-6 text-center text-sm">
        <Link to="/login" search={{}} className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
