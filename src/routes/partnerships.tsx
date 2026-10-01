import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { CheckList } from "@/components/site/CheckList";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/partnerships")({
  head: () => ({
    meta: [
      { title: "Partner With DPO Conference" },
      { name: "description", content: "Collaboration with regulators, government institutions, professional bodies, universities, development organisations, technology companies, financial institutions and international privacy organisations." },
    ],
  }),
  component: Page,
});

function Page() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ organisation: "", contact: "", type: "Sponsor", message: "" });
  return (
    <SiteLayout>
      <PageHero
        title="Partner With DPO Conference"
        subtitle="DPO Conference welcomes collaboration with regulators, government institutions, professional bodies, universities, development organisations, technology companies, financial institutions and international privacy organisations."
      />
      <section className="mx-auto max-w-7xl px-6 py-12 grid gap-10 lg:grid-cols-2">
        <div className="space-y-8">
          <p className="text-[15px] leading-7">
            Partnerships will support professional development, research, innovation, public awareness and the advancement of
            privacy governance.
          </p>
          <div>
            <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Partnership Opportunities</h2>
            <p className="mt-2 text-sm">Partners may support:</p>
            <CheckList
              className="mt-3"
              items={[
                "Annual conferences",
                "Professional training",
                "Research programmes",
                "Scholarships",
                "Mentorship",
                "Publications",
                "Sector forums",
                "Awards",
                "Technology infrastructure",
                "Public awareness initiatives",
                "International exchange programmes",
              ]}
            />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Why Partner With Us?</h2>
            <p className="mt-2 text-sm">Partners benefit from:</p>
            <CheckList
              className="mt-3"
              items={[
                "National professional visibility",
                "Access to privacy and governance professionals",
                "Brand recognition",
                "Thought leadership opportunities",
                "Speaking opportunities",
                "Exhibition opportunities",
                "Professional networking",
                "Contribution to national privacy development",
                "Recognition in publications and events",
              ]}
            />
          </div>
        </div>
        <form
          className="space-y-3 rounded-2xl border bg-white p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              await apiPost("/public/partnerships", form);
              notify.success("Enquiry received. The partnership office will respond.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <h3 className="font-bold text-[color:var(--brand-deep)]">Become a Partner</h3>
          <input className="w-full rounded-md border px-3 py-3" required placeholder="Organisation" value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
          <input className="w-full rounded-md border px-3 py-3" required placeholder="Contact name and email" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <select className="w-full rounded-md border px-3 py-3" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {["Sponsor", "Knowledge partner", "Media", "Institutional"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <textarea className="min-h-28 w-full rounded-md border px-3 py-3" required placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <Button type="submit" loading={loading} className="w-full text-white gradient-brand">
            Become a Partner
          </Button>
        </form>
      </section>
    </SiteLayout>
  );
}
