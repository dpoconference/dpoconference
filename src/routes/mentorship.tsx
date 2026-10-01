import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { CheckList } from "@/components/site/CheckList";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";
import { notify } from "@/lib/toast";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/mentorship")({
  head: () => ({
    meta: [
      { title: "Professional Mentorship Programme | DPO Conference" },
      { name: "description", content: "The DPO Conference Mentorship Programme connects emerging professionals with experienced privacy and data governance leaders." },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ kind: "MENTEE", area: "Career development", bio: "", goals: "" });
  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Mentorship"
        title="Professional Mentorship Programme"
        subtitle="The DPO Conference Mentorship Programme connects emerging professionals with experienced privacy and data governance leaders. The programme provides practical support, professional guidance and structured knowledge transfer."
      />
      <section className="mx-auto max-w-7xl px-6 py-12 grid gap-10 lg:grid-cols-2">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Mentorship Areas</h2>
            <CheckList
              className="mt-4"
              items={[
                "Career development",
                "Certification preparation",
                "Privacy programme implementation",
                "Compliance audits",
                "DPIAs",
                "Regulatory engagement",
                "Leadership development",
                "Incident response",
                "Executive communication",
                "Research and publication",
              ]}
            />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Become a Mentor</h2>
            <p className="mt-3 text-sm leading-7">
              Experienced professionals can contribute to the development of the next generation by providing guidance, practical
              knowledge and career support. Mentors are expected to:
            </p>
            <CheckList
              className="mt-3"
              items={[
                "Maintain professional confidentiality",
                "Provide honest and constructive guidance",
                "Attend scheduled mentorship sessions",
                "Respect professional boundaries",
                "Support agreed mentorship objectives",
              ]}
            />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Apply as a Mentee</h2>
            <p className="mt-3 text-sm">Mentees will be matched based on:</p>
            <CheckList
              className="mt-3"
              items={[
                "Career interests",
                "Professional experience",
                "Sector",
                "Development goals",
                "Preferred mentorship area",
                "Mentor availability",
              ]}
            />
          </div>
        </div>
        <form
          className="space-y-3 rounded-2xl border bg-white p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!user) {
              await navigate({ to: "/login", search: { redirect: "/mentorship" } });
              return;
            }
            setLoading(true);
            try {
              await apiPost("/portal/mentorship", form);
              notify.success("Mentorship application submitted.");
              await navigate({ to: "/portal/mentorship" });
            } finally {
              setLoading(false);
            }
          }}
        >
          <h3 className="font-bold text-[color:var(--brand-deep)]">Submit an application</h3>
          <select className="w-full rounded-md border px-3 py-3" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="MENTEE">Apply as a Mentee</option>
            <option value="MENTOR">Apply as a Mentor</option>
          </select>
          <input className="w-full rounded-md border px-3 py-3" required placeholder="Mentorship area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          <textarea className="min-h-24 w-full rounded-md border px-3 py-3" required placeholder="Professional biography" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <textarea className="min-h-20 w-full rounded-md border px-3 py-3" placeholder="Development goals" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} />
          <Button type="submit" loading={loading} className="w-full text-white gradient-brand">
            {form.kind === "MENTOR" ? "Apply as a Mentor" : "Apply as a Mentee"}
          </Button>
        </form>
      </section>
    </SiteLayout>
  );
}
