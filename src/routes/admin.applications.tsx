import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/applications")({
  component: Page,
});

function Page() {
  const q = useQuery({
    queryKey: ["admin-apps"],
    queryFn: () =>
      apiGet<
        {
          id: string;
          status: string;
          user: { firstName: string; lastName: string; email: string };
          category: { name: string };
          createdAt: string;
        }[]
      >("/admin/applications"),
  });

  if (q.isPending) return <Skeleton className="h-64" />;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[color:var(--muted)] text-left">
          <tr>
            <th className="p-3">Applicant</th>
            <th className="p-3">Category</th>
            <th className="p-3">Status</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((a) => (
            <tr key={a.id} className="border-t">
              <td className="p-3">
                {a.user.firstName} {a.user.lastName}
                <div className="text-xs text-[color:var(--muted-foreground)]">{a.user.email}</div>
              </td>
              <td className="p-3">{a.category.name}</td>
              <td className="p-3">{a.status}</td>
              <td className="p-3">
                <Link to="/admin/applications/$id" params={{ id: a.id }} className="font-semibold text-[color:var(--brand-green)]">
                  Review
                </Link>
              </td>
            </tr>
          ))}
          {(q.data ?? []).length === 0 && (
            <tr>
              <td className="p-6 text-[color:var(--muted-foreground)]" colSpan={4}>
                No applications yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
