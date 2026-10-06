import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Filter } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatusChip } from "@/components/app/StatusChip";
import { formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/portal/payments")({
  component: Page,
});

type PaymentRow = {
  id: string;
  purpose: string;
  method?: string;
  status: string;
  amountNgn: number;
  currency: string;
  paystackReference: string;
  paidAt?: string | null;
  createdAt: string;
  receiptUrl?: string | null;
  reviewNote?: string | null;
};

function Page() {
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (purpose) p.set("purpose", purpose);
    if (status) p.set("status", status);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("limit", "50");
    return p.toString();
  }, [purpose, status, from, to]);

  const q = useQuery({
    queryKey: ["my-payments", qs],
    queryFn: () => apiGet<PaymentRow[]>(`/payments/me?${qs}`),
  });

  if (q.isPending) return <PageSkeleton />;

  async function uploadReceipt(paymentId: string, file: File | undefined) {
    if (!file) return;
    setUploadingId(paymentId);
    try {
      const body = new FormData();
      body.append("file", file);
      await apiPost(`/payments/${paymentId}/receipt`, body);
      notify.success("Receipt uploaded. Awaiting confirmation.");
      await q.refetch();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CreditCard}
        title="Payments"
        subtitle="Your Paystack and bank-transfer payments for membership, renewal and events."
      />

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-primary" /> Filters
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold">
            Reason
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="MEMBERSHIP_APPLICATION">Membership application</option>
              <option value="MEMBERSHIP_RENEWAL">Membership renewal</option>
              <option value="CONFERENCE">Conference</option>
              <option value="SEMINAR">Seminar</option>
              <option value="COURSE">Course</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="AWAITING_REVIEW">Awaiting review</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => {
            setPurpose("");
            setStatus("");
            setFrom("");
            setTo("");
          }}
        >
          Clear filters
        </Button>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">Method</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Reference</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No payments match these filters.
                </td>
              </tr>
            ) : (
              (q.data ?? []).map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(p.paidAt ?? p.createdAt).toLocaleString("en-NG")}
                  </td>
                  <td className="px-4 py-3">{p.purpose.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 text-xs">
                    {(p.method ?? "PAYSTACK").replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatNaira(p.amountNgn)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.paystackReference}</td>
                  <td className="px-4 py-3">
                    <StatusChip
                      tone={
                        p.status === "SUCCESSFUL"
                          ? "success"
                          : p.status === "FAILED" || p.status === "CANCELLED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {p.status}
                    </StatusChip>
                    {p.reviewNote ? (
                      <p className="mt-1 max-w-[12rem] text-xs text-muted-foreground">
                        {p.reviewNote}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {p.method === "BANK_TRANSFER" &&
                    (p.status === "PENDING" || p.status === "AWAITING_REVIEW") ? (
                      <label className="inline-flex cursor-pointer flex-col gap-1 text-xs font-semibold text-[color:var(--brand-green)]">
                        {uploadingId === p.id
                          ? "Uploading…"
                          : p.receiptUrl
                            ? "Replace receipt"
                            : "Upload receipt"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          className="hidden"
                          disabled={uploadingId === p.id}
                          onChange={(e) => void uploadReceipt(p.id, e.target.files?.[0])}
                        />
                      </label>
                    ) : p.receiptUrl ? (
                      <a
                        href={p.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[color:var(--brand-green)]"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
