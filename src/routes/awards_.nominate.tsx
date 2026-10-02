import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/awards_/nominate")({
  head: () => ({ meta: [{ title: "Nominate | Data Protection Officers Conference" }] }),
  component: Page,
});

function Page() {
  const cats = useQuery({
    queryKey: ["awards"],
    queryFn: () => apiGet<{ categories: { slug: string; name: string }[] }>("/public/awards"),
  });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    categorySlug: "dpo-of-the-year",
    nomineeName: "",
    organisation: "",
    statement: "",
    conflictDeclared: false,
  });
  return (
    <SiteLayout>
      <PageHero title="Submit a nomination" />
      <form
        className="mx-auto max-w-xl px-6 py-12 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!form.conflictDeclared) return notify.error("Please declare conflicts of interest.");
          setLoading(true);
          try {
            await apiPost("/public/awards/nominate", {
              categorySlug: form.categorySlug,
              nominee: { name: form.nomineeName, organisation: form.organisation },
              statement: form.statement,
              conflictDeclared: true,
            });
            notify.success("Nomination submitted.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <select className="w-full rounded-md border px-3 py-3" value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}>
          {(cats.data?.categories ?? []).map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <input className="w-full rounded-md border px-3 py-3" required placeholder="Nominee name" value={form.nomineeName} onChange={(e) => setForm({ ...form, nomineeName: e.target.value })} />
        <input className="w-full rounded-md border px-3 py-3" placeholder="Organisation" value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
        <textarea className="w-full rounded-md border px-3 py-3 min-h-32" required placeholder="Citation (at least 30 characters)" value={form.statement} onChange={(e) => setForm({ ...form, statement: e.target.value })} />
        <label className="flex gap-2 text-sm">
          <input type="checkbox" checked={form.conflictDeclared} onChange={(e) => setForm({ ...form, conflictDeclared: e.target.checked })} />
          I declare any conflict of interest and confirm this nomination is made in good faith.
        </label>
        <Button type="submit" loading={loading} className="w-full gradient-brand text-white">
          Submit nomination
        </Button>
      </form>
    </SiteLayout>
  );
}
