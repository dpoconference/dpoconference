import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Handshake } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatusChip } from "@/components/app/StatusChip";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portal/mentorship")({
  component: Page,
});

type Profile = {
  id: string;
  kind: string;
  area: string;
  status: string;
  bio: string;
  goals?: string;
};

type Party = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  kind?: string;
};

type MatchRow = {
  id: string;
  status?: string;
  mentor: Party;
  mentee: Party;
  adminNote?: string | null;
  sessions?: { id: string; scheduledAt: string; notes?: string | null }[];
};

type MentorshipMe = {
  profiles: Profile[];
  matches: MatchRow[];
};

function partyLabel(p: Party) {
  const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return name || p.id.slice(0, 8);
}

function Page() {
  const q = useQuery({
    queryKey: ["portal-mentorship-me"],
    queryFn: () => apiGet<MentorshipMe>("/portal/mentorship/me"),
  });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    kind: "MENTEE",
    area: "",
    sector: "",
    experienceLevel: "",
    capacity: "1",
    schedule: "",
    bio: "",
    goals: "",
  });

  if (q.isPending) return <PageSkeleton />;

  const profiles = q.data?.profiles ?? [];
  const matches = q.data?.matches ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Handshake}
        title="Mentorship"
        subtitle="Your mentor/mentee profiles, matches, and scheduled sessions."
      />

      {profiles.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Your profiles</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {profiles.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip tone="muted">{p.kind}</StatusChip>
                  <StatusChip tone={p.status === "ACTIVE" || p.status === "APPROVED" ? "success" : "warning"}>
                    {p.status}
                  </StatusChip>
                </div>
                <p className="mt-2 text-sm font-medium">{p.area}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.bio}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {matches.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Matches & sessions</h2>
          <div className="space-y-3">
            {matches.map((m) => (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">
                    {partyLabel(m.mentor)} ↔ {partyLabel(m.mentee)}
                  </p>
                  {m.status ? <StatusChip tone="muted">{m.status}</StatusChip> : null}
                </div>
                {m.adminNote ? <p className="mt-1 text-xs text-muted-foreground">{m.adminNote}</p> : null}
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {(m.sessions ?? []).map((s) => (
                    <li key={s.id}>
                      Session · {new Date(s.scheduledAt).toLocaleString("en-NG")}
                      {s.notes ? ` — ${s.notes}` : ""}
                    </li>
                  ))}
                  {(m.sessions ?? []).length === 0 && <li>No sessions scheduled yet.</li>}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {profiles.length === 0 && (
        <form
          className="max-w-xl space-y-3 rounded-2xl border border-border bg-card p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              await apiPost("/portal/mentorship", {
                kind: form.kind,
                area: form.area,
                sector: form.sector || undefined,
                experienceLevel: form.experienceLevel || undefined,
                capacity: form.kind === "MENTOR" ? Number(form.capacity) || 1 : undefined,
                schedule: form.schedule || undefined,
                bio: form.bio,
                goals: form.goals || "",
              });
              notify.success("Mentorship application submitted.");
              await q.refetch();
            } finally {
              setLoading(false);
            }
          }}
        >
          <h3 className="font-semibold">Apply for mentorship</h3>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
          >
            <option value="MENTEE">Mentee</option>
            <option value="MENTOR">Mentor</option>
          </select>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
            placeholder="Focus area"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
          />
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Sector (optional)"
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
          />
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Experience level (optional)"
            value={form.experienceLevel}
            onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
          />
          {form.kind === "MENTOR" && (
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              type="number"
              min={1}
              placeholder="Capacity"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          )}
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Preferred schedule (optional)"
            value={form.schedule}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
          />
          <textarea
            className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
            required
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <textarea
            className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Goals (optional)"
            value={form.goals}
            onChange={(e) => setForm({ ...form, goals: e.target.value })}
          />
          <Button type="submit" loading={loading}>
            Submit application
          </Button>
        </form>
      )}
    </div>
  );
}
