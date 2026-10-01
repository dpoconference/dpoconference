import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/cpd")({
  component: Page,
});

function Page() {
  const { hasPermission } = useAuth();
  const q = useQuery({
    queryKey: ["admin-cpd"],
    queryFn: () =>
      apiGet<{ id: string; title: string; status: string; requestedPoints: string; user: { email: string; firstName: string; lastName: string } }[]>(
        "/admin/cpd?status=PENDING",
      ),
  });
  if (q.isPending) return <Skeleton className="h-40" />;
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold tracking-tight">Pending CPD</h2>
      {(q.data ?? []).map((c) => (
        <div key={c.id} className="mt-4 flex flex-wrap justify-between gap-2 border-t pt-3 text-sm">
          <div>
            {c.title} · {c.user.firstName} {c.user.lastName} · {c.requestedPoints} pts
          </div>
          {hasPermission("membership.approve") && (
            <Button
              size="sm"
              onClick={() =>
                void apiPost(`/admin/cpd/${c.id}/decide`, { status: "APPROVED" }).then(() => {
                  notify.success("CPD approved.");
                  void q.refetch();
                })
              }
            >
              Approve
            </Button>
          )}
        </div>
      ))}
      {(q.data ?? []).length === 0 && <p className="mt-3 text-sm">No pending external CPD.</p>}
    </div>
  );
}
