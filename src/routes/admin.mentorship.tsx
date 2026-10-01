import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusChip } from "@/components/app/StatusChip";

export const Route = createFileRoute("/admin/mentorship")({
  component: Page,
});

type Profile = {
  id: string;
  kind: string;
  area: string;
  status: string;
  bio: string;
  user: { firstName: string; lastName: string; email: string };
};

type MatchParty = { id: string; firstName: string; lastName: string; email: string };

type MatchRow = {
  id: string;
  status: string;
  adminNote?: string | null;
  mentor: MatchParty;
  mentee: MatchParty;
  sessions: { id: string; scheduledAt: string; notes?: string | null }[];
};

type AdminMentorship = {
  profiles: Profile[];
  matches: MatchRow[];
};

function Page() {
  const { hasPermission } = useAuth();
  const canReview = hasPermission("membership.review");
  const canMatch = hasPermission("membership.approve");
  const q = useQuery({
    queryKey: ["admin-mentorship"],
    queryFn: () => apiGet<AdminMentorship>("/admin/mentorship"),
    enabled: canReview,
  });
  const [mentorId, setMentorId] = useState("");
  const [menteeId, setMenteeId] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionMatchId, setSessionMatchId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionLoading, setSessionLoading] = useState(false);

  if (!canReview) {
    return <p className="text-sm text-muted-foreground">You need membership.review to view mentorship applications.</p>;
  }
  if (q.isPending) return <Skeleton className="h-40" />;

  const profiles = q.data?.profiles ?? [];
  const matches = q.data?.matches ?? [];
  const mentors = profiles.filter((p) => p.kind === "MENTOR");
  const mentees = profiles.filter((p) => p.kind === "MENTEE");

  return (
    <div className="space-y-6">
      <PageHeader title="Mentorship" subtitle="Review mentor and mentee applications, create matches, and schedule sessions." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Mentors</h3>
          {mentors.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`mt-3 block w-full rounded-lg border px-3 py-2 text-left text-sm ${mentorId === p.id ? "border-[color:var(--brand-green)] bg-[color:var(--brand-tint)]" : ""}`}
              onClick={() => setMentorId(p.id)}
            >
              <span className="font-medium">
                {p.user.firstName} {p.user.lastName}
              </span>
              <span className="text-muted-foreground"> · {p.area}</span>
              <p className="mt-1 text-xs text-muted-foreground">{p.user.email}</p>
            </button>
          ))}
          {mentors.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No mentor applications.</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Mentees</h3>
          {mentees.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`mt-3 block w-full rounded-lg border px-3 py-2 text-left text-sm ${menteeId === p.id ? "border-[color:var(--brand-green)] bg-[color:var(--brand-tint)]" : ""}`}
              onClick={() => setMenteeId(p.id)}
            >
              <span className="font-medium">
                {p.user.firstName} {p.user.lastName}
              </span>
              <span className="text-muted-foreground"> · {p.area}</span>
              <p className="mt-1 text-xs text-muted-foreground">{p.user.email}</p>
            </button>
          ))}
          {mentees.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No mentee applications.</p>}
        </div>
      </div>
      {canMatch && (
        <form
          className="space-y-3 rounded-2xl border border-border bg-card p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!mentorId || !menteeId) {
              notify.error("Select both a mentor and a mentee.");
              return;
            }
            setLoading(true);
            try {
              const created = await apiPost<{ id: string }>("/admin/mentorship/match", {
                mentorId,
                menteeId,
                adminNote: adminNote || undefined,
              });
              notify.success("Match created.");
              setAdminNote("");
              if (created?.id) setSessionMatchId(created.id);
              await q.refetch();
            } finally {
              setLoading(false);
            }
          }}
        >
          <h3 className="font-semibold">Create match</h3>
          <p className="text-sm text-muted-foreground">
            Mentor: {mentorId || "—"} · Mentee: {menteeId || "—"}
          </p>
          <textarea
            className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Admin note (optional)"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
          <Button type="submit" loading={loading}>
            Match
          </Button>
        </form>
      )}

      {matches.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Matches</h3>
          <ul className="space-y-2 text-sm">
            {matches.map((m) => (
              <li key={m.id} className="rounded-lg border border-border px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {m.mentor.firstName} {m.mentor.lastName} ↔ {m.mentee.firstName} {m.mentee.lastName}
                  </span>
                  <StatusChip tone="muted">{m.status}</StatusChip>
                  {canMatch && (
                    <Button type="button" size="sm" variant="outline" className="ml-auto" onClick={() => setSessionMatchId(m.id)}>
                      Schedule
                    </Button>
                  )}
                </div>
                {(m.sessions ?? []).length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {m.sessions.map((s) => (
                      <li key={s.id}>
                        {new Date(s.scheduledAt).toLocaleString("en-NG")}
                        {s.notes ? ` — ${s.notes}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {canMatch && (
        <form
          className="space-y-3 rounded-2xl border border-border bg-card p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!sessionMatchId || !scheduledAt) {
              notify.error("Select a match and session time.");
              return;
            }
            setSessionLoading(true);
            try {
              const iso = new Date(scheduledAt).toISOString();
              await apiPost("/admin/mentorship/sessions", {
                matchId: sessionMatchId,
                scheduledAt: iso,
                notes: sessionNotes || undefined,
              });
              notify.success("Session scheduled.");
              setSessionNotes("");
              setScheduledAt("");
              await q.refetch();
            } finally {
              setSessionLoading(false);
            }
          }}
        >
          <h3 className="font-semibold">Schedule session</h3>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={sessionMatchId}
            onChange={(e) => setSessionMatchId(e.target.value)}
            required
          >
            <option value="">Select match</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.mentor.firstName} {m.mentor.lastName} ↔ {m.mentee.firstName} {m.mentee.lastName}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <textarea
            className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Session notes (optional)"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
          />
          <Button type="submit" loading={sessionLoading} disabled={matches.length === 0}>
            Create session
          </Button>
        </form>
      )}
    </div>
  );
}
