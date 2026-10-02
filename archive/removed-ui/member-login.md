# Archived Member Sign-In Flow

This contains the member sign-in route removed temporarily from the live app. To restore it, replace `src/routes/login.tsx` with the source below and restore the public login entry point in `src/components/site/Header.tsx`.

```tsx
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { AuthError, AuthField, AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseAuthContinueSearch, useAuth } from "@/lib/auth";
import { ApiRequestError } from "@/lib/api";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/login")({
  validateSearch: parseAuthContinueSearch,
  head: () => ({
    meta: [
      { title: "Member Login | Data Protection Officers Conference" },
      { name: "description", content: "Sign in to your Data Protection Officers Conference member portal." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const { redirect, category } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(nextEmail: string, nextPassword: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (nextPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await login(nextEmail, nextPassword, rememberMe);
      if (user.permissions.includes("admin.access")) {
        await logout();
        setError("Staff accounts must sign in on the Admin sign in page.");
        notify.error("Use Admin sign in for Secretariat accounts.");
        return;
      }
      notify.success(`Welcome back, ${user.firstName}.`);
      const dest = redirect ?? "/portal";
      if (dest.startsWith("/membership/apply") || dest.startsWith("/portal/apply")) {
        await navigate({ to: "/portal/apply", search: category ? { category } : {} });
      } else if (dest.startsWith("/support")) {
        await navigate({ to: "/portal/support" });
      } else if (dest.startsWith("/training") || dest.startsWith("/seminars/")) {
        await navigate({ to: "/portal/training" });
      } else if (dest.startsWith("/conference")) {
        await navigate({ to: "/portal/conference/register" });
      } else if (dest.startsWith("/admin")) {
        await navigate({ to: "/portal" });
      } else {
        await navigate({ to: (dest.startsWith("/portal") ? dest : "/portal") as "/portal" });
      }
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === "EMAIL_NOT_VERIFIED") {
        await navigate({
          to: "/register/verify",
          search: { email: nextEmail, ...(redirect ? { redirect } : {}), ...(category ? { category } : {}) },
        });
      } else if (err instanceof ApiRequestError && err.status === 429) {
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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void signIn(email, password);
  }

  return (
    <AuthLayout variant="login">
      <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Access your Data Protection Officers Conference membership, professional training, CPD records, resources, certificates and professional community.
      </p>
      <AuthError message={error} />
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <AuthField label="Email address">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
            />
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
            <input
              type="checkbox"
              className="rounded border-border"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password
          </Link>
        </div>
        <Button
          type="submit"
          loading={loading}
          loadingText="Signing in…"
          className="h-auto w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Data Protection Officers Conference?{" "}
        <Link
          to="/register"
          search={{ ...(redirect ? { redirect } : {}), ...(category ? { category } : {}) }}
          className="font-medium text-primary hover:underline"
        >
          Create an Account
        </Link>
      </p>
    </AuthLayout>
  );
}
```
