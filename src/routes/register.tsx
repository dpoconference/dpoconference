import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthError, AuthField, AuthLayout, AuthStepper } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPost, ApiRequestError } from "@/lib/api";
import { parseAuthContinueSearch, useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/register")({
  validateSearch: parseAuthContinueSearch,
  head: () => ({
    meta: [{ title: "Create an Account | DPO Conference" }, { name: "description", content: "Create your DPO Conference account." }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { redirect, category } = Route.useSearch();

  useEffect(() => {
    if (authLoading || !user) return;
    if (redirect?.startsWith("/membership/apply") || redirect?.startsWith("/portal/apply")) {
      void navigate({ to: "/portal/apply", search: category ? { category } : {} });
      return;
    }
    if (redirect?.startsWith("/support")) {
      void navigate({ to: "/portal/support" });
      return;
    }
    void navigate({ to: user.permissions.includes("admin.access") ? "/admin" : "/portal" });
  }, [authLoading, user, redirect, category, navigate]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    consent: false,
    website: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.consent) {
      setError("Please accept the Privacy Notice to continue.");
      return;
    }
    if (form.password.length < 10) {
      setError("Password must be at least 10 characters and include upper, lower, number and symbol.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<{ email: string; devOtp?: string }>("/auth/register", {
        ...form,
        phone: form.phone || undefined,
      });
      notify.success(`We sent a 6-digit code to ${data.email}.`);
      if (data.devOtp) notify.info("Development OTP", data.devOtp);
      await navigate({
        to: "/register/verify",
        search: { email: data.email, ...(redirect ? { redirect } : {}), ...(category ? { category } : {}) },
      });
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError("An account with this email already exists.");
      } else if (err instanceof ApiRequestError) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout variant="register">
      <AuthStepper step={1} steps={["Account details", "Verify email"]} />
      <h2 className="text-2xl font-semibold tracking-tight">Create an account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Join DPO Conference to apply for membership, register for events and track your CPD.
      </p>
      <AuthError message={error} />
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input className="hidden" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <AuthField label="First name">
            <Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </AuthField>
          <AuthField label="Surname">
            <Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </AuthField>
        </div>
        <AuthField label="Email address">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-9" />
          </div>
        </AuthField>
        <AuthField label="Telephone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </AuthField>
        <AuthField label="Password">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-9" />
          </div>
        </AuthField>
        <AuthField label="Confirm password">
          <Input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        </AuthField>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" className="mt-1 rounded border-border" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
          <span>
            I agree to the{" "}
            <Link to="/legal/$slug" params={{ slug: "privacy-notice" }} className="font-medium text-primary hover:underline">
              Privacy Notice
            </Link>
            .
          </span>
        </label>
        <Button
          type="submit"
          loading={loading}
          loadingText="Creating account…"
          className="h-auto w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/login"
          search={{ ...(redirect ? { redirect } : {}), ...(category ? { category } : {}) }}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
