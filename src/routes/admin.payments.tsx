import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Filter, Settings2, Wallet } from "lucide-react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatCard } from "@/components/app/StatCard";
import { StatusChip } from "@/components/app/StatusChip";
import { formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/admin/payments")({
  component: Page,
});

type AdminPayment = {
  id: string;
  purpose: string;
  method: string;
  status: string;
  amountNgn: number;
  paystackReference: string;
  paidAt?: string | null;
  createdAt: string;
  receiptUrl?: string | null;
  reviewNote?: string | null;
  user: { id: string; email: string; firstName: string; lastName: string } | null;
};

type PaymentsConfig = {
  paystackEnabled: boolean;
  bankTransferEnabled: boolean;
  defaultMethod: "PAYSTACK" | "BANK_TRANSFER";
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    instructions: string;
  };
  receiptRequired: boolean;
  allowedReceiptMime: string[];
};

async function fetchPayments(qs: string) {
  const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
  const { getAccessToken } = await import("@/lib/api");
  const headers = new Headers({ Accept: "application/json" });
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE}/admin/payments?${qs}`, { headers, credentials: "include" });
  const json = (await res.json()) as {
    success: boolean;
    data: AdminPayment[];
    meta: { page: number; limit: number; total: number; awaitingReview?: number };
    summary?: { status: string; count: number; sumNgn: number }[];
  };
  if (!res.ok || !json.success) throw new Error("Failed to load payments");
  return { items: json.data, meta: json.meta, summary: json.summary ?? [] };
}

function Page() {
  const { hasPermission } = useAuth();
  const canRefund = hasPermission("payments.refund");
  const canSettings = hasPermission("settings.manage");
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [qtext, setQtext] = useState("");
  const [refundTarget, setRefundTarget] = useState<AdminPayment | null>(null);
  const [refundAmountNgn, setRefundAmountNgn] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<AdminPayment | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [cfgDraft, setCfgDraft] = useState<PaymentsConfig | null>(null);
  const [savingCfg, setSavingCfg] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (purpose) p.set("purpose", purpose);
    if (status) p.set("status", status);
    if (method) p.set("method", method);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (qtext.trim()) p.set("q", qtext.trim());
    p.set("limit", "50");
    return p.toString();
  }, [purpose, status, method, from, to, qtext]);

  const q = useQuery({
    queryKey: ["admin-payments", qs],
    queryFn: () => fetchPayments(qs),
  });

  const cfgQ = useQuery({
    queryKey: ["admin-payments-config"],
    enabled: canSettings,
    queryFn: async () => {
      const data = await apiGet<PaymentsConfig>("/admin/settings/payments");
      setCfgDraft(data);
      return data;
    },
  });

  if (q.isPending) return <PageSkeleton />;
  const summary = q.data?.summary ?? [];
  const successful = summary.find((s) => s.status === "SUCCESSFUL");
  const awaiting = q.data?.meta.awaitingReview ?? summary.find((s) => s.status === "AWAITING_REVIEW")?.count ?? 0;

  async function submitRefund() {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      const body: { amountKobo?: number } = {};
      const trimmed = refundAmountNgn.trim();
      if (trimmed) {
        const ngn = Number(trimmed);
        if (!Number.isFinite(ngn) || ngn <= 0) {
          notify.error("Enter a valid refund amount in naira, or leave blank for full refund.");
          return;
        }
        if (ngn > Number(refundTarget.amountNgn)) {
          notify.error("Refund amount cannot exceed the original payment.");
          return;
        }
        body.amountKobo = Math.round(ngn * 100);
      }
      await apiPost(`/admin/payments/${refundTarget.id}/refund`, body);
      notify.success("Refund submitted to Paystack.");
      setRefundTarget(null);
      setRefundAmountNgn("");
      await q.refetch();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Refund failed.");
    } finally {
      setRefunding(false);
    }
  }

  async function approveOffline(p: AdminPayment) {
    setActingId(p.id);
    try {
      await apiPost(`/admin/payments/${p.id}/confirm-offline`);
      notify.success("Bank transfer confirmed. Access and emails issued.");
      await q.refetch();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Confirm failed.");
    } finally {
      setActingId(null);
    }
  }

  async function rejectOffline() {
    if (!rejectTarget) return;
    if (rejectNote.trim().length < 3) {
      notify.error("Add a short note for the payer.");
      return;
    }
    setActingId(rejectTarget.id);
    try {
      await apiPost(`/admin/payments/${rejectTarget.id}/reject-offline`, { note: rejectNote.trim() });
      notify.success("Transfer rejected. Payer emailed.");
      setRejectTarget(null);
      setRejectNote("");
      await q.refetch();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Reject failed.");
    } finally {
      setActingId(null);
    }
  }

  async function saveConfig() {
    if (!cfgDraft) return;
    setSavingCfg(true);
    try {
      const saved = await apiPut<PaymentsConfig>("/admin/settings/payments", cfgDraft);
      setCfgDraft(saved);
      notify.success("Payment settings saved.");
      await cfgQ.refetch();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSavingCfg(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wallet}
        title="Payments"
        subtitle="Monitor Paystack and bank-transfer payments. Confirm offline receipts to grant access."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Matching rows" value={q.data?.meta.total ?? 0} icon={CreditCard} />
        <StatCard label="Awaiting review" value={awaiting} icon={CreditCard} well="warning" />
        <StatCard label="Successful volume" value={formatNaira(successful?.sumNgn ?? 0)} icon={Wallet} well="gold" />
        <StatCard label="Successful count" value={successful?.count ?? 0} icon={CreditCard} well="success" />
      </div>

      {canSettings && cfgDraft ? (
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="h-4 w-4 text-primary" /> Payment methods & bank account
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={cfgDraft.paystackEnabled}
                onChange={(e) => setCfgDraft({ ...cfgDraft, paystackEnabled: e.target.checked })}
              />
              Paystack enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={cfgDraft.bankTransferEnabled}
                onChange={(e) => setCfgDraft({ ...cfgDraft, bankTransferEnabled: e.target.checked })}
              />
              Bank transfer enabled
            </label>
            <label className="text-xs font-semibold">
              Default method
              <select
                value={cfgDraft.defaultMethod}
                onChange={(e) =>
                  setCfgDraft({ ...cfgDraft, defaultMethod: e.target.value as PaymentsConfig["defaultMethod"] })
                }
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="PAYSTACK">Paystack</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
              </select>
            </label>
            <label className="text-xs font-semibold">
              Bank name
              <input
                value={cfgDraft.bank.bankName}
                onChange={(e) => setCfgDraft({ ...cfgDraft, bank: { ...cfgDraft.bank, bankName: e.target.value } })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold">
              Account name
              <input
                value={cfgDraft.bank.accountName}
                onChange={(e) => setCfgDraft({ ...cfgDraft, bank: { ...cfgDraft.bank, accountName: e.target.value } })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold">
              Account number
              <input
                value={cfgDraft.bank.accountNumber}
                onChange={(e) =>
                  setCfgDraft({ ...cfgDraft, bank: { ...cfgDraft.bank, accountNumber: e.target.value } })
                }
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold sm:col-span-2 lg:col-span-3">
              Instructions shown to payers
              <textarea
                value={cfgDraft.bank.instructions}
                onChange={(e) =>
                  setCfgDraft({ ...cfgDraft, bank: { ...cfgDraft.bank, instructions: e.target.value } })
                }
                rows={3}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </label>
          </div>
          <Button className="mt-3" loading={savingCfg} onClick={() => void saveConfig()}>
            Save payment settings
          </Button>
        </section>
      ) : null}

      {refundTarget && canRefund ? (
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold">Confirm refund</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Refund {formatNaira(refundTarget.amountNgn)} for {refundTarget.user?.email ?? "payer"} (
            {refundTarget.paystackReference}). Leave amount blank for a full refund.
          </p>
          <label className="mt-3 block text-xs font-semibold">
            Amount (NGN, optional)
            <input
              type="number"
              min="0"
              step="0.01"
              value={refundAmountNgn}
              onChange={(e) => setRefundAmountNgn(e.target.value)}
              placeholder={String(refundTarget.amountNgn)}
              className="mt-1 w-full max-w-xs rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button loading={refunding} onClick={() => void submitRefund()}>
              Confirm refund
            </Button>
            <Button
              variant="outline"
              disabled={refunding}
              onClick={() => {
                setRefundTarget(null);
                setRefundAmountNgn("");
              }}
            >
              Cancel
            </Button>
          </div>
        </section>
      ) : null}

      {rejectTarget && canRefund ? (
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold">Reject bank transfer</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {rejectTarget.paystackReference} · {formatNaira(rejectTarget.amountNgn)}
          </p>
          <label className="mt-3 block text-xs font-semibold">
            Note to payer
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Receipt unclear / wrong amount / …"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button loading={actingId === rejectTarget.id} onClick={() => void rejectOffline()}>
              Reject & email payer
            </Button>
            <Button
              variant="outline"
              disabled={!!actingId}
              onClick={() => {
                setRejectTarget(null);
                setRejectNote("");
              }}
            >
              Cancel
            </Button>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-primary" /> Filters
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="text-xs font-semibold lg:col-span-1">
            Search
            <input
              value={qtext}
              onChange={(e) => setQtext(e.target.value)}
              placeholder="Email or reference"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold">
            Reason
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="MEMBERSHIP_APPLICATION">Membership application</option>
              <option value="MEMBERSHIP_RENEWAL">Membership renewal</option>
              <option value="CONFERENCE">Conference</option>
              <option value="SEMINAR">Seminar</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Method
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="PAYSTACK">Paystack</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="AWAITING_REVIEW">Awaiting review</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus("AWAITING_REVIEW");
              setMethod("BANK_TRANSFER");
            }}
          >
            Queue: awaiting review
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPurpose("");
              setStatus("");
              setMethod("");
              setFrom("");
              setTo("");
              setQtext("");
            }}
          >
            Clear filters
          </Button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Payer</th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">Method</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Reference</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              {canRefund ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {(q.data?.items ?? []).length === 0 ? (
              <tr>
                <td colSpan={canRefund ? 8 : 7} className="px-4 py-10 text-center text-muted-foreground">
                  No payments match these filters.
                </td>
              </tr>
            ) : (
              (q.data?.items ?? []).map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(p.paidAt ?? p.createdAt).toLocaleString("en-NG")}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.user ? `${p.user.firstName} ${p.user.lastName}` : "—"}</p>
                    <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">{p.purpose.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 text-xs font-medium">{p.method.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 font-medium">{formatNaira(p.amountNgn)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.paystackReference}</td>
                  <td className="px-4 py-3">
                    <StatusChip
                      tone={
                        p.status === "SUCCESSFUL"
                          ? "success"
                          : p.status === "FAILED" || p.status === "CANCELLED"
                            ? "danger"
                            : p.status === "REFUNDED"
                              ? "muted"
                              : "warning"
                      }
                    >
                      {p.status}
                    </StatusChip>
                    {p.reviewNote ? <p className="mt-1 max-w-[14rem] text-xs text-muted-foreground">{p.reviewNote}</p> : null}
                  </td>
                  {canRefund ? (
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        {p.receiptUrl ? (
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-[color:var(--brand-green)] hover:underline"
                          >
                            View receipt
                          </a>
                        ) : null}
                        {p.method === "BANK_TRANSFER" && p.status === "AWAITING_REVIEW" ? (
                          <>
                            <Button size="sm" loading={actingId === p.id} onClick={() => void approveOffline(p)}>
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!!actingId}
                              onClick={() => {
                                setRejectTarget(p);
                                setRejectNote("");
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        ) : null}
                        {p.method === "PAYSTACK" && p.status === "SUCCESSFUL" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRefundTarget(p);
                              setRefundAmountNgn("");
                            }}
                          >
                            Refund
                          </Button>
                        ) : null}
                        {!p.receiptUrl && !(p.method === "PAYSTACK" && p.status === "SUCCESSFUL") && p.status !== "AWAITING_REVIEW" ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
