import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { apiGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeHtml } from "@/components/SafeHtml";

export const Route = createFileRoute("/news_/$slug")({
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["news", slug],
    queryFn: () =>
      apiGet<{ title: string; bodyMd: string; bodyHtml?: string; coverUrl?: string | null; excerpt?: string }>(
        `/public/news/${slug}`,
      ),
  });
  return (
    <SiteLayout>
      <PageHero title={q.data?.title ?? "News"} subtitle={q.data?.excerpt} />
      {q.data?.coverUrl ? (
        <div className="mx-auto max-w-3xl px-6 pt-8">
          <img src={q.data.coverUrl} alt="" className="max-h-[420px] w-full rounded-2xl object-cover" />
        </div>
      ) : null}
      <article className="mx-auto max-w-3xl px-6 py-16 leading-relaxed">
        {q.isPending ? (
          <Skeleton className="h-64" />
        ) : q.data?.bodyHtml?.trim() ? (
          <SafeHtml html={q.data.bodyHtml} />
        ) : (
          <p className="whitespace-pre-wrap">{q.data?.bodyMd}</p>
        )}
      </article>
    </SiteLayout>
  );
}
