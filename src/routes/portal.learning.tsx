import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/portal/learning")({
  component: Page,
});

function Page() {
  const q = useQuery({
    queryKey: ["my-events"],
    queryFn: () =>
      apiGet<{
        seminars: {
          registrationNumber: string;
          attendanceStatus: string;
          seminar: {
            title: string;
            materials: { id: string; title: string; url: string; accessLevel: string }[];
          };
        }[];
      }>("/events/me"),
  });
  if (q.isPending) return <Skeleton className="h-40" />;
  return (
    <div className="space-y-6">
      <PageHeader
        title="My learning"
        subtitle="Seminar enrolment materials from courses you registered for. The member Library (view-only LMS) is separate."
      />
      <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Looking for Secretariat learning packs? Open the{" "}
        <Link to="/portal/library" className="font-semibold text-[color:var(--brand-green)]">
          Library
        </Link>{" "}
        — those assets are view-only and are not downloadable.
      </p>
      <div className="space-y-4">
        {(q.data?.seminars ?? []).map((s) => (
          <div key={s.registrationNumber} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold tracking-tight">{s.seminar.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {s.attendanceStatus} · {s.registrationNumber}
            </p>
            {(s.seminar.materials ?? []).length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm">
                {s.seminar.materials.map((m) => (
                  <li key={m.id}>
                    <a href={m.url} target="_blank" rel="noreferrer" className="font-medium text-[color:var(--brand-green)] underline-offset-2 hover:underline">
                      {m.title}
                    </a>
                    <span className="text-xs text-muted-foreground"> · seminar material · {m.accessLevel}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No seminar materials attached yet.</p>
            )}
          </div>
        ))}
        {(q.data?.seminars ?? []).length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm">
            No enrolments yet.{" "}
            <Link to="/portal/training" className="font-semibold text-[color:var(--brand-green)]">
              Browse training
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
