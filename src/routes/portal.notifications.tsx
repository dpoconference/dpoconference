import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/portal/notifications")({
  component: Page,
});

function Page() {
  const q = useQuery({
    queryKey: ["notes"],
    queryFn: () => apiGet<{ id: string; title: string; body: string; readAt: string | null }[]>("/portal/notifications"),
  });
  if (q.isPending) return <Skeleton className="h-32" />;
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Notifications</h2>
      {(q.data ?? []).map((n) => (
        <button
          key={n.id}
          className="w-full text-left rounded-2xl border border-border bg-card p-4"
          onClick={() => void apiPost(`/portal/notifications/${n.id}/read`, {}).then(() => q.refetch())}
        >
          <p className="font-bold">{n.title}</p>
          <p className="text-sm">{n.body}</p>
        </button>
      ))}
      {(q.data ?? []).length === 0 && <p className="text-sm">No notifications yet.</p>}
    </div>
  );
}
