import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { apiGet } from "@/lib/api";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/payments/callback")({
  validateSearch: (s: Record<string, unknown>) => ({
    reference: typeof s.reference === "string" ? s.reference : typeof s.trxref === "string" ? s.trxref : "",
  }),
  component: Page,
});

function Page() {
  const { reference } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!reference) return;
    apiGet(`/payments/${reference}/verify`)
      .then(async () => {
        notify.success("Payment confirmed.");
        await navigate({ to: "/portal/events" });
      })
      .catch(() => notify.error("We could not confirm this payment."));
  }, [reference, navigate]);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl font-extrabold">Confirming payment…</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">Please wait.</p>
      </section>
    </SiteLayout>
  );
}
