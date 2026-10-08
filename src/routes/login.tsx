import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AuthError, AuthField, AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, parseAuthContinueSearch } from "@/lib/auth";
import { ApiRequestError, apiGet } from "@/lib/api";
import { notify } from "@/lib/toast";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/login")({
  validateSearch: parseAuthContinueSearch,
  head: () => ({
    meta: [
      { title: "Sign in | Data Protection Officers Conference" },
      {
        name: "description",
        content: "Sign in to your Data Protection Officers Conference account.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const learnerLogin = useQuery({
    queryKey: ["learner-login-status"],
    queryFn: () => apiGet<{ enabled: boolean }>("/auth/learner-login-status"),
    retry: false,
  });

  const continueToAccount = useCallback(
    async (permissions: string[]) => {
      if (redirect?.startsWith("/courses/")) {
        const id = redirect.slice("/courses/".length).split("/")[0];
        if (id) {
          await navigate({ to: "/courses/$id", params: { id } });
          return;
        }
      }
      if (redirect?.startsWith("/portal/apply") || redirect?.startsWith("/membership/apply")) {
        await navigate({ to: "/portal/apply", search: {} });
      } else if (redirect?.startsWith("/support")) {
        await navigate({ to: "/portal/support" });
      } else if (redirect === "/portal") {
        await navigate({ to: "/portal" });
      } else {
        await navigate({ to: permissions.includes("admin.access") ? "/admin" : "/portal" });
      }
    },
    [navigate, redirect],
  );

  useEffect(() => {
    if (
      !authLoading &&
      user &&
      (learnerLogin.data?.enabled !== false || user.permissions.includes("admin.access"))
    ) {
      void continueToAccount(user.permissions);
    }
  }, [authLoading, user, learnerLogin.data?.enabled, continueToAccount]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
      setError("Enter a valid email address and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const nextUser = await login(email, password, rememberMe);
      notify.success(`Welcome back, ${nextUser.firstName}.`);
      await continueToAccount(nextUser.permissions);
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === "ATTENDEE_LOGIN_PENDING_RELEASE") {
        setError("Your attendee account is pending release by the Secretariat. A secure password-setup link will be sent when access is released.");
        notify.info("Attendee access has not been released yet.");
      } else if (err instanceof ApiRequestError && err.code === "LEARNER_LOGIN_DISABLED") {
        setError("Learner login is temporarily unavailable.");
      } else if (err instanceof ApiRequestError && err.status === 429) {
        setError(err.message || "Too many attempts. Wait a few minutes and try again.");
        notify.warning("Too many login attempts. Try again shortly.");
      } else if (err instanceof ApiRequestError && err.status === 401) {
        setError("Invalid email or password.");
        notify.error("Invalid email or password.");
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

  if (learnerLogin.data?.enabled === false && !user?.permissions.includes("admin.access")) {
    return (
      <AuthLayout variant="login">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">DPO Conference Connect</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Learner login is coming soon</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Online learner access is temporarily unavailable while the Secretariat prepares the service.
            Conference registration and ticket QR access remain separate and are not affected.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Attendees will receive a secure password-setup link when their account access is released.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Return to the conference website
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (learnerLogin.isPending && !user?.permissions.includes("admin.access")) {
    return (
      <AuthLayout variant="login">
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm sm:p-8">
          Checking learner sign-in availability…
        </div>
      </AuthLayout>
    );
  }

  if (learnerLogin.isError && !user?.permissions.includes("admin.access")) {
    return (
      <AuthLayout variant="login">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Sign-in status unavailable</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            We could not confirm whether learner sign-in is available. Please try again before signing in.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-5 w-full"
            loading={learnerLogin.isFetching}
            onClick={() => void learnerLogin.refetch()}
          >
            Retry
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="login">
      <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to continue to your account workspace.
      </p>
      <AuthError message={error} />
      <form className="mt-8 space-y-4" onSubmit={(e) => void signIn(e)}>
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
            Keep me signed in
          </label>
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
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
        New learner?{" "}
        <Link
          to="/register"
          search={redirect ? { redirect } : {}}
          className="font-medium text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Secretariat staff?{" "}
        <Link to="/admin-login" className="font-medium text-primary hover:underline">
          Use staff sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
