import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic2 } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatusChip } from "@/components/app/StatusChip";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/speakers")({
  component: Page,
});

type Speaker = {
  id: string;
  status: string;
  fullName?: string;
  name?: string;
  email?: string;
  organisation?: string;
  topic?: string;
  bio?: string;
  createdAt?: string;
};

type Sponsor = {
  id: string;
  status: string;
  organisation?: string;
  contactName?: string;
  contact?: string;
  email?: string;
  packageInterest?: string;
  message?: string;
  createdAt?: string;
};

const SPEAKER_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED"] as const;
const SPONSOR_STATUSES = ["NEW", "REVIEWED", "ACCEPTED", "REJECTED"] as const;

function Page() {
  const { hasPermission } = useAuth();
  const can = hasPermission("cms.manage");
  const [tab, setTab] = useState<"speakers" | "sponsors">("speakers");
  const [busyId, setBusyId] = useState<string | null>(null);

  const speakers = useQuery({
    queryKey: ["admin-speakers"],
    queryFn: () => apiGet<Speaker[]>("/admin/speakers"),
    enabled: can,
  });
  const sponsors = useQuery({
    queryKey: ["admin-sponsors"],
    queryFn: () => apiGet<Sponsor[]>("/admin/sponsors"),
    enabled: can,
  });

  if (!can) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You need cms.manage to review speakers and sponsors.
      </div>
    );
  }
  if (speakers.isPending || sponsors.isPending) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Mic2}
        title="Speakers & sponsors"
        subtitle="Review speaker applications and sponsorship leads."
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={tab === "speakers" ? "default" : "outline"} onClick={() => setTab("speakers")}>
          Speakers
        </Button>
        <Button size="sm" variant={tab === "sponsors" ? "default" : "outline"} onClick={() => setTab("sponsors")}>
          Sponsors
        </Button>
      </div>

      {tab === "speakers" && (
        <div className="space-y-3">
          {(speakers.data ?? []).map((s) => (
            <article key={s.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{s.fullName ?? s.name ?? "Speaker"}</h3>
                <StatusChip tone="muted">{s.status}</StatusChip>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.email}
                {s.organisation ? ` · ${s.organisation}` : ""}
                {s.topic ? ` · ${s.topic}` : ""}
              </p>
              {s.bio ? <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{s.bio}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  className="rounded-md border px-2 py-1.5 text-sm"
                  defaultValue={s.status}
                  id={`sp-${s.id}`}
                >
                  {SPEAKER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  loading={busyId === s.id}
                  onClick={async () => {
                    const el = document.getElementById(`sp-${s.id}`) as HTMLSelectElement | null;
                    setBusyId(s.id);
                    try {
                      await apiPatch(`/admin/speakers/${s.id}`, { status: el?.value ?? s.status });
                      notify.success("Speaker updated.");
                      await speakers.refetch();
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
          {(speakers.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No speaker applications.</p>
          )}
        </div>
      )}

      {tab === "sponsors" && (
        <div className="space-y-3">
          {(sponsors.data ?? []).map((s) => (
            <article key={s.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{s.organisation ?? "Sponsor"}</h3>
                <StatusChip tone="muted">{s.status}</StatusChip>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.contactName ?? s.contact}
                {s.email ? ` · ${s.email}` : ""}
                {s.packageInterest ? ` · ${s.packageInterest}` : ""}
              </p>
              {s.message ? <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{s.message}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  className="rounded-md border px-2 py-1.5 text-sm"
                  defaultValue={s.status}
                  id={`sponsor-${s.id}`}
                >
                  {SPONSOR_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  loading={busyId === s.id}
                  onClick={async () => {
                    const el = document.getElementById(`sponsor-${s.id}`) as HTMLSelectElement | null;
                    setBusyId(s.id);
                    try {
                      await apiPatch(`/admin/sponsors/${s.id}`, { status: el?.value ?? s.status });
                      notify.success("Sponsor updated.");
                      await sponsors.refetch();
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
          {(sponsors.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No sponsorship leads.</p>
          )}
        </div>
      )}
    </div>
  );
}
