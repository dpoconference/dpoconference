import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { apiGet } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/portal/training/")({
  component: Page,
});

type Seminar = {
  slug: string;
  title: string;
  coverUrl?: string | null;
  startsOn: string;
  format?: string | null;
  cpdPoints?: number | null;
  nonMemberPrice: number;
  soldOut?: boolean;
  registrationOpen?: boolean;
  registrationClosed?: boolean;
};

function Page() {
  const q = useQuery({
    queryKey: ["portal-seminars"],
    queryFn: () => apiGet<Seminar[]>("/public/seminars"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training catalogue"
        subtitle="Browse and enrol in continuing-learning seminars."
      />
      {q.isPending && <Skeleton className="h-48" />}
      <div className="divide-y overflow-hidden rounded-2xl border border-border bg-card">
        {(q.data ?? []).map((u) => (
          <div
            key={u.slug}
            className="grid grid-cols-1 items-center gap-4 p-5 md:grid-cols-[96px_1fr_auto_auto]"
          >
            <div className="h-20 w-full overflow-hidden rounded-xl bg-muted md:h-16 md:w-24">
              {u.coverUrl ? <img src={u.coverUrl} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div>
              <h3 className="font-semibold">{u.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {u.nonMemberPrice === 0 ? "Free" : formatNaira(u.nonMemberPrice)}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                {new Date(u.startsOn).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                {u.cpdPoints ? ` · ${u.cpdPoints} CPD` : ""}
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">{u.format ?? "Training"}</span>
            {u.registrationClosed ? (
              <span className="text-sm text-muted-foreground">Closed</span>
            ) : (
              <Link
                to="/portal/training/$slug"
                params={{ slug: u.slug }}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                {u.soldOut || u.registrationOpen === false ? "Waitlist" : "Enrol"}
              </Link>
            )}
          </div>
        ))}
        {!q.isPending && (q.data ?? []).length === 0 && (
          <p className="p-8 text-sm text-muted-foreground">No published seminars yet.</p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Already enrolled?{" "}
        <Link to="/portal/learning" className="font-semibold text-primary">
          Open my learning
        </Link>
      </p>
    </div>
  );
}
