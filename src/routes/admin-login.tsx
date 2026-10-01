import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { AuthError, AuthField, AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { ApiRequestError } from "@/lib/api";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Staff sign in | DPO Conference" },
      { name: "description", content: "Secretariat access to the DPO Conference administration suite." },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(nextEmail: string, nextPassword: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail) || nextPassword.length < 6) {
      setError("Enter a valid staff email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await login(nextEmail, nextPassword, rememberMe);
      if (!user.permissions.includes("admin.access")) {
        await logout();
        setError("Member accounts must sign in on the Client sign in page.");
        notify.error("Use Client sign in for member accounts.");
        return;
      }
      notify.success(`Welcome back, ${user.firstName}.`);
      await navigate({ to: "/admin" });
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 429) {
        setError(err.message || "Too many attempts. Wait a few minutes and try again.");
        notify.warning("Too many login attempts. Try again shortly.");
      } else if (err instanceof ApiRequestError && err.status === 401) {
        setError("Invalid email or password.");
        notify.error("Invalid email or password");
      } else if (err instanceof ApiRequestError) {
        setError(err.message);
        notify.error(err.message);
      } else {
        setError("Could not reach the server. Check your connection and try again.");
        notify.error("Could not reach the server.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout variant="admin">
      <span className="inline-flex items-center gap-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Lock className="h-3 w-3" />
        Staff access
      </span>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">Administration sign in</h2>
      <p className="mt-1 text-sm text-muted-foreground">Restricted to Secretariat roles. Access is audited.</p>
      <AuthError message={error} />
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void signIn(email, password);
        }}
      >
        <AuthField label="Work email">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
          </div>
        </AuthField>
        <AuthField label="Password">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9"
            />
          </div>
        </AuthField>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="rounded border-border" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Remember this device
          </label>
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password
          </Link>
        </div>
        <Button
          type="submit"
          loading={loading}
          loadingText="Checking…"
          className="h-auto w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Member or applicant?{" "}
        <Link to="/login" search={{}} className="font-medium text-primary hover:underline">
          Client sign in
        </Link>
      </p>
      <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        Enterprise SSO is available for Secretariat tenants on request.
      </div>
    </AuthLayout>
  );
}
