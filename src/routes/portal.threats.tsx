import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { apiGet } from "@/lib/api";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatusChip } from "@/components/app/StatusChip";

export const Route = createFileRoute("/portal/threats")({
  component: Page,
});

type ThreatItem = {
  id: string;
  title: string;
  severity: string;
  summary: string;
  bodyMd?: string;
  iocMd?: string;
  iocHidden?: boolean;
  publishedOn?: string;
};

function severityTone(severity: string): "success" | "warning" | "danger" | "neutral" {
  if (severity === "LOW") return "success";
  if (severity === "MEDIUM") return "warning";
  if (severity === "HIGH" || severity === "CRITICAL") return "danger";
  return "neutral";
}

function Page() {
  const q = useQuery({
    queryKey: ["portal-threats"],
    queryFn: () =>
      apiGet<{ notice: string | null; items: ThreatItem[] }>("/portal/threats"),
  });

  if (q.isPending) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldAlert}
        title="Threat intelligence"
        subtitle="Defensive alerts and advisories for your membership tier."
      />

      {q.data?.notice ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {q.data.notice}
        </p>
      ) : null}

      <div className="space-y-4">
        {(q.data?.items ?? []).map((t) => (
          <article key={t.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip tone={severityTone(t.severity)}>{t.severity}</StatusChip>
              {t.publishedOn ? (
                <span className="text-xs text-muted-foreground">
                  {new Date(t.publishedOn).toLocaleDateString("en-NG")}
                </span>
              ) : null}
            </div>
            <h3 className="mt-3 text-base font-semibold">{t.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t.summary}</p>
            {t.bodyMd ? <pre className="mt-3 whitespace-pre-wrap text-sm">{t.bodyMd}</pre> : null}
            {t.iocHidden ? (
              <p className="mt-3 text-xs text-muted-foreground">Indicators of compromise are hidden for your tier.</p>
            ) : t.iocMd ? (
              <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs">{t.iocMd}</pre>
            ) : null}
          </article>
        ))}
        {(q.data?.items ?? []).length === 0 && (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No published threat alerts for your access level.
          </p>
        )}
      </div>
    </div>
  );
}
