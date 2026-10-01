import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { CheckList } from "@/components/site/CheckList";
import { awardCategories } from "@/content/siteCopy";
import { apiGet } from "@/lib/api";

export const Route = createFileRoute("/awards")({
  head: () => ({
    meta: [
      { title: "DPO Conference Awards and Professional Recognition" },
      { name: "description", content: "The DPO Conference Awards recognise individuals and organisations demonstrating leadership, innovation, professional excellence and measurable impact in privacy and data governance." },
    ],
  }),
  component: Page,
});

function Page() {
  const q = useQuery({
    queryKey: ["awards"],
    queryFn: () =>
      apiGet<{ categories: { slug: string; name: string; description: string }[]; cycle: { year: number; isOpen: boolean } | null }>(
        "/public/awards",
      ),
  });
  const live = q.data?.categories ?? [];
  return (
    <SiteLayout>
      <PageHero
        title="DPO Conference Awards and Professional Recognition"
        subtitle={
          q.data?.cycle?.isOpen
            ? `Nominations are open for ${q.data.cycle.year}. The Awards recognise individuals and organisations demonstrating leadership, innovation, professional excellence and measurable impact in privacy and data governance.`
            : "The DPO Conference Awards recognise individuals and organisations demonstrating leadership, innovation, professional excellence and measurable impact in privacy and data governance."
        }
      />
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Award Categories</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(live.length ? live.map((c) => c.name) : awardCategories).map((name) => (
            <div key={name} className="rounded-2xl border bg-white p-6">
              <h3 className="font-bold text-[color:var(--brand-deep)]">{name}</h3>
            </div>
          ))}
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Nomination Process</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
              <li>Select an award category.</li>
              <li>Complete the nomination form.</li>
              <li>Provide the nominee’s professional information.</li>
              <li>Submit a nomination statement.</li>
              <li>Upload supporting evidence.</li>
              <li>Complete the conflict-of-interest declaration.</li>
              <li>Submit the nomination before the deadline.</li>
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Evaluation</h2>
            <p className="mt-3 text-sm">Nominations will be assessed based on:</p>
            <CheckList
              className="mt-3"
              items={[
                "Professional impact",
                "Innovation",
                "Leadership",
                "Measurable outcomes",
                "Ethical conduct",
                "Contribution to privacy and data governance",
                "Supporting evidence",
              ]}
            />
          </div>
        </div>
        <div className="mt-10 text-center">
          <Link to="/awards/nominate" className="inline-block rounded-md px-6 py-3 font-semibold text-white gradient-brand">
            Nominate
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
