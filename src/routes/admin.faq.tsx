import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/faq")({
  component: Page,
});

type FaqItem = { id: string; question: string; answer: string; sortOrder: number };

const empty = { id: "", question: "", answer: "", sortOrder: "0" };

function Page() {
  const { hasPermission } = useAuth();
  const can = hasPermission("cms.manage");
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin-faq"],
    queryFn: () => apiGet<FaqItem[]>("/admin/faq"),
    enabled: can,
  });

  if (!can) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You need cms.manage to manage FAQ items.
      </div>
    );
  }
  if (q.isPending) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader icon={HelpCircle} title="FAQ" subtitle="Create, update, and remove public FAQ entries." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-3 rounded-2xl border border-border bg-card p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const body = {
                question: form.question,
                answer: form.answer,
                sortOrder: Number(form.sortOrder) || 0,
              };
              if (form.id) {
                await apiPut(`/admin/faq/${form.id}`, body);
                notify.success("FAQ updated.");
              } else {
                await apiPost("/admin/faq", body);
                notify.success("FAQ created.");
              }
              setForm(empty);
              await q.refetch();
            } finally {
              setLoading(false);
            }
          }}
        >
          <h3 className="font-semibold">{form.id ? "Edit FAQ" : "New FAQ"}</h3>
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
            placeholder="Question"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
          />
          <textarea
            className="min-h-28 w-full rounded-md border px-3 py-2 text-sm"
            required
            placeholder="Answer"
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
          />
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="number"
            placeholder="Sort order"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={loading}>
              {form.id ? "Update" : "Create"}
            </Button>
            {form.id ? (
              <Button type="button" variant="outline" onClick={() => setForm(empty)}>
                Clear
              </Button>
            ) : null}
          </div>
        </form>

        <ul className="space-y-3 rounded-2xl border border-border bg-card p-5">
          {(q.data ?? []).map((item) => (
            <li key={item.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
              <button
                type="button"
                className="text-left text-sm font-medium text-[color:var(--brand-green)]"
                onClick={() =>
                  setForm({
                    id: item.id,
                    question: item.question,
                    answer: item.answer,
                    sortOrder: String(item.sortOrder),
                  })
                }
              >
                {item.question}
              </button>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.answer}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                loading={busyId === item.id}
                onClick={async () => {
                  setBusyId(item.id);
                  try {
                    await apiDelete(`/admin/faq/${item.id}`);
                    notify.success("FAQ deleted.");
                    if (form.id === item.id) setForm(empty);
                    await q.refetch();
                  } finally {
                    setBusyId(null);
                  }
                }}
              >
                Delete
              </Button>
            </li>
          ))}
          {(q.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No FAQ items yet.</p>}
        </ul>
      </div>
    </div>
  );
}
