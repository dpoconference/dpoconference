import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/portal/support")({
  component: Page,
});

type Ticket = {
  id: string;
  subject: string;
  category: string;
  description: string;
  status: string;
  replies: {
    id: string;
    body: string;
    isStaff: boolean;
    createdAt: string;
    author: { firstName: string; lastName: string };
  }[];
  events?: {
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }[];
};

function Page() {
  const navigate = useNavigate();
  const tickets = useQuery({
    queryKey: ["tickets"],
    queryFn: () => apiGet<Ticket[]>("/portal/tickets"),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "Membership", description: "" });

  const selected = (tickets.data ?? []).find((t) => t.id === selectedId) ?? null;

  if (tickets.isPending) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Support"
        subtitle="Open tickets and follow replies without leaving your member workspace."
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your tickets</h2>
          {(tickets.data ?? []).map((t) => (
            <button
              key={t.id}
              type="button"
              className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
                selectedId === t.id ? "border-primary bg-primary/5" : "bg-card"
              }`}
              onClick={() => setSelectedId(t.id)}
            >
              <span className="font-medium">{t.subject}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{t.status}</span>
            </button>
          ))}
          {(tickets.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No tickets yet.</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          {selected ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selected.subject}</h3>
                <p className="text-xs text-muted-foreground">
                  {selected.category} · {selected.status}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm">{selected.description}</p>
              </div>
              <div className="rounded-lg border border-dashed bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity trail</p>
                <ol className="mt-2 space-y-2">
                  {(selected.events ?? []).map((ev) => (
                    <li key={ev.id} className="text-xs">
                      <span className="font-medium">{ev.message}</span>
                      <span className="text-muted-foreground"> · {new Date(ev.createdAt).toLocaleString("en-NG")}</span>
                    </li>
                  ))}
                  {(selected.events ?? []).length === 0 && (
                    <li className="text-xs text-muted-foreground">Trail will appear as the ticket progresses.</li>
                  )}
                </ol>
              </div>
              <div className="space-y-3 border-t pt-4">
                {selected.replies.map((r) => (
                  <div key={r.id} className={`rounded-lg px-3 py-2 text-sm ${r.isStaff ? "bg-primary/10" : "bg-muted"}`}>
                    <p className="text-xs font-semibold">
                      {r.isStaff ? "Secretariat" : `${r.author.firstName} ${r.author.lastName}`} ·{" "}
                      {new Date(r.createdAt).toLocaleString("en-NG")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{r.body}</p>
                  </div>
                ))}
                {selected.replies.length === 0 && <p className="text-sm text-muted-foreground">No replies yet.</p>}
              </div>
              <form
                className="space-y-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  try {
                    await apiPost(`/portal/tickets/${selected.id}/replies`, { body: reply });
                    notify.success("Reply sent.");
                    setReply("");
                    await tickets.refetch();
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <textarea
                  className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                  required
                  placeholder="Write a reply…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <Button type="submit" loading={loading}>
                  Send reply
                </Button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a ticket to view the conversation.</p>
          )}
        </div>
      </div>

      <form
        className="mx-auto max-w-xl space-y-3 rounded-2xl border border-border bg-card p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            const t = await apiPost<Ticket>("/portal/tickets", form);
            notify.success("Ticket opened.");
            setForm({ subject: "", category: "Membership", description: "" });
            await tickets.refetch();
            setSelectedId(t.id);
            void navigate({ to: "/portal/support" });
          } finally {
            setLoading(false);
          }
        }}
      >
        <h2 className="text-lg font-semibold">Open a new ticket</h2>
        <input
          className="w-full rounded-md border px-3 py-3"
          required
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <select
          className="w-full rounded-md border px-3 py-3"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {["Membership", "Events", "Payments", "Technical"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <textarea
          className="min-h-28 w-full rounded-md border px-3 py-3"
          required
          placeholder="Describe the issue"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Button type="submit" loading={loading} className="w-full">
          Submit ticket
        </Button>
      </form>
    </div>
  );
}
