import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatusChip } from "@/components/app/StatusChip";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/awards")({
  component: Page,
});

const STATUSES = ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "SELECTED", "REJECTED"] as const;

type Nomination = {
  id: string;
  status: string;
  statement: string;
  adminNote?: string | null;
  nominee?: Record<string, unknown> | null;
  category?: { name: string; slug: string } | null;
  cycle?: { year?: number; name?: string } | null;
  createdAt: string;
};

function nomineeLabel(n?: Record<string, unknown> | null) {
  if (!n) return "Nominee";
  if (typeof n.name === "string" && n.name.trim()) return n.name;
  if (typeof n.fullName === "string" && n.fullName.trim()) return n.fullName;
  const composed = `${String(n.firstName ?? "")} ${String(n.lastName ?? "")}`.trim();
  return composed || "Nominee";
}

function Page() {
  const { hasPermission } = useAuth();
  const can = hasPermission("cms.manage");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const q = useQuery({
    queryKey: ["admin-award-nominations"],
    queryFn: () => apiGet<Nomination[]>("/admin/awards/nominations"),
    enabled: can,
  });

  if (!can) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You need cms.manage to review award nominations.
      </div>
    );
  }
  if (q.isPending) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader icon={Award} title="Awards" subtitle="Review nominations and update workflow status." />
      <div className="space-y-3">
        {(q.data ?? []).map((n) => (
          <article key={n.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{nomineeLabel(n.nominee)}</h3>
              <StatusChip tone="muted">{n.status}</StatusChip>
              {n.category && <span className="text-xs text-muted-foreground">{n.category.name}</span>}
            </div>
            <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{n.statement}</p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="text-xs font-semibold">
                Status
                <select
                  className="mt-1 block rounded-md border px-2 py-1.5 text-sm"
                  defaultValue={n.status}
                  id={`status-${n.id}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <input
                className="min-w-[12rem] flex-1 rounded-md border px-2 py-1.5 text-sm"
                placeholder="Admin note"
                value={notes[n.id] ?? n.adminNote ?? ""}
                onChange={(e) => setNotes({ ...notes, [n.id]: e.target.value })}
              />
              <Button
                size="sm"
                loading={busyId === n.id}
                onClick={async () => {
                  const el = document.getElementById(`status-${n.id}`) as HTMLSelectElement | null;
                  setBusyId(n.id);
                  try {
                    await apiPatch(`/admin/awards/nominations/${n.id}`, {
                      status: el?.value ?? n.status,
                      adminNote: notes[n.id] ?? n.adminNote ?? undefined,
                    });
                    notify.success("Nomination updated.");
                    await q.refetch();
                  } finally {
                    setBusyId(null);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </article>
        ))}
        {(q.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No nominations yet.</p>
        )}
      </div>
    </div>
  );
}
