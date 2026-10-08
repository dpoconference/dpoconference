import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api";
import { loadPaymentsConfig, startCheckout } from "@/lib/checkout";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { formatNaira } from "@/lib/format";
import { BankTransferCheckout, type BankTransferSession } from "@/components/payments/BankTransferCheckout";
import {
  PaymentMethodStep,
  resolveDefaultMethod,
  type PaymentMethodChoice,
} from "@/components/payments/PaymentMethodStep";

export const Route = createFileRoute("/portal/training/$slug")({
  validateSearch: (search: Record<string, unknown>): { waitlistRegistrationNumber?: string } => ({
    waitlistRegistrationNumber:
      typeof search.waitlistRegistrationNumber === "string"
        ? search.waitlistRegistrationNumber
        : undefined,
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { waitlistRegistrationNumber } = Route.useSearch();
  const isWaitlistInvitation = Boolean(waitlistRegistrationNumber);
  const { user } = useAuth();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["seminar", slug],
    queryFn: () =>
      apiGet<{
        title: string;
        soldOut: boolean;
        registrationOpen: boolean;
        registrationClosed: boolean;
        nonMemberPrice: number;
        bodyHtml?: string;
        coverUrl?: string | null;
        description?: string;
        facilitator?: string | null;
        outcomes?: string | null;
        certificateAvailable?: boolean;
      }>(`/public/seminars/${slug}`),
  });
  const payCfg = useQuery({ queryKey: ["payments-config"], queryFn: () => loadPaymentsConfig() });
  const price = Number(q.data?.nonMemberPrice ?? 0);

  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<PaymentMethodChoice>("PAYSTACK");
  const [bankSession, setBankSession] = useState<BankTransferSession | null>(null);
  const [details, setDetails] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
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
    if (payCfg.data) setMethod(resolveDefaultMethod(payCfg.data));
  }, [payCfg.data]);

  async function submit() {
    setLoading(true);
    try {
      const data = await apiPost<{
        id: string;
        registrationNumber: string;
        waitlist: boolean;
        paymentRequired: boolean;
        amountNgn: number;
      }>(`/public/seminars/${slug}/register`, {
        participantType: "GENERAL",
        waitlistRegistrationNumber,
        details,
      });
      if (data.waitlist) {
        notify.success(`Added to waitlist. ${data.registrationNumber}`);
        await navigate({ to: "/portal/learning" });
        return;
      }
      if (data.paymentRequired && data.amountNgn > 0) {
        const pay = await startCheckout({
          purpose: "SEMINAR",
          linkedId: data.id,
          email: details.email,
          method,
        });
        if (pay.mode === "bank") {
          setBankSession(pay.session);
          notify.success("Registration saved. Complete bank transfer below.");
          return;
        }
        if (pay.cancelled) {
          notify.error("Payment was cancelled.");
          return;
        }
        if (pay.verified) notify.success(`Registered. ${data.registrationNumber}`);
      } else {
        notify.success(`Registered. ${data.registrationNumber}`);
      }
      await navigate({ to: "/portal/learning" });
    } finally {
      setLoading(false);
    }
  }

  if (q.isPending) return <Skeleton className="h-64" />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title={q.data?.title ?? "Seminar"}
        subtitle={
          q.data?.registrationClosed
            ? "Registration for this seminar has closed."
            : !isWaitlistInvitation && (q.data?.soldOut || !q.data?.registrationOpen)
              ? "Registration is not currently available. Join the waitlist to be notified."
              : "Complete enrolment in your learning workspace."
        }
      />
      {q.data?.coverUrl ? <img src={q.data.coverUrl} alt="" className="max-h-48 w-full rounded-2xl object-cover" /> : null}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm">
        {q.data?.facilitator ? (
          <p>
            <span className="font-semibold">Facilitator:</span> {q.data.facilitator}
          </p>
        ) : null}
        {q.data?.outcomes ? (
          <p className="whitespace-pre-wrap">
            <span className="font-semibold">Outcomes:</span> {q.data.outcomes}
          </p>
        ) : null}
        <p>
          <span className="font-semibold">Certificate:</span>{" "}
          {q.data?.certificateAvailable ? "Available on completion" : "Not included"}
        </p>
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        {bankSession ? (
          <BankTransferCheckout session={bankSession} onSubmitted={() => notify.success("Receipt submitted for verification.")} />
        ) : (
          <>
            <p className="text-sm">
              Fee {formatNaira(price)}
            </p>
            {["firstName", "lastName", "email", "phone", "organisation"].map((k) => (
              <input
                key={k}
                className="w-full rounded-md border px-3 py-3"
                placeholder={k}
                value={(details as Record<string, string>)[k]}
                onChange={(e) => setDetails({ ...details, [k]: e.target.value })}
              />
            ))}
            {!q.data?.registrationClosed &&
            (isWaitlistInvitation || (!q.data?.soldOut && q.data?.registrationOpen)) &&
            payCfg.data ? (
              <PaymentMethodStep config={payCfg.data} value={method} onChange={setMethod} />
            ) : null}
            <Button
              loading={loading}
              disabled={q.data?.registrationClosed}
              className="w-full"
              onClick={() => void submit()}
            >
              {q.data?.registrationClosed
                ? "Registration closed"
                : !isWaitlistInvitation && (q.data?.soldOut || !q.data?.registrationOpen)
                  ? "Join waitlist"
                  : method === "BANK_TRANSFER"
                    ? "Continue to bank transfer"
                    : "Continue"}
            </Button>
            <Link to="/portal/training" className="block text-center text-sm font-medium text-primary">
              Back to catalogue
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
