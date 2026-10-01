import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatusChip } from "@/components/app/StatusChip";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/members")({
  component: Page,
});

type MemberRow = {
  id: string;
  membershipNumber: string;
  status: string;
  organisationName?: string | null;
  directoryVisible: boolean;
  category: { name: string };
  user: { firstName: string; lastName: string; email: string; phone?: string | null };
};

function Page() {
  const { hasPermission } = useAuth();
  const can = hasPermission("membership.review");
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");

  const list = useQuery({
    queryKey: ["admin-members", submitted],
    queryFn: () =>
      apiGet<MemberRow[]>(`/admin/members${submitted ? `?q=${encodeURIComponent(submitted)}` : ""}`),
    enabled: can,
  });

  if (!can) return <p className="text-sm text-muted-foreground">You do not have permission to review members.</p>;
  if (list.isPending) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Members"
        subtitle="Search approved members. Super Admin / Admin can edit details; every change is audited."
      />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(q.trim());
        }}
      >
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Name, email, organisation or membership number"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit">Search</Button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {m.user.firstName} {m.user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.user.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{m.membershipNumber}</td>
                <td className="px-4 py-3">{m.category.name}</td>
                <td className="px-4 py-3">
                  <StatusChip tone={m.status === "ACTIVE" ? "success" : "warning"}>{m.status}</StatusChip>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/members/$id" params={{ id: m.id }}>
                      Edit
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(list.data ?? []).length === 0 && <p className="p-6 text-sm text-muted-foreground">No members match.</p>}
      </div>
    </div>
  );
}
