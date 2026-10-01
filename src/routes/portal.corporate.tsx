import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/portal/corporate")({
  component: Page,
});

function Page() {
  const q = useQuery({
    queryKey: ["corp"],
    queryFn: () =>
      apiGet<{
        organisation: { name: string };
        staff: { id: string; email: string; firstName: string; lastName: string }[];
        cpd: { userId: string; points: string; title: string }[];
      } | null>("/portal/corporate"),
  });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "" });
  if (q.isPending) return <Skeleton className="h-40" />;
  if (!q.data) return <p>Corporate seats appear after a corporate membership is approved.</p>;
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold tracking-tight">{q.data.organisation.name}</h2>
        <ul className="mt-4 text-sm space-y-1">
          {q.data.staff.map((s) => (
            <li key={s.id}>
              {s.firstName} {s.lastName} · {s.email}
            </li>
          ))}
        </ul>
      </div>
      <form
        className="rounded-2xl border border-border bg-card p-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await apiPost("/portal/corporate/seats", form);
            notify.success("Staff seat invited.");
            await q.refetch();
          } finally {
            setLoading(false);
          }
        }}
      >
        <h3 className="font-bold">Invite staff</h3>
        <input className="w-full rounded-md border px-3 py-2" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full rounded-md border px-3 py-2" required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input className="w-full rounded-md border px-3 py-2" required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <Button type="submit" loading={loading} className="gradient-brand text-white">
          Invite
        </Button>
      </form>
    </div>
  );
}
