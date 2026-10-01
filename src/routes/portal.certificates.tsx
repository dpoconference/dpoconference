import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiBlob, apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/portal/certificates")({
  component: Page,
});

function Page() {
  const q = useQuery({
    queryKey: ["certs"],
    queryFn: () =>
      apiGet<{ id: string; type: string; title: string; number: string; issuedOn: string }[]>("/portal/certificates"),
  });
  if (q.isPending) return <Skeleton className="h-32" />;
  return (
    <div className="space-y-6">
      <PageHeader title="Certificates" subtitle="Download certificates after attendance is marked for conferences and training." />
      <div className="rounded-2xl border border-border bg-card p-6">
        {(q.data ?? []).map((c) => (
          <div key={c.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm first:mt-0 first:border-t-0 first:pt-0">
            <p>
              {c.type}: {c.title} · {c.number}
            </p>
            <Button size="sm" variant="outline" onClick={() => void apiBlob(`/portal/certificates/${c.id}.pdf`, `ndpo-${c.number}.pdf`)}>
              Download PDF
            </Button>
          </div>
        ))}
        {(q.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Certificates appear after attendance is marked.</p>}
      </div>
    </div>
  );
}
