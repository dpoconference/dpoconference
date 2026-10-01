import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api";
import { apiUpload } from "@/lib/upload";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/members_/$id")({
  component: Page,
});

type Member = {
  id: string;
  membershipNumber: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "PENDING";
  organisationName?: string | null;
  directoryVisible: boolean;
  category: { name: string };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
};

function Page() {
  const { id } = Route.useParams();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("membership.approve");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    organisationName: "",
    avatarUrl: "",
    status: "ACTIVE" as Member["status"],
    directoryVisible: false,
  });

  const q = useQuery({
    queryKey: ["admin-member", id],
    queryFn: () => apiGet<Member>(`/admin/members/${id}`),
  });

  useEffect(() => {
    if (!q.data) return;
    setForm({
      firstName: q.data.user.firstName,
      lastName: q.data.user.lastName,
      phone: q.data.user.phone ?? "",
      organisationName: q.data.organisationName ?? "",
      avatarUrl: q.data.user.avatarUrl ?? "",
      status: q.data.status,
      directoryVisible: q.data.directoryVisible,
    });
  }, [q.data]);

  if (q.isPending) return <PageSkeleton />;
  if (!q.data) return <p className="text-sm text-muted-foreground">Member not found.</p>;

  async function save() {
    setSaving(true);
    try {
      await apiPatch(`/admin/members/${id}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        organisationName: form.organisationName || null,
        avatarUrl: form.avatarUrl || null,
        status: form.status,
        directoryVisible: form.directoryVisible,
      });
      notify.success("Member updated. The change is in the audit log.");
      await q.refetch();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${q.data.user.firstName} ${q.data.user.lastName}`}
        subtitle={`${q.data.membershipNumber} · ${q.data.category.name} · ${q.data.user.email}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/members">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />
      {!canEdit && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          You can view this member. Only Super Admin / Admin can save edits.
        </p>
      )}
      <form
        className="max-w-xl space-y-3 rounded-2xl border border-border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (canEdit) void save();
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded-md border px-3 py-2 text-sm"
            required
            disabled={!canEdit}
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            required
            disabled={!canEdit}
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          disabled={!canEdit}
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          disabled={!canEdit}
          placeholder="Organisation"
          value={form.organisationName}
          onChange={(e) => setForm({ ...form, organisationName: e.target.value })}
        />
        <div className="space-y-2">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
          ) : null}
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            disabled={!canEdit}
            placeholder="Photo URL"
            value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
          />
          {canEdit ? (
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void apiUpload(file, "ndpo/members")
                  .then((up) => {
                    setForm((f) => ({ ...f, avatarUrl: up.url }));
                    notify.success("Photo uploaded. Save to apply and audit.");
                  })
                  .catch((err) => notify.error(err instanceof Error ? err.message : "Upload failed."));
              }}
            />
          ) : null}
        </div>
        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          disabled={!canEdit}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as Member["status"] })}
        >
          {["ACTIVE", "EXPIRED", "SUSPENDED", "PENDING"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={!canEdit}
            checked={form.directoryVisible}
            onChange={(e) => setForm({ ...form, directoryVisible: e.target.checked })}
          />
          Listed in public directory
        </label>
        {canEdit && (
          <Button type="submit" loading={saving}>
            Save and audit
          </Button>
        )}
      </form>
    </div>
  );
}
