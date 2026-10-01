import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/admin/contacts")({
  component: Page,
});

type Contact = { id: string; name: string; email: string; subject: string; body: string; category: string };
type Ticket = {
  id: string;
  subject: string;
  category: string;
  description: string;
  status: string;
  user: { firstName: string; lastName: string; email: string };
  _count: { replies: number; events?: number };
};

const STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_ON_MEMBER", "RESOLVED", "CLOSED"] as const;

function Page() {
  const [tab, setTab] = useState<"tickets" | "contacts">("tickets");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const contacts = useQuery({
    queryKey: ["contacts"],
    queryFn: () => apiGet<Contact[]>("/admin/contacts"),
  });
  const tickets = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: () => apiGet<Ticket[]>("/admin/tickets"),
  });
  const thread = useQuery({
    queryKey: ["admin-ticket", selectedId],
    queryFn: () =>
      apiGet<{
        id: string;
        subject: string;
        description: string;
        status: string;
        user: { firstName: string; lastName: string; email: string };
        replies: { id: string; body: string; isStaff: boolean; createdAt: string; author: { firstName: string; lastName: string } }[];
        events: {
          id: string;
          type: string;
          message: string;
          createdAt: string;
          actor?: { firstName: string; lastName: string } | null;
        }[];
      }>(`/portal/tickets/${selectedId}`),
    enabled: Boolean(selectedId),
  });

  if (contacts.isPending || tickets.isPending) return <Skeleton className="h-40" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Inbox" subtitle="Support tickets and public contact form messages." />
      <div className="flex gap-2">
        <Button size="sm" variant={tab === "tickets" ? "default" : "outline"} onClick={() => setTab("tickets")}>
          Tickets ({tickets.data?.length ?? 0})
        </Button>
        <Button size="sm" variant={tab === "contacts" ? "default" : "outline"} onClick={() => setTab("contacts")}>
          Contact forms ({contacts.data?.length ?? 0})
        </Button>
      </div>

      {tab === "tickets" && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {(tickets.data ?? []).map((t) => (
              <button
                key={t.id}
                type="button"
                className={`block w-full rounded-xl border border-border bg-card px-3 py-2 text-left text-sm ${selectedId === t.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedId(t.id)}
              >
                <p className="font-semibold">{t.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {t.user.firstName} {t.user.lastName} · {t.status} · {t._count.replies} replies
                </p>
              </button>
            ))}
            {(tickets.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No support tickets.</p>}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            {thread.isPending && selectedId && <Skeleton className="h-32" />}
            {thread.data && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{thread.data.subject}</h3>
                    <p className="text-xs text-muted-foreground">
                      {thread.data.user.firstName} {thread.data.user.lastName} · {thread.data.user.email}
                    </p>
                    <p className="mt-3 text-sm whitespace-pre-wrap">{thread.data.description}</p>
                  </div>
                  <select
                    className="rounded-md border px-2 py-1.5 text-sm"
                    value={thread.data.status}
                    onChange={(e) =>
                      void apiPatch(`/portal/tickets/${thread.data!.id}/status`, { status: e.target.value }).then(() => {
                        notify.success("Status updated.");
                        void thread.refetch();
                        void tickets.refetch();
                      })
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity trail</p>
                  <ol className="mt-2 space-y-2">
                    {(thread.data.events ?? []).map((ev) => (
                      <li key={ev.id} className="text-xs">
                        <span className="font-medium">{ev.message}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {ev.actor ? `${ev.actor.firstName} ${ev.actor.lastName}` : "System"} ·{" "}
                          {new Date(ev.createdAt).toLocaleString("en-NG")}
                        </span>
                      </li>
                    ))}
                    {(thread.data.events ?? []).length === 0 && (
                      <li className="text-xs text-muted-foreground">No trail events yet.</li>
                    )}
                  </ol>
                </div>

                <div className="space-y-3 border-t pt-4">
                  {thread.data.replies.map((r) => (
                    <div key={r.id} className={`rounded-lg px-3 py-2 text-sm ${r.isStaff ? "bg-primary/10" : "bg-muted"}`}>
                      <p className="text-xs font-semibold">
                        {r.isStaff ? "Secretariat" : `${r.author.firstName} ${r.author.lastName}`} ·{" "}
                        {new Date(r.createdAt).toLocaleString("en-NG")}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{r.body}</p>
                    </div>
                  ))}
                </div>
                <form
                  className="space-y-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedId) return;
                    setLoading(true);
                    try {
                      await apiPost(`/portal/tickets/${selectedId}/replies`, { body: reply });
                      notify.success("Reply sent to member.");
                      setReply("");
                      await thread.refetch();
                      await tickets.refetch();
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <textarea
                    className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                    required
                    placeholder="Staff reply…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <Button type="submit" loading={loading}>
                    Reply
                  </Button>
                </form>
              </div>
            )}
            {!selectedId && <p className="text-sm text-muted-foreground">Select a ticket.</p>}
          </div>
        </div>
      )}

      {tab === "contacts" && (
        <div className="space-y-3">
          {(contacts.data ?? []).map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
              <p className="font-bold">
                {c.subject} · {c.category}
              </p>
              <p>
                {c.name} · {c.email}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
          {(contacts.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No contact messages.</p>}
        </div>
      )}
    </div>
  );
}
