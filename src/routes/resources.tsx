import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { FileText, Video, BookOpen, Download, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resource Centre | Data Protection Officers Conference" },
      { name: "description", content: "Regulatory updates, practice guides, templates, research and case studies for Data Protection Officers." },
      { property: "og:title", content: "Data Protection Officers Conference Resource Centre" },
      { property: "og:description", content: "A trusted knowledge base for privacy and data-governance professionals." },
    ],
  }),
  component: ResourcesPage,
});

type Resource = {
  id: string;
  title: string;
  category?: string | null;
  publishedOn?: string | null;
  locked?: boolean;
};

const groups = [
  { i: FileText, t: "Governance Resources", key: "governance" },
  { i: BookOpen, t: "Operational Resources", key: "operational" },
  { i: Download, t: "Technical Resources", key: "technical" },
  { i: Video, t: "Research and Publications", key: "research" },
];

function ResourcesPage() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const list = useQuery({
    queryKey: ["resources"],
    queryFn: () => apiGet<Resource[]>("/public/resources"),
  });

  const filtered = useMemo(() => {
    const needle = debounced.toLowerCase();
    return (list.data ?? []).filter((r) => {
      const okQ = !needle || r.title.toLowerCase().includes(needle) || (r.category ?? "").toLowerCase().includes(needle);
      const okF = !filter || (r.category ?? "").toLowerCase().includes(filter);
      return okQ && okF;
    });
  }, [list.data, debounced, filter]);

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Resources"
        eyebrow="Resource Centre"
        title="Professional Resource Centre"
        subtitle="The Data Protection Officers Conference Resource Centre provides practical materials that support effective privacy governance and compliance implementation. Selected resources may be publicly available, while full access is reserved for registered members."
      />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[color:var(--muted-foreground)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search regulations, guides, templates…"
            className="w-full rounded-2xl border-2 border-[color:var(--border)] pl-12 pr-4 py-4 text-base md:text-sm focus:outline-none focus:border-[color:var(--brand-emerald)]"
          />
        </div>
        <div className="mt-8 grid md:grid-cols-4 gap-4">
          {groups.map((c) => {
            const n = (list.data ?? []).filter((r) => (r.category ?? "").toLowerCase().includes(c.key)).length;
            return (
              <button
                type="button"
                key={c.t}
                onClick={() => setFilter(filter === c.key ? null : c.key)}
                className={`p-6 rounded-2xl border text-left bg-white hover:border-[color:var(--brand-emerald)] transition-colors ${
                  filter === c.key ? "border-[color:var(--brand-emerald)]" : "border-[color:var(--border)]"
                }`}
              >
                <c.i className="h-7 w-7 text-[color:var(--brand-green)]" />
                <p className="mt-3 font-bold text-[color:var(--brand-deep)]">{c.t}</p>
                <p className="text-xs text-[color:var(--muted-foreground)]">{n} resources</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)] mb-6">Latest resources</h2>
        {list.isPending && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <article key={p.id} className="p-6 rounded-2xl border border-[color:var(--border)] bg-white  transition-">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--brand-gold)]">{p.category ?? "Resource"}</span>
              <h3 className="mt-2 font-bold text-[color:var(--brand-deep)] leading-snug">{p.title}</h3>
              <p className="mt-3 text-xs text-[color:var(--muted-foreground)]">
                {p.publishedOn ? new Date(p.publishedOn).toLocaleDateString("en-NG", { month: "short", year: "numeric" }) : ""}
                {p.locked ? " · Members" : ""}
              </p>
            </article>
          ))}
        </div>
        {!list.isPending && filtered.length === 0 && (
          <p className="text-sm text-[color:var(--muted-foreground)]">No matching published resources yet.</p>
        )}
        <p className="mt-6 text-sm text-[color:var(--muted-foreground)]">
          Resources are provided for professional guidance and should be adapted to the specific legal, operational and
          regulatory circumstances of each organisation.
        </p>
        <p className="mt-8 text-sm">
          Looking for news updates?{" "}
          <Link to="/news" className="font-semibold text-[color:var(--brand-green)]">
            Open the newsroom
          </Link>
        </p>
      </section>
    </SiteLayout>
  );
}
