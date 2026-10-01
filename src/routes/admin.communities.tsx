import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/communities")({
  component: Page,
});

type Community = {
  id: string;
  slug: string;
  name: string;
  description: string;
  focusAreas?: string[] | null;
  isPublished: boolean;
  _count?: { members: number };
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const empty = {
  slug: "",
  name: "",
  description: "",
  focusAreas: "",
  isPublished: true,
};

function Page() {
  const { hasPermission } = useAuth();
  const can = hasPermission("cms.manage");
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin-communities"],
    queryFn: () => apiGet<Community[]>("/admin/communities"),
    enabled: can,
  });

  if (!can) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You need cms.manage to manage communities.
      </div>
    );
  }
  if (q.isPending) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader icon={Users} title="Communities" subtitle="Create and publish sector communities for members." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-3 rounded-2xl border border-border bg-card p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const focusAreas = form.focusAreas
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              await apiPost("/admin/communities", {
                slug: form.slug || slugify(form.name),
                name: form.name,
                description: form.description,
                focusAreas: focusAreas.length ? focusAreas : null,
                isPublished: form.isPublished,
              });
              notify.success("Community saved.");
              setForm(empty);
              await q.refetch();
            } catch (err) {
              notify.error(err instanceof Error ? err.message : "Could not save community.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <h3 className="font-semibold">Create / update</h3>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })}
          />
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
            placeholder="slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <textarea
            className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Focus areas (comma-separated)"
            value={form.focusAreas}
            onChange={(e) => setForm({ ...form, focusAreas: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            Published
          </label>
          <Button type="submit" loading={loading}>
            Save community
          </Button>
        </form>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">Existing</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {(q.data ?? []).map((c) => (
              <li key={c.id} className="border-t pt-3">
                <button
                  type="button"
                  className="text-left font-medium text-[color:var(--brand-green)]"
                  onClick={() =>
                    setForm({
                      slug: c.slug,
                      name: c.name,
                      description: c.description ?? "",
                      focusAreas: Array.isArray(c.focusAreas) ? c.focusAreas.join(", ") : "",
                      isPublished: c.isPublished,
                    })
                  }
                >
                  {c.name}
                </button>
                <p className="text-xs text-muted-foreground">
                  {c.slug} · {c.isPublished ? "Published" : "Draft"} · {c._count?.members ?? 0} members
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={busyId === c.id}
                    onClick={() => {
                      setBusyId(c.id);
                      void apiPatch(`/admin/communities/${c.id}`, { isPublished: !c.isPublished })
                        .then(() => {
                          notify.success(c.isPublished ? "Community unpublished." : "Community published.");
                          return q.refetch();
                        })
                        .catch((err) => notify.error(err instanceof Error ? err.message : "Update failed."))
                        .finally(() => setBusyId(null));
                    }}
                  >
                    {c.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  {c.isPublished ? (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busyId === `a-${c.id}`}
                      onClick={() => {
                        setBusyId(`a-${c.id}`);
                        void apiPatch(`/admin/communities/${c.id}`, { archive: true })
                          .then(() => {
                            notify.success("Community archived.");
                            return q.refetch();
                          })
                          .catch((err) => notify.error(err instanceof Error ? err.message : "Archive failed."))
                          .finally(() => setBusyId(null));
                      }}
                    >
                      Archive
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
            {(q.data ?? []).length === 0 && <p className="text-muted-foreground">No communities yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
