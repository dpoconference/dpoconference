import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/legal")({
  component: Page,
});

type LegalPage = { slug: string; title: string; bodyMd: string };

function Page() {
  const { hasPermission } = useAuth();
  const can = hasPermission("cms.manage");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [loading, setLoading] = useState(false);

  const q = useQuery({
    queryKey: ["admin-legal"],
    queryFn: () => apiGet<LegalPage[]>("/admin/legal"),
    enabled: can,
  });

  useEffect(() => {
    if (!slug && (q.data?.length ?? 0) > 0) {
      const first = q.data![0];
      setSlug(first.slug);
      setTitle(first.title);
      setBodyMd(first.bodyMd);
    }
  }, [q.data, slug]);

  if (!can) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You need cms.manage to edit legal pages.
      </div>
    );
  }
  if (q.isPending) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader icon={ScrollText} title="Legal pages" subtitle="Edit Markdown legal copy stored in the database." />
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pages</p>
          <ul className="mt-3 space-y-1">
            {(q.data ?? []).map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                    slug === p.slug ? "bg-[color:var(--brand-tint)] font-semibold" : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    setSlug(p.slug);
                    setTitle(p.title);
                    setBodyMd(p.bodyMd);
                  }}
                >
                  {p.title}
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{p.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <form
          className="space-y-3 rounded-2xl border border-border bg-card p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!slug) return;
            setLoading(true);
            try {
              await apiPut(`/admin/legal/${slug}`, { title, bodyMd });
              notify.success("Legal page saved.");
              await q.refetch();
            } finally {
              setLoading(false);
            }
          }}
        >
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <p className="text-xs text-muted-foreground">Slug: {slug || "—"}</p>
          <textarea
            className="min-h-[28rem] w-full rounded-md border px-3 py-2 font-mono text-sm"
            required
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            placeholder="Markdown body"
          />
          <Button type="submit" loading={loading} disabled={!slug}>
            Save
          </Button>
        </form>
      </div>
    </div>
  );
}
