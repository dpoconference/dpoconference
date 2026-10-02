import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { ConferenceRegisterForm } from "@/components/site/ConferenceRegisterForm";

export const Route = createFileRoute("/conferences_/$slug_/register")({
  head: () => ({ meta: [{ title: "Register for Conference | Data Protection Officers Conference" }] }),
  component: ConferenceRegisterPage,
});

function ConferenceRegisterPage() {
  const { slug } = Route.useParams();
  return (
    <SiteLayout>
      <PageHero title="Conference registration" breadcrumb="Home / Conferences / Register" />
      <section className="mx-auto max-w-xl px-6 py-12">
        <ConferenceRegisterForm slug={slug} />
      </section>
    </SiteLayout>
  );
}
