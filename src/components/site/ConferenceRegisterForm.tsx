import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { loadPaymentsConfig, startCheckout } from "@/lib/checkout";
import { formatConferenceDates, formatNaira } from "@/lib/format";
import { notify } from "@/lib/toast";
import { BankTransferCheckout, type BankTransferSession } from "@/components/payments/BankTransferCheckout";
import {
  PaymentMethodStep,
  resolveDefaultMethod,
  type PaymentMethodChoice,
} from "@/components/payments/PaymentMethodStep";

type Package = {
  slug: string;
  name: string;
  description?: string;
  amountNgn: number | string;
  participantType: string;
};

type PublicConference = {
  slug: string;
  title: string;
  startsOn: string;
  endsOn: string;
  venue: string;
  city: string;
  isFree: boolean;
  fromAmountNgn: number | null;
  registrationOpen?: boolean;
  packages: Package[];
};

/** Open registration for guests and members — ticket only, never creates membership. */
export function ConferenceRegisterForm({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["conference", slug],
    queryFn: () => apiGet<PublicConference>(`/public/conferences/${slug}`),
  });
  const payCfg = useQuery({
    queryKey: ["payments-config"],
    queryFn: () => loadPaymentsConfig(),
  });

  const packages = useMemo(() => {
    const all = q.data?.packages ?? [];
    const preferred = all.filter((p) => p.participantType === "GENERAL" || p.participantType === "CORPORATE");
    const pool = preferred.length ? preferred : all;
    return [...pool].sort((a, b) => {
      if (a.participantType === "GENERAL" && b.participantType !== "GENERAL") return -1;
      if (b.participantType === "GENERAL" && a.participantType !== "GENERAL") return 1;
      return Number(a.amountNgn) - Number(b.amountNgn);
    });
  }, [q.data?.packages]);

  const [pkg, setPkg] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [eventTermsConsent, setEventTermsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<PaymentMethodChoice>("PAYSTACK");
  const [bankSession, setBankSession] = useState<BankTransferSession | null>(null);
  const [pendingReg, setPendingReg] = useState<{ number: string; email: string } | null>(null);
  const [details, setDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organisation: "",
    jobTitle: "",
  });

  useEffect(() => {
    if (!user) return;
    setDetails((d) => ({
      ...d,
      firstName: d.firstName || user.firstName || "",
      lastName: d.lastName || user.lastName || "",
      email: d.email || user.email || "",
      phone: d.phone || user.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    if (!packages.length) return;
    setPkg((current) => (packages.some((p) => p.slug === current) ? current : packages[0].slug));
  }, [packages]);

  useEffect(() => {
    if (payCfg.data) setMethod(resolveDefaultMethod(payCfg.data));
  }, [payCfg.data]);

  const selected = packages.find((p) => p.slug === pkg);
  const effectivePackage = selected ?? packages[0];
  const isFree = Boolean(q.data?.isFree) || (Boolean(effectivePackage) && Number(effectivePackage?.amountNgn) === 0);

  async function submit() {
    if (!q.data) return;
    if (!details.firstName.trim() || !details.lastName.trim() || !details.email.trim()) {
      notify.error("First name, last name and email are required.");
      return;
    }
    if (!privacyConsent || !eventTermsConsent) {
      notify.error("Please accept the Privacy Notice and event terms to continue.");
      return;
    }
    setLoading(true);
    try {
      const email = details.email.trim().toLowerCase();
      const data = await apiPost<{
        id: string;
        registrationNumber: string;
        amountNgn: number;
        paymentRequired: boolean;
        invite?: { email?: string } | null;
      }>(`/public/conferences/${slug}/register`, {
        ...(pkg ? { packageSlug: pkg } : {}),
        privacyConsent,
        eventTermsConsent,
        marketingConsent,
        details: {
          firstName: details.firstName.trim(),
          lastName: details.lastName.trim(),
          email,
          phone: details.phone.trim() || undefined,
          organisation: details.organisation.trim() || undefined,
          jobTitle: details.jobTitle.trim() || undefined,
        },
      });

      if (data.paymentRequired && Number(data.amountNgn) > 0) {
        const pay = await startCheckout({
          purpose: "CONFERENCE",
          linkedId: data.id,
          email,
          method,
        });
        if (pay.mode === "bank") {
          setPendingReg({ number: data.registrationNumber, email });
          setBankSession(pay.session);
          notify.success("Registration saved. Complete bank transfer below.");
          return;
        }
        if (pay.cancelled) {
          notify.error("Payment was cancelled.");
          return;
        }
        if (!pay.verified) {
          notify.error("Payment could not be verified.");
          return;
        }
      }

      notify.success(`Registration confirmed. ${data.registrationNumber}`);
      await navigate({
        to: "/conference/invite",
        search: { number: data.registrationNumber, email },
      });
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  if (q.isPending) return <Skeleton className="h-80" />;
  if (q.isError || !q.data) {
    return (
      <p className="text-sm text-[color:var(--muted-foreground)]">
        Conference not found.{" "}
        <Link to="/conferences" className="font-semibold text-[color:var(--brand-green)]">
          Browse conferences
        </Link>
      </p>
    );
  }

  if (bankSession) {
    return (
      <div className={compact ? "space-y-4" : "mx-auto max-w-xl space-y-4"}>
        <BankTransferCheckout
          session={bankSession}
          onSubmitted={() => {
            notify.success(
              pendingReg
                ? `Receipt submitted for ${pendingReg.number}. You will be emailed when confirmed.`
                : "Receipt submitted for verification.",
            );
          }}
        />
        {pendingReg ? (
          <p className="text-sm text-muted-foreground">
            Registration ID <span className="font-mono font-semibold">{pendingReg.number}</span>. After confirmation, retrieve
            your e-invite via{" "}
            <Link to="/conference/lookup" className="font-semibold text-[color:var(--brand-green)]">
              Find e-invite
            </Link>
            .
          </p>
        ) : null}
      </div>
    );
  }

  const conf = q.data;
  const summaryPrice =
    isFree
      ? "Free"
      : selected
        ? formatNaira(Number(selected.amountNgn))
        : conf.fromAmountNgn == null
          ? "Unavailable"
          : `From ${formatNaira(conf.fromAmountNgn)}`;
  const payLabel = isFree
    ? "Complete registration"
    : method === "BANK_TRANSFER"
      ? "Continue to bank transfer"
      : "Pay with Paystack";

  return (
    <div className={compact ? "space-y-4" : "mx-auto max-w-xl space-y-4"}>
      {!compact ? (
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--brand-tint)]/40 p-4 text-sm">
          <p className="font-semibold text-[color:var(--brand-deep)]">{conf.title}</p>
          <p className="mt-1 text-[color:var(--muted-foreground)]">
            {formatConferenceDates(conf.startsOn, conf.endsOn)} · {conf.venue}, {conf.city}
          </p>
          <p className="mt-2 font-semibold text-[color:var(--brand-green)]">{summaryPrice}</p>
          {conf.registrationOpen === false ? (
            <p className="mt-2 text-amber-700">Registration is currently closed for this conference.</p>
          ) : null}
          {conf.registrationOpen !== false && packages.length === 0 ? (
            <p className="mt-2 text-amber-700">No ticket categories are currently available for registration.</p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-[color:var(--border)] bg-white p-4 text-sm">
          <p className="font-semibold text-[color:var(--brand-deep)]">Fee: {summaryPrice}</p>
          <p className="mt-1 text-[color:var(--muted-foreground)]">
            Open to everyone — members and guests. This is a conference ticket, not membership.
          </p>
          {conf.registrationOpen === false ? (
            <p className="mt-2 text-amber-700">Registration is currently closed for this conference.</p>
          ) : null}
          {conf.registrationOpen !== false && packages.length === 0 ? (
            <p className="mt-2 text-amber-700">No ticket categories are currently available for registration.</p>
          ) : null}
        </div>
      )}

      {packages.length > 1 ? (
        <div className="grid gap-3">
          {packages.map((p) => (
            <label
              key={p.slug}
              className={`rounded-xl border p-4 ${pkg === p.slug ? "border-[color:var(--brand-emerald)]" : "border-[color:var(--border)]"}`}
            >
              <input type="radio" className="mr-2" checked={pkg === p.slug} onChange={() => setPkg(p.slug)} />
              {p.name} · {Number(p.amountNgn) === 0 ? "Free" : formatNaira(Number(p.amountNgn))}
              {p.description ? <span className="mt-1 block text-sm text-muted-foreground">{p.description}</span> : null}
            </label>
          ))}
        </div>
      ) : null}
      {packages.length === 1 && packages[0].description ? (
        <p className="text-sm text-muted-foreground">{packages[0].description}</p>
      ) : null}

      {(
        [
          ["firstName", "First name", true],
          ["lastName", "Last name", true],
          ["email", "Email", true],
          ["phone", "Phone", false],
          ["organisation", "Organisation", false],
          ["jobTitle", "Job title", false],
        ] as const
      ).map(([key, label, required]) => (
        <input
          key={key}
          required={required}
          type={key === "email" ? "email" : "text"}
          placeholder={label}
          className="w-full rounded-md border px-3 py-3"
          value={details[key]}
          onChange={(e) => setDetails({ ...details, [key]: e.target.value })}
        />
      ))}

      {!isFree && payCfg.data ? (
        <PaymentMethodStep config={payCfg.data} value={method} onChange={setMethod} />
      ) : null}

      <div className="space-y-3 rounded-lg border border-[color:var(--border)] p-4">
        <label className="flex items-start gap-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
          <input
            type="checkbox"
            required
            className="mt-1"
            checked={privacyConsent}
            onChange={(e) => setPrivacyConsent(e.target.checked)}
          />
          <span>
            I agree that Data Protection Officers Conference may use my information to process this registration in line with the{" "}
            <Link to="/legal/$slug" params={{ slug: "privacy-notice" }} className="font-semibold text-[color:var(--brand-green)]">
              Privacy Notice
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
          <input
            type="checkbox"
            required
            className="mt-1"
            checked={eventTermsConsent}
            onChange={(e) => setEventTermsConsent(e.target.checked)}
          />
          <span>
            I accept the{" "}
            <Link to="/legal/$slug" params={{ slug: "terms-of-use" }} className="font-semibold text-[color:var(--brand-green)]">
              event terms
            </Link>{" "}
            and{" "}
            <Link to="/legal/$slug" params={{ slug: "refund-policy" }} className="font-semibold text-[color:var(--brand-green)]">
              refund policy
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
          <input
            type="checkbox"
            className="mt-1"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
          />
          <span>Send me optional conference and professional updates. I can unsubscribe at any time.</span>
        </label>
      </div>

      <p className="text-xs text-[color:var(--muted-foreground)]">
        This registers you for a conference ticket only — not membership.{" "}
        <Link to="/membership" className="font-semibold text-[color:var(--brand-green)]">
          Want membership as well? Apply separately
        </Link>
        .
      </p>

      <Button
        loading={loading}
        disabled={conf.registrationOpen === false || packages.length === 0}
        className="w-full gradient-brand text-white"
        onClick={() => void submit()}
      >
        {payLabel}
      </Button>
    </div>
  );
}
