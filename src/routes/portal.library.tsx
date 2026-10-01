import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { apiGet } from "@/lib/api";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatusChip } from "@/components/app/StatusChip";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portal/library")({
  component: Page,
});

type LibraryAsset = {
  id: string;
  title: string;
  summary?: string | null;
  coverUrl?: string | null;
  audience?: string;
  kind?: string;
  percent?: number;
  completedAt?: string | null;
};

type LibraryResource = {
  id: string;
  title: string;
  summary?: string | null;
  coverUrl?: string | null;
  accessLevel?: string;
  kind?: string;
};

function Page() {
  const q = useQuery({
    queryKey: ["portal-library"],
    queryFn: () =>
      apiGet<{ assets: LibraryAsset[]; resources: LibraryResource[] }>("/portal/library"),
  });

  if (q.isPending) return <PageSkeleton />;

  const assets = q.data?.assets ?? [];
  const resources = q.data?.resources ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Library"
        subtitle="View-only learning materials for your membership. Downloading is not enabled."
      />

      {assets.length === 0 && resources.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No library items are available for your membership yet.
        </div>
      ) : null}

      {assets.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((a) => (
            <article key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              {a.coverUrl ? (
                <img src={a.coverUrl} alt="" className="h-36 w-full object-cover" />
              ) : (
                <div className="flex h-36 items-center justify-center bg-[color:var(--brand-tint)]/50">
                  <BookOpen className="h-8 w-8 text-[color:var(--brand-deep)]" />
                </div>
              )}
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{a.title}</h3>
                  {a.audience && <StatusChip tone="muted">{a.audience}</StatusChip>}
                  <StatusChip tone={a.completedAt || (a.percent ?? 0) >= 100 ? "success" : "muted"}>
                    {a.percent ?? 0}%
                  </StatusChip>
                </div>
                {a.summary ? <p className="line-clamp-3 text-xs text-muted-foreground">{a.summary}</p> : null}
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/portal/library/$id" params={{ id: a.id }}>
                    Read
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}

      {resources.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Member resources</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {resources.map((r) => (
              <article key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{r.title}</h3>
                  {r.accessLevel && <StatusChip tone="muted">{r.accessLevel}</StatusChip>}
                </div>
                {r.summary ? <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{r.summary}</p> : null}
                <p className="mt-3 text-xs text-muted-foreground">Viewing only — downloading is not enabled.</p>
                <Button asChild size="sm" className="mt-3 rounded-full">
                  <Link to="/portal/library/resource/$id" params={{ id: r.id }}>
                    Read
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
