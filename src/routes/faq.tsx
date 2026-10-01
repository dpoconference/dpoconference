import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { apiGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ | DPO Conference" }] }),
  component: Page,
});

function Page() {
  const q = useQuery({
    queryKey: ["faq"],
    queryFn: () => apiGet<{ id: string; question: string; answer: string }[]>("/public/faq"),
  });
  return (
    <SiteLayout>
      <PageHero title="Frequently Asked Questions" subtitle="Answers about membership, the annual conference, CPD, corporate registration and partnerships." />
      <section className="mx-auto max-w-3xl px-6 py-16 space-y-4">
        {q.isPending && <Skeleton className="h-64" />}
        {(q.data ?? []).map((f) => (
          <details key={f.id} className="rounded-2xl border bg-white p-5">
            <summary className="font-bold cursor-pointer">{f.question}</summary>
            <p className="mt-3 text-sm leading-relaxed">{f.answer}</p>
          </details>
        ))}
      </section>
    </SiteLayout>
  );
}
