import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/conference_/speak")({
  head: () => ({ meta: [{ title: "Apply to Speak | DPO Conference" }] }),
  component: Page,
});

function Page() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    conferenceSlug: "annual-2027",
    title: "",
    abstract: "",
    profile: "",
    objectives: "",
  });
  return (
    <SiteLayout>
      <PageHero title="Apply to speak" subtitle="Share practice, research or regulatory insight at the annual conference." />
      <form
        className="mx-auto max-w-xl px-6 py-12 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await apiPost("/public/speakers", form);
            notify.success("Speaker application received.");
            setForm({ ...form, title: "", abstract: "", profile: "", objectives: "" });
          } finally {
            setLoading(false);
          }
        }}
      >
        <input className="w-full rounded-md border px-3 py-3" required placeholder="Session title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="w-full rounded-md border px-3 py-3 min-h-28" required placeholder="Abstract" value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} />
        <textarea className="w-full rounded-md border px-3 py-3 min-h-24" required placeholder="Speaker profile" value={form.profile} onChange={(e) => setForm({ ...form, profile: e.target.value })} />
        <textarea className="w-full rounded-md border px-3 py-3 min-h-20" placeholder="Learning objectives" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} />
        <Button type="submit" loading={loading} className="w-full gradient-brand text-white">
          Submit application
        </Button>
      </form>
    </SiteLayout>
  );
}
