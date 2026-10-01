import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { RichMediaFields } from "@/components/app/RichMediaFields";
import { apiUpload } from "@/lib/upload";

export const Route = createFileRoute("/admin/cms")({
  component: Page,
});

type Tab = "news" | "resources" | "threats" | "landing";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function Page() {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState<Tab>("news");
  const can = hasPermission("cms.manage");
  const pdfRef = useRef<HTMLInputElement>(null);

  const news = useQuery({
    queryKey: ["admin-news"],
    queryFn: () =>
      apiGet<
        {
          id: string;
          title: string;
          slug: string;
          category: string;
          isPublished: boolean;
          isArchived?: boolean;
          excerpt: string;
          bodyMd: string;
          bodyHtml?: string;
          coverUrl?: string | null;
        }[]
      >("/admin/news"),
    enabled: can,
  });
  const resources = useQuery({
    queryKey: ["admin-resources"],
    queryFn: () =>
      apiGet<
        {
          id: string;
          title: string;
          slug: string;
          category: string;
          type: string;
          isPublished: boolean;
          isArchived?: boolean;
          summary: string;
          bodyMd: string;
          bodyHtml?: string;
          accessLevel: string;
          fileUrl?: string | null;
          coverUrl?: string | null;
        }[]
      >("/admin/resources"),
    enabled: can,
  });
  const threats = useQuery({
    queryKey: ["admin-threats"],
    queryFn: () =>
      apiGet<
        {
          id: string;
          title: string;
          severity: string;
          summary: string;
          bodyMd: string;
          iocMd: string;
          accessLevel: string;
          isPublished: boolean;
          isArchived?: boolean;
        }[]
      >("/admin/threats"),
    enabled: can,
  });

  const [loading, setLoading] = useState(false);
  const [newsForm, setNewsForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    bodyMd: "",
    bodyHtml: "",
    coverUrl: "",
    category: "Announcements",
    isPublished: true,
  });
  const [resourceForm, setResourceForm] = useState({
    title: "",
    slug: "",
    summary: "",
    category: "Guides",
    type: "Guide",
    accessLevel: "PUBLIC",
    bodyMd: "",
    bodyHtml: "",
    fileUrl: "",
    coverUrl: "",
    isPublished: true,
  });
  const [threatForm, setThreatForm] = useState({
    id: "",
    title: "",
    severity: "MEDIUM",
    summary: "",
    bodyMd: "",
    iocMd: "",
    accessLevel: "PROFESSIONAL",
    isPublished: true,
  });

  if (!can) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You need cms.manage permission to edit content.
      </div>
    );
  }

  if (tab !== "landing" && (news.isPending || resources.isPending || threats.isPending)) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Content" subtitle="Publish news, resources, threat alerts and landing page copy." />
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["news", "News"],
            ["resources", "Resources"],
            ["threats", "Threats"],
            ["landing", "Landing"],
          ] as const
        ).map(([id, label]) => (
          <Button key={id} size="sm" variant={tab === id ? "default" : "outline"} onClick={() => setTab(id as Tab)}>
            {label}
          </Button>
        ))}
      </div>

      {tab === "news" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            className="space-y-3 rounded-2xl border border-border bg-card p-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const slug = newsForm.slug || slugify(newsForm.title);
                const bodyMd = newsForm.bodyMd || newsForm.bodyHtml.replace(/<[^>]+>/g, " ").trim();
                await apiPost("/admin/news", { ...newsForm, slug, bodyMd });
                notify.success("News saved.");
                setNewsForm({
                  title: "",
                  slug: "",
                  excerpt: "",
                  bodyMd: "",
                  bodyHtml: "",
                  coverUrl: "",
                  category: "Announcements",
                  isPublished: true,
                });
                await news.refetch();
              } finally {
                setLoading(false);
              }
            }}
          >
            <h3 className="font-semibold">Create / update news</h3>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              placeholder="Title"
              value={newsForm.title}
              onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value, slug: newsForm.slug || slugify(e.target.value) })}
            />
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              placeholder="slug"
              value={newsForm.slug}
              onChange={(e) => setNewsForm({ ...newsForm, slug: e.target.value })}
            />
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Category"
              value={newsForm.category}
              onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
            />
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Excerpt"
              value={newsForm.excerpt}
              onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
            />
            <RichMediaFields
              folder="ndpo/news"
              coverUrl={newsForm.coverUrl}
              bodyHtml={newsForm.bodyHtml}
              onCoverChange={(coverUrl) => setNewsForm({ ...newsForm, coverUrl })}
              onBodyChange={(bodyHtml) => setNewsForm({ ...newsForm, bodyHtml })}
            />
            <textarea
              className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Plain-text fallback (optional)"
              value={newsForm.bodyMd}
              onChange={(e) => setNewsForm({ ...newsForm, bodyMd: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newsForm.isPublished} onChange={(e) => setNewsForm({ ...newsForm, isPublished: e.target.checked })} />
              Published
            </label>
            <Button type="submit" loading={loading}>
              Save news
            </Button>
          </form>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold">Existing</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {(news.data ?? []).map((n) => (
                <li key={n.id} className="border-t pt-3">
                  <button
                    type="button"
                    className="text-left font-medium text-[color:var(--brand-green)]"
                    onClick={() =>
                      setNewsForm({
                        title: n.title,
                        slug: n.slug,
                        excerpt: n.excerpt,
                        bodyMd: n.bodyMd,
                        bodyHtml: n.bodyHtml ?? "",
                        coverUrl: n.coverUrl ?? "",
                        category: n.category,
                        isPublished: n.isPublished,
                      })
                    }
                  >
                    {n.title}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {n.slug} · {n.isArchived ? "Archived" : n.isPublished ? "Published" : "Draft"}
                  </p>
                  {!n.isArchived ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() =>
                        void apiPatch(`/admin/news/${n.id}/archive`)
                          .then(() => {
                            notify.success("News archived.");
                            return news.refetch();
                          })
                          .catch((err) => notify.error(err instanceof Error ? err.message : "Archive failed."))
                      }
                    >
                      Archive
                    </Button>
                  ) : null}
                </li>
              ))}
              {(news.data ?? []).length === 0 && <p className="text-muted-foreground">No news yet.</p>}
            </ul>
          </div>
        </div>
      )}

      {tab === "resources" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            className="space-y-3 rounded-2xl border border-border bg-card p-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const slug = resourceForm.slug || slugify(resourceForm.title);
                await apiPost("/admin/resources", {
                  ...resourceForm,
                  slug,
                  fileUrl: resourceForm.fileUrl || undefined,
                  coverUrl: resourceForm.coverUrl || undefined,
                });
                notify.success("Resource saved.");
                setResourceForm({
                  title: "",
                  slug: "",
                  summary: "",
                  category: "Guides",
                  type: "Guide",
                  accessLevel: "PUBLIC",
                  bodyMd: "",
                  bodyHtml: "",
                  fileUrl: "",
                  coverUrl: "",
                  isPublished: true,
                });
                await resources.refetch();
              } finally {
                setLoading(false);
              }
            }}
          >
            <h3 className="font-semibold">Create / update resource</h3>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              placeholder="Title"
              value={resourceForm.title}
              onChange={(e) =>
                setResourceForm({ ...resourceForm, title: e.target.value, slug: resourceForm.slug || slugify(e.target.value) })
              }
            />
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              placeholder="slug"
              value={resourceForm.slug}
              onChange={(e) => setResourceForm({ ...resourceForm, slug: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="Category"
                value={resourceForm.category}
                onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
              />
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="Type"
                value={resourceForm.type}
                onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
              />
            </div>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={resourceForm.accessLevel}
              onChange={(e) => setResourceForm({ ...resourceForm, accessLevel: e.target.value })}
            >
              {["PUBLIC", "MEMBER", "PROFESSIONAL", "FELLOW"].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Summary"
              value={resourceForm.summary}
              onChange={(e) => setResourceForm({ ...resourceForm, summary: e.target.value })}
            />
            <RichMediaFields
              folder="ndpo/resources"
              coverUrl={resourceForm.coverUrl}
              bodyHtml={resourceForm.bodyHtml}
              onCoverChange={(coverUrl) => setResourceForm({ ...resourceForm, coverUrl })}
              onBodyChange={(bodyHtml) => setResourceForm({ ...resourceForm, bodyHtml })}
            />
            <div className="space-y-2">
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Attachment URL (PDF)"
                value={resourceForm.fileUrl}
                onChange={(e) => setResourceForm({ ...resourceForm, fileUrl: e.target.value })}
              />
              <input
                ref={pdfRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const up = await apiUpload(file, "ndpo/resources");
                    setResourceForm((f) => ({ ...f, fileUrl: up.url }));
                    notify.success("File uploaded.");
                  } catch (err) {
                    notify.error(err instanceof Error ? err.message : "Upload failed.");
                  }
                }}
              />
              <Button type="button" size="sm" variant="outline" onClick={() => pdfRef.current?.click()}>
                Upload PDF / image
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={resourceForm.isPublished}
                onChange={(e) => setResourceForm({ ...resourceForm, isPublished: e.target.checked })}
              />
              Published
            </label>
            <Button type="submit" loading={loading}>
              Save resource
            </Button>
          </form>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold">Existing</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {(resources.data ?? []).map((r) => (
                <li key={r.id} className="border-t pt-3">
                  <button
                    type="button"
                    className="text-left font-medium text-[color:var(--brand-green)]"
                    onClick={() =>
                      setResourceForm({
                        title: r.title,
                        slug: r.slug,
                        summary: r.summary,
                        category: r.category,
                        type: r.type,
                        accessLevel: r.accessLevel,
                        bodyMd: r.bodyMd,
                        bodyHtml: r.bodyHtml ?? "",
                        fileUrl: r.fileUrl ?? "",
                        coverUrl: r.coverUrl ?? "",
                        isPublished: r.isPublished,
                      })
                    }
                  >
                    {r.title}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {r.slug} · {r.isArchived ? "Archived" : r.isPublished ? "Published" : "Draft"}
                  </p>
                  {!r.isArchived ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() =>
                        void apiPatch(`/admin/resources/${r.id}/archive`)
                          .then(() => {
                            notify.success("Resource archived.");
                            return resources.refetch();
                          })
                          .catch((err) => notify.error(err instanceof Error ? err.message : "Archive failed."))
                      }
                    >
                      Archive
                    </Button>
                  ) : null}
                </li>
              ))}
              {(resources.data ?? []).length === 0 && <p className="text-muted-foreground">No resources yet.</p>}
            </ul>
          </div>
        </div>
      )}

      {tab === "threats" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            className="space-y-3 rounded-2xl border border-border bg-card p-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                await apiPost("/admin/threats", {
                  ...threatForm,
                  id: threatForm.id || undefined,
                });
                notify.success("Threat alert saved.");
                setThreatForm({
                  id: "",
                  title: "",
                  severity: "MEDIUM",
                  summary: "",
                  bodyMd: "",
                  iocMd: "",
                  accessLevel: "PROFESSIONAL",
                  isPublished: true,
                });
                await threats.refetch();
              } finally {
                setLoading(false);
              }
            }}
          >
            <h3 className="font-semibold">Create / update threat</h3>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              placeholder="Title"
              value={threatForm.title}
              onChange={(e) => setThreatForm({ ...threatForm, title: e.target.value })}
            />
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={threatForm.severity}
              onChange={(e) => setThreatForm({ ...threatForm, severity: e.target.value })}
            >
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              placeholder="Summary"
              value={threatForm.summary}
              onChange={(e) => setThreatForm({ ...threatForm, summary: e.target.value })}
            />
            <textarea
              className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Body"
              value={threatForm.bodyMd}
              onChange={(e) => setThreatForm({ ...threatForm, bodyMd: e.target.value })}
            />
            <textarea
              className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="IOC details"
              value={threatForm.iocMd}
              onChange={(e) => setThreatForm({ ...threatForm, iocMd: e.target.value })}
            />
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={threatForm.accessLevel}
              onChange={(e) => setThreatForm({ ...threatForm, accessLevel: e.target.value })}
            >
              {["PROFESSIONAL", "FELLOW", "ALL_MEMBERS"].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={threatForm.isPublished} onChange={(e) => setThreatForm({ ...threatForm, isPublished: e.target.checked })} />
              Published
            </label>
            <Button type="submit" loading={loading}>
              Save threat
            </Button>
          </form>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold">Existing</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {(threats.data ?? []).map((t) => (
                <li key={t.id} className="border-t pt-3">
                  <button
                    type="button"
                    className="text-left font-medium text-[color:var(--brand-green)]"
                    onClick={() =>
                      setThreatForm({
                        id: t.id,
                        title: t.title,
                        severity: t.severity,
                        summary: t.summary,
                        bodyMd: t.bodyMd,
                        iocMd: t.iocMd,
                        accessLevel: t.accessLevel,
                        isPublished: t.isPublished,
                      })
                    }
                  >
                    {t.title}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    {t.severity} · {t.isArchived ? "Archived" : t.isPublished ? "Published" : "Draft"}
                  </p>
                  {!t.isArchived ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() =>
                        void apiPatch(`/admin/threats/${t.id}/archive`)
                          .then(() => {
                            notify.success("Threat archived.");
                            return threats.refetch();
                          })
                          .catch((err) => notify.error(err instanceof Error ? err.message : "Archive failed."))
                      }
                    >
                      Archive
                    </Button>
                  ) : null}
                </li>
              ))}
              {(threats.data ?? []).length === 0 && <p className="text-muted-foreground">No threats yet.</p>}
            </ul>
          </div>
        </div>
      )}

      {tab === "landing" ? <LandingPagesEditor /> : null}
    </div>
  );
}

function LandingPagesEditor() {
  const pages = useQuery({
    queryKey: ["admin-cms-pages"],
    queryFn: () =>
      apiGet<{ id: string; slug: string; title: string; published: boolean; _count: { sections: number } }[]>("/admin/cms/pages"),
  });
  const [slug, setSlug] = useState("home");
  const detail = useQuery({
    queryKey: ["admin-cms-page", slug],
    queryFn: () =>
      apiGet<{
        slug: string;
        title: string;
        published: boolean;
        sections: { key: string; sortOrder: number; visible: boolean; content: Record<string, unknown> }[];
      }>(`/admin/cms/pages/${slug}`),
    enabled: Boolean(slug),
  });
  const [title, setTitle] = useState("");
  const [published, setPublished] = useState(true);
  const [sectionsJson, setSectionsJson] = useState("[]");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!detail.data) return;
    setTitle(detail.data.title);
    setPublished(detail.data.published);
    setSectionsJson(JSON.stringify(detail.data.sections, null, 2));
  }, [detail.data]);

  async function save() {
    setSaving(true);
    try {
      const sections = JSON.parse(sectionsJson) as Array<{
        key: string;
        sortOrder?: number;
        visible?: boolean;
        content: Record<string, unknown>;
      }>;
      await apiPut(`/admin/cms/pages/${slug}`, { title, published, sections });
      notify.success("Landing page saved.");
      await pages.refetch();
      await detail.refetch();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Save failed. Check JSON.");
    } finally {
      setSaving(false);
    }
  }

  if (pages.isPending) return <Skeleton className="h-64" />;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pages</p>
        {(pages.data ?? []).map((p) => (
          <button
            key={p.slug}
            type="button"
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${slug === p.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => setSlug(p.slug)}
          >
            <span className="font-semibold">{p.title}</span>
            <span className="mt-0.5 block text-xs opacity-80">{p.slug}</span>
          </button>
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        {detail.isPending ? (
          <Skeleton className="h-40" />
        ) : (
          <>
            <label className="block text-xs font-semibold">
              Title
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
              Published
            </label>
            <label className="block text-xs font-semibold">
              Sections JSON
              <textarea
                className="mt-1 min-h-[320px] w-full rounded-md border px-3 py-2 font-mono text-xs"
                value={sectionsJson}
                onChange={(e) => setSectionsJson(e.target.value)}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Edit section content objects (headline, subhead, ctaLabel, ctaHref, etc.). Public pages fall back to built-in copy if a
              section is missing.
            </p>
            <Button loading={saving} onClick={() => void save()}>
              Save landing page
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
