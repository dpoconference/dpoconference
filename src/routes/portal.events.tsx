import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portal/events")({
  component: Page,
});

function Page() {
  const q = useQuery({
    queryKey: ["my-events"],
    queryFn: () =>
      apiGet<{
        conference: { registrationNumber: string; status: string; conference: { title: string }; participantType: string }[];
        seminars: { registrationNumber: string; attendanceStatus: string; seminar: { title: string }; participantType: string }[];
      }>("/events/me"),
  });
  if (q.isPending) return <Skeleton className="h-40" />;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="My events" subtitle="Your conference and training registrations." />
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/portal/conference/register">Register for conference</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/portal/training">Browse training</Link>
          </Button>
        </div>
      </div>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-bold">Conference</h3>
        {(q.data?.conference ?? []).map((c) => (
          <p key={c.registrationNumber} className="mt-2 text-sm">
            {c.conference.title} · {c.registrationNumber} · {c.participantType} · {c.status}
          </p>
        ))}
        {(q.data?.conference ?? []).length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            No conference registration yet.{" "}
            <Link to="/portal/conference/register" className="font-semibold text-primary">
              Register now
            </Link>
          </p>
        )}
      </section>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-bold">Training</h3>
        {(q.data?.seminars ?? []).map((s) => (
          <p key={s.registrationNumber} className="mt-2 text-sm">
            {s.seminar.title} · {s.registrationNumber} · {s.participantType} · {s.attendanceStatus}
          </p>
        ))}
        {(q.data?.seminars ?? []).length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            No seminar registration yet.{" "}
            <Link to="/portal/training" className="font-semibold text-primary">
              Browse training
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
