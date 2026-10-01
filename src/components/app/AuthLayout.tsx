import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/logo.png";

type Variant = "login" | "register" | "forgot" | "admin";

const copy: Record<
  Variant,
  { title: string; body: string; trust: string; footer: string }
> = {
  login: {
    title: "The professional command centre for Data Protection Officers.",
    body: "Membership, CPD, digital cards and conference access — in one institutional workspace.",
    trust: "Processed in line with the NDPA 2023. Payments via Paystack.",
    footer: "© 2026 DPO Conference Secretariat, Abuja",
  },
  register: {
    title: "Join Africa’s privacy leadership network.",
    body: "Create an account to apply for membership, register for events and keep a verified CPD record.",
    trust: "Your data is processed under the NDPA. We never sell member records.",
    footer: "© 2026 DPO Conference Secretariat, Abuja",
  },
  forgot: {
    title: "Restore access to your DPO Conference workspace.",
    body: "We will send a reset link to the email on your account. The link expires for your protection.",
    trust: "Reset links are single-use and expire automatically.",
    footer: "© 2026 DPO Conference Secretariat, Abuja",
  },
  admin: {
    title: "Restricted facility. Secretariat sign-in only.",
    body: "Administration of membership, fees, events and reports. Staff access is logged.",
    trust: "NDPA-aligned processing · audit trail enabled",
    footer: "© 2026 DPO Conference Secretariat · Admin Control Suite",
  },
};

export function AuthBrand({ compact = false, invert = false }: { compact?: boolean; invert?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-3">
      <img
        src={logo}
        alt="DPO Conference"
        className={compact ? "h-9 w-9 object-contain" : "h-11 w-11 object-contain"}
        style={invert ? { filter: "brightness(0) invert(1)" } : undefined}
      />
      <span className="leading-tight">
        <span className={`block text-sm font-semibold ${invert ? "text-primary-foreground" : "text-foreground"}`}>
          DPO Conference
        </span>
        <span
          className={`block text-[10px] uppercase tracking-widest ${
            invert ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          Connect · Collaborate · Change
        </span>
      </span>
    </Link>
  );
}

export function AuthAdminMark({ invert = false }: { invert?: boolean }) {
  return (
    <div className="inline-flex items-center gap-3">
      <img
        src={logo}
        alt="DPO Conference"
        className="h-9 w-9 object-contain"
        style={invert ? { filter: "brightness(0) invert(1)" } : undefined}
      />
      <span className="leading-tight">
        <span className={`block text-sm font-semibold ${invert ? "text-primary-foreground" : "text-foreground"}`}>
          DPO Conference
        </span>
        <span
          className={`block text-[10px] uppercase tracking-widest ${
            invert ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          Admin Control Suite
        </span>
      </span>
    </div>
  );
}

export function AuthLayout({
  variant,
  children,
  wide = false,
}: {
  variant: Variant;
  children: ReactNode;
  wide?: boolean;
}) {
  const hero = copy[variant];
  const isAdmin = variant === "admin";
  const isRegister = variant === "register";

  return (
    <div
      className={`grid min-h-screen bg-background ${
        isRegister ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" : "lg:grid-cols-2"
      }`}
    >
      <aside className="relative hidden min-h-screen overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 bg-royal-gradient opacity-90" />
        <div className="absolute inset-0 grid-fade" />
        <div
          className={`relative flex w-full flex-col justify-between p-12 text-primary-foreground ${
            variant === "register" ? "bg-gradient-to-br from-primary/90 via-primary/70 to-primary/40" : "bg-gradient-to-tr from-primary/90 via-primary/70 to-primary/40"
          }`}
        >
          {isAdmin ? <AuthAdminMark invert /> : <AuthBrand invert />}
          <div className="max-w-md">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">{hero.title}</h1>
            <p className="mt-4 text-primary-foreground/80">{hero.body}</p>
            <div className="mt-8 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm">
              <ShieldCheck className="h-4 w-4 shrink-0 text-gold" />
              <span>{hero.trust}</span>
            </div>
          </div>
          <p className="text-xs text-primary-foreground/60">{hero.footer}</p>
        </div>
      </aside>

      <div
        className={`flex overflow-y-auto ${
          isRegister ? "items-start p-6 md:p-10" : "items-center justify-center p-6 sm:p-8"
        }`}
      >
        <div className={`w-full ${wide || isRegister ? "max-w-lg" : isAdmin ? "max-w-md" : "max-w-lg"}`}>
          <div className="mb-8 lg:hidden">{isAdmin ? <AuthAdminMark /> : <AuthBrand compact />}</div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

export function AuthError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      {message}
    </div>
  );
}

export function AuthStepper({ step, steps }: { step: number; steps: string[] }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        {steps.map((caption, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={caption} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "bg-gold text-gold-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? "✓" : n}
              </span>
              {n < steps.length && <span className={`h-px flex-1 ${done ? "bg-primary" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">{steps[step - 1]}</p>
    </div>
  );
}
