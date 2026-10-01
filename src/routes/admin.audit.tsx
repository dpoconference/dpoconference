import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/PageHeader";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  component: Page,
});

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  createdAt: string;
  ip?: string | null;
  before?: unknown;
  after?: unknown;
  actor?: { email: string; firstName?: string; lastName?: string };
};

function Page() {
  const q = useQuery({
    queryKey: ["audit"],
    queryFn: () => apiGet<AuditRow[]>("/admin/audit"),
  });
  if (q.isPending) return <Skeleton className="h-40" />;
  return (
    <div className="space-y-4">
      <PageHeader
        icon={ScrollText}
        title="Audit log"
        subtitle="Every Super Admin / Admin member edit is recorded as membership.member_updated with before and after values."
      />
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[color:var(--muted)] text-left">
              <th className="p-3">When</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Change</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((a) => (
              <tr key={a.id} className="border-t align-top">
                <td className="p-3 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="p-3">{a.actor?.email ?? "system"}</td>
                <td className="p-3 font-medium">{a.action}</td>
                <td className="p-3">
                  {a.entity}
                  {a.entityId ? <span className="block font-mono text-[10px] text-muted-foreground">{a.entityId}</span> : null}
                </td>
                <td className="p-3">
                  {a.before || a.after ? (
                    <pre className="max-h-32 max-w-md overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground">
                      {JSON.stringify({ before: a.before, after: a.after }, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
