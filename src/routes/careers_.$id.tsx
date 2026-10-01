import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/careers_/$id")({
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["job", id],
    queryFn: () =>
      apiGet<{
        title: string;
        organisation: string;
        location: string;
        description: string;
        howToApply?: string;
        coverUrl?: string | null;
        attachmentUrl?: string | null;
      }>(`/public/jobs/${id}`),
  });
  const [cover, setCover] = useState("");
  const [loading, setLoading] = useState(false);

  if (q.isPending) {
    return (
      <SiteLayout>
        <PageHero title="Vacancy" />
        <div className="mx-auto max-w-2xl px-6 py-12">
          <Skeleton className="h-64" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <PageHero title={q.data?.title ?? "Vacancy"} subtitle={`${q.data?.organisation} · ${q.data?.location}`} />
      <section className="mx-auto max-w-2xl space-y-6 px-6 py-12">
        {q.data?.coverUrl ? <img src={q.data.coverUrl} alt="" className="max-h-72 w-full rounded-2xl object-cover" /> : null}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--brand-deep)]">Job description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{q.data?.description}</p>
        </div>
        {q.data?.howToApply ? (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--brand-deep)]">How to apply</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{q.data.howToApply}</p>
          </div>
        ) : null}
        {q.data?.attachmentUrl ? (
          <a
            href={q.data.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm font-semibold text-[color:var(--brand-green)]"
          >
            Download job pack / attachment →
          </a>
        ) : null}
        <textarea
          className="min-h-32 w-full rounded-md border px-3 py-3"
          placeholder="Cover letter"
          value={cover}
          onChange={(e) => setCover(e.target.value)}
        />
        <Button
          loading={loading}
          className="gradient-brand text-white"
          onClick={async () => {
            if (!user) {
              await navigate({ to: "/login", search: { redirect: `/careers/${id}` } });
              return;
            }
            setLoading(true);
            try {
              await apiPost(`/portal/jobs/${id}/apply`, { coverLetter: cover });
              notify.success("Application submitted.");
            } finally {
              setLoading(false);
            }
          }}
        >
          Apply
        </Button>
      </section>
    </SiteLayout>
  );
}
