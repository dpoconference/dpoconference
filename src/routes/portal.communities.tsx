import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { apiGet } from "@/lib/api";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portal/communities")({
  component: Page,
});

type Community = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  community?: { slug: string; name: string; description?: string | null };
};

function Page() {
  const q = useQuery({
    queryKey: ["portal-communities"],
    queryFn: () => apiGet<Community[]>("/portal/communities"),
  });

  if (q.isPending) return <PageSkeleton />;

  const rows = q.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="My communities"
        subtitle="Sector groups you have joined."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/communities">Browse all</Link>
          </Button>
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => {
          const c = row.community ?? row;
          return (
            <article key={row.id} className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">{c.name}</h3>
              {c.description ? <p className="mt-2 text-xs text-muted-foreground">{c.description}</p> : null}
            </article>
          );
        })}
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground md:col-span-2">
            You have not joined any communities yet.{" "}
            <Link to="/communities" className="font-medium text-[color:var(--brand-green)]">
              Explore communities
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
