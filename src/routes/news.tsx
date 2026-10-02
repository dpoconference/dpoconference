import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { apiGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "News | Data Protection Officers Conference" }] }),
  component: Page,
});

function Page() {
  const q = useQuery({
    queryKey: ["news"],
    queryFn: () =>
      apiGet<{ slug: string; title: string; excerpt: string; publishedOn: string; coverUrl?: string | null }[]>(
        "/public/news",
      ),
  });
  return (
    <SiteLayout>
      <PageHero
        title="News, Regulatory Intelligence and Professional Updates"
        subtitle="Stay informed about developments affecting data protection, privacy, cybersecurity, artificial intelligence governance and digital trust."
      />
      <section className="mx-auto max-w-3xl px-6 pt-8 text-sm text-[color:var(--muted-foreground)]">
        Content may include Data Protection Officers Conference announcements, regulatory developments, NDP Act implementation updates, guidance and
        directives, enforcement trends, conference information, training announcements, international privacy developments,
        research publications, career opportunities and member achievements.
      </section>
      <section className="mx-auto max-w-3xl space-y-4 px-6 py-16">
        {q.isPending && <Skeleton className="h-40" />}
        {(q.data ?? []).map((n) => (
          <Link key={n.slug} to="/news/$slug" params={{ slug: n.slug }} className="block overflow-hidden rounded-2xl border bg-white">
            {n.coverUrl ? <img src={n.coverUrl} alt="" className="h-40 w-full object-cover" /> : null}
            <div className="p-6">
              <h3 className="font-bold text-[color:var(--brand-deep)]">{n.title}</h3>
              <p className="mt-2 text-sm">{n.excerpt}</p>
            </div>
          </Link>
        ))}
        {!q.isPending && (q.data ?? []).length === 0 && <p className="text-sm">No published news yet.</p>}
      </section>
    </SiteLayout>
  );
}
