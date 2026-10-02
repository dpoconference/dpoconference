import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api";
import { loadPaymentsConfig, startCheckout } from "@/lib/checkout";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/format";
import { BankTransferCheckout, type BankTransferSession } from "@/components/payments/BankTransferCheckout";
import {
  PaymentMethodStep,
  resolveDefaultMethod,
  type PaymentMethodChoice,
} from "@/components/payments/PaymentMethodStep";

export const Route = createFileRoute("/seminars/$slug/register")({
  head: () => ({ meta: [{ title: "Seminar registration | Data Protection Officers Conference" }] }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["seminar", slug],
    queryFn: () =>
      apiGet<{
        title: string;
        soldOut: boolean;
        memberPrice: number;
        nonMemberPrice: number;
      }>(`/public/seminars/${slug}`),
    enabled: !user,
  });
  const payCfg = useQuery({ queryKey: ["payments-config"], queryFn: () => loadPaymentsConfig() });
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<PaymentMethodChoice>("PAYSTACK");
  const [bankSession, setBankSession] = useState<BankTransferSession | null>(null);
  const [details, setDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organisation: "",
    jobTitle: "",
  });

  useEffect(() => {
    if (payCfg.data) setMethod(resolveDefaultMethod(payCfg.data));
  }, [payCfg.data]);

  if (!authLoading && user) {
    return <Navigate to="/portal/training/$slug" params={{ slug }} />;
  }

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
        participantType: "NON_MEMBER",
        details,
      });
      if (data.waitlist) {
        notify.success(`Added to waitlist. ${data.registrationNumber}`);
        await navigate({ to: "/training" });
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
      await navigate({ to: "/training" });
    } finally {
      setLoading(false);
    }
  }

  if (q.isPending || authLoading) {
    return (
      <SiteLayout>
        <PageHero title="Seminar registration" />
        <div className="mx-auto max-w-xl px-6 py-12">
          <Skeleton className="h-64" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero
        title={q.data?.title ?? "Seminar"}
        subtitle={
          q.data?.soldOut
            ? "This seminar is full. You can join the waitlist."
            : "Register at the standard rate. Active members receive the member rate after sign-in."
        }
      />
      <section className="mx-auto max-w-xl space-y-3 px-6 py-12">
        {bankSession ? (
          <BankTransferCheckout session={bankSession} onSubmitted={() => notify.success("Receipt submitted for verification.")} />
        ) : (
          <>
            <p className="text-sm">Fee {formatNaira(Number(q.data?.nonMemberPrice ?? 0))}</p>
            {["firstName", "lastName", "email", "phone", "organisation"].map((k) => (
              <input
                key={k}
                className="w-full rounded-md border px-3 py-3"
                placeholder={k}
                value={(details as Record<string, string>)[k]}
                onChange={(e) => setDetails({ ...details, [k]: e.target.value })}
              />
            ))}
            {!q.data?.soldOut && payCfg.data ? (
              <PaymentMethodStep config={payCfg.data} value={method} onChange={setMethod} />
            ) : null}
            <Button loading={loading} className="w-full gradient-brand text-white" onClick={() => void submit()}>
              {q.data?.soldOut ? "Join waitlist" : method === "BANK_TRANSFER" ? "Continue to bank transfer" : "Continue"}
            </Button>
          </>
        )}
      </section>
    </SiteLayout>
  );
}
