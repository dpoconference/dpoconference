import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LegalDocument } from "@/components/site/LegalDocument";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { apiGet } from "@/lib/api";
import { LEGAL_DOCS, legalTitle } from "@/lib/legal";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/legal/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${legalTitle(params.slug)} | DPO Conference` },
      {
        name: "description",
        content: LEGAL_DOCS.find((d) => d.slug === params.slug)?.blurb ?? "DPO Conference legal and governance documents.",
      },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  const { slug } = Route.useParams();
  const doc = LEGAL_DOCS.find((d) => d.slug === slug);
  const q = useQuery({
    queryKey: ["legal", slug],
    queryFn: () => apiGet<{ title: string; bodyMd: string; updatedAt: string }>(`/public/legal/${slug}`),
  });

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Legal"
        eyebrow="Legal & governance"
        title={q.data?.title ?? doc?.title ?? "Legal"}
        subtitle={doc?.blurb ?? "Official notices published by the DPO Conference Secretariat."}
      />
      {q.isPending && (
        <div className="mx-auto max-w-7xl px-6 py-16">
          <Skeleton className="h-[32rem] w-full rounded-2xl" />
        </div>
      )}
      {q.isError && (
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-lg font-semibold text-[color:var(--brand-deep)]">This document is not available.</p>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            Please return to the homepage or contact info@dpoconference.com.
          </p>
        </div>
      )}
      {q.data && <LegalDocument slug={slug} title={q.data.title} bodyMd={q.data.bodyMd} updatedAt={q.data.updatedAt} />}
    </SiteLayout>
  );
}
