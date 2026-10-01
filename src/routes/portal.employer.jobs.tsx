import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/portal/employer/jobs")({
  component: Page,
});

function Page() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    organisation: "",
    location: "Abuja",
    description: "Role description for a privacy vacancy, including duties and requirements.",
  });
  return (
    <form
      className="rounded-2xl border border-border bg-card p-6 max-w-xl space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          await apiPost("/portal/jobs", form);
          notify.success("Vacancy submitted. It stays unpublished until the Secretariat approves it.");
        } finally {
          setLoading(false);
        }
      }}
    >
      <h2 className="text-xl font-semibold tracking-tight">Post a vacancy</h2>
      <input className="w-full rounded-md border px-3 py-2" required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <input className="w-full rounded-md border px-3 py-2" required placeholder="Organisation" value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
      <input className="w-full rounded-md border px-3 py-2" required placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <textarea className="w-full rounded-md border px-3 py-2 min-h-28" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <Button type="submit" loading={loading} className="gradient-brand text-white">
        Submit for review
      </Button>
    </form>
  );
}
