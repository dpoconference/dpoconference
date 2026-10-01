import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/fees")({
  component: Page,
});

type FeeYear = {
  id: number;
  year: number;
  isCurrent: boolean;
  fees: { id: string; amountNgn: string; categoryId: string; category: { name: string } }[];
};

type Category = { id: string; name: string; slug: string };

function Page() {
  const q = useQuery({
    queryKey: ["admin-fees"],
    queryFn: () => apiGet<{ years: FeeYear[]; categories: Category[] }>("/admin/fees"),
  });
  const [year, setYear] = useState(2027);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [expiring, setExpiring] = useState(false);

  async function save() {
    const id = categoryId || q.data?.categories[0]?.id;
    if (!id || !amount) {
      notify.error("Select a category and enter an amount.");
      return;
    }
    setSaving(true);
    try {
      await apiPut("/admin/fees", { categoryId: id, year, amountNgn: Number(amount) });
      notify.success("Fee saved.");
      await q.refetch();
    } finally {
      setSaving(false);
    }
  }

  async function expire() {
    setExpiring(true);
    try {
      const data = await apiPost<{ expired: number }>("/admin/jobs/expire-memberships", {});
      notify.success(`Expiry job finished. ${data.expired} membership(s) marked expired.`);
    } finally {
      setExpiring(false);
    }
  }

  if (q.isPending) return <Skeleton className="h-64" />;
  const selected = categoryId || q.data?.categories[0]?.id || "";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold tracking-tight">Membership fees</h2>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Amounts are taken from this table at checkout. Create 2027 fees before members renew.
        </p>
        <div className="mt-4 grid sm:grid-cols-4 gap-3">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={selected}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {(q.data?.categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="rounded-md border px-3 py-2 text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <input
            type="number"
            placeholder="Amount (NGN)"
            className="rounded-md border px-3 py-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button loading={saving} className="gradient-brand text-white" onClick={() => void save()}>
            Save fee
          </Button>
        </div>
      </div>
      {(q.data?.years ?? []).map((y) => (
        <div key={y.id} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-bold">
            {y.year} {y.isCurrent ? "· current" : ""}
          </h3>
          <ul className="mt-3 space-y-1 text-sm">
            {y.fees.map((f) => (
              <li key={f.id} className="flex justify-between">
                <span>{f.category.name}</span>
                <span className="font-semibold">₦{Number(f.amountNgn).toLocaleString("en-NG")}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-bold">Run expiry job</h3>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Marks active memberships whose expiry date has passed as expired.
        </p>
        <Button className="mt-4" variant="outline" loading={expiring} onClick={() => void expire()}>
          Run expiry job
        </Button>
      </div>
    </div>
  );
}
