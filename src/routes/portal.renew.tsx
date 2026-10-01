import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { apiGet } from "@/lib/api";
import { loadPaymentsConfig, startCheckout } from "@/lib/checkout";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { PageHeader } from "@/components/app/PageHeader";
import { formatNaira } from "@/lib/format";
import { BankTransferCheckout, type BankTransferSession } from "@/components/payments/BankTransferCheckout";
import {
  PaymentMethodStep,
  resolveDefaultMethod,
  type PaymentMethodChoice,
} from "@/components/payments/PaymentMethodStep";

export const Route = createFileRoute("/portal/renew")({
  component: Page,
});

function Page() {
  const mem = useQuery({
    queryKey: ["my-membership"],
    queryFn: () => apiGet<{ membershipYear: number; category: { name: string }; status: string } | null>("/membership/me"),
  });
  const preview = useQuery({
    queryKey: ["renewal-preview"],
    queryFn: () =>
      apiGet<{ currentYear: number; nextYear: number; category: string; amountNgn: number }>("/membership/renewal"),
    enabled: Boolean(mem.data),
    retry: false,
  });
  const payCfg = useQuery({ queryKey: ["payments-config"], queryFn: () => loadPaymentsConfig() });
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<PaymentMethodChoice>("PAYSTACK");
  const [bankSession, setBankSession] = useState<BankTransferSession | null>(null);

  useEffect(() => {
    if (payCfg.data) setMethod(resolveDefaultMethod(payCfg.data));
  }, [payCfg.data]);

  async function renew() {
    setLoading(true);
    try {
      const data = await startCheckout({ purpose: "MEMBERSHIP_RENEWAL", method });
      if (data.mode === "bank") {
        setBankSession(data.session);
        notify.success("Complete bank transfer and upload your receipt.");
        return;
      }
      if (data.verified) {
        notify.success("Payment confirmed.");
        await mem.refetch();
      } else if (data.cancelled) {
        notify.error("Payment was cancelled.");
      }
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Renewal failed.");
    } finally {
      setLoading(false);
    }
  }

  if (mem.isPending) return <PageSkeleton />;
  if (!mem.data) {
    return (
      <div className="space-y-6">
        <PageHeader icon={RefreshCw} title="Renew" subtitle="Renewal is available after your membership is approved." />
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
          You need an approved membership before you can renew.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={RefreshCw}
        title="Renew membership"
        subtitle="Pay the next membership year fee to keep your card and benefits active."
      />
      <div className="max-w-xl rounded-2xl border border-border bg-card p-6 sm:p-8">
        {bankSession ? (
          <BankTransferCheckout
            session={bankSession}
            onSubmitted={() => notify.success("Receipt submitted. Membership renews after confirmation.")}
          />
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{mem.data.category.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Current year {mem.data.membershipYear} · {mem.data.status}
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount due</p>
              <p className="mt-1 text-2xl font-bold text-[color:var(--brand-deep)]">
                {preview.data ? formatNaira(preview.data.amountNgn) : "Loaded at checkout"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {preview.data
                  ? `Renew for membership year ${preview.data.nextYear}.`
                  : "The next year fee is taken from the administration fee schedule."}
              </p>
            </div>
            {payCfg.data ? (
              <div className="mt-4">
                <PaymentMethodStep config={payCfg.data} value={method} onChange={setMethod} />
              </div>
            ) : null}
            <Button
              className="mt-6 w-full gradient-brand text-white"
              loading={loading}
              loadingText="Starting checkout…"
              onClick={() => void renew()}
            >
              {method === "BANK_TRANSFER" ? "Continue to bank transfer" : "Pay renewal fee with Paystack"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
