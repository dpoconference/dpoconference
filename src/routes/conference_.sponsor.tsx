import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/conference_/sponsor")({
  head: () => ({ meta: [{ title: "Sponsor the Conference | DPO Conference" }] }),
  component: Page,
});

function Page() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    conferenceSlug: "annual-2027",
    organisation: "",
    contact: "",
    tierInterest: "Gold",
    message: "",
  });
  return (
    <SiteLayout>
      <PageHero title="Become a sponsor" subtitle="Partner with Africa’s flagship privacy event. The Secretariat will follow up." />
      <form
        className="mx-auto max-w-xl px-6 py-12 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await apiPost("/public/sponsors", form);
            notify.success("Sponsorship enquiry received.");
            setForm({ ...form, organisation: "", contact: "", message: "" });
          } finally {
            setLoading(false);
          }
        }}
      >
        <input className="w-full rounded-md border px-3 py-3" required placeholder="Organisation" value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
        <input className="w-full rounded-md border px-3 py-3" required placeholder="Contact name and email" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <select className="w-full rounded-md border px-3 py-3" value={form.tierInterest} onChange={(e) => setForm({ ...form, tierInterest: e.target.value })}>
          {["Title Partner", "Platinum", "Gold", "Silver", "Exhibitor", "Knowledge Partner"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <textarea className="w-full rounded-md border px-3 py-3 min-h-28" required placeholder="How would you like to partner?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <Button type="submit" loading={loading} className="w-full gradient-brand text-white">
          Send enquiry
        </Button>
      </form>
    </SiteLayout>
  );
}
