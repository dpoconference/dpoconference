import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Mail } from "lucide-react";
import { useState } from "react";
import { AuthError, AuthField, AuthLayout, AuthStepper } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiRequestError, apiPost } from "@/lib/api";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password | Data Protection Officers Conference" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await apiPost("/auth/forgot-password", { email });
      setSent(true);
      notify.success("If that email exists, a reset link is on its way.");
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Could not reach the server. Check your connection and try again.";
      setError(message);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout variant="forgot">
      <AuthStepper step={sent ? 4 : 1} steps={["Email", "Inbox", "New password", "Restored"]} />
      {sent ? (
        <div>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-gold-foreground">
            <Check className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">Check your inbox</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            If an account exists for {email}, we sent a single-use reset link. It expires
            automatically.
          </p>
          <Link
            to="/login"
            search={{}}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Return to sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-semibold tracking-tight">Forgot password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the email on your Data Protection Officers Conference account.
          </p>
          <AuthError message={error} />
          <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
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
            <Button
              type="submit"
              loading={loading}
              loadingText="Sending…"
              className="h-auto w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Send reset link
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <Link
            to="/login"
            search={{}}
            className="mt-6 block text-center text-sm font-medium text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </>
      )}
    </AuthLayout>
  );
}
