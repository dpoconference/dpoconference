import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/portal/messages/$threadId")({
  component: Page,
});

type Thread = {
  id: string;
  peer: { name: string; membershipNumber?: string | null; category?: string | null } | null;
  messages: { id: string; body: string; createdAt: string; mine: boolean; senderName: string }[];
};

function Page() {
  const { threadId } = Route.useParams();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const q = useQuery({
    queryKey: ["member-thread", threadId],
    queryFn: () => apiGet<Thread>(`/portal/messages/${threadId}`),
  });

  if (q.isPending) return <PageSkeleton />;
  if (!q.data) return <p className="text-sm text-muted-foreground">Conversation not found.</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={q.data.peer?.name ?? "Conversation"}
        subtitle={[q.data.peer?.category, q.data.peer?.membershipNumber].filter(Boolean).join(" · ")}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/portal/messages">
              <ArrowLeft className="h-4 w-4" /> Inbox
            </Link>
          </Button>
        }
      />
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        {q.data.messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.mine ? "ml-auto bg-[color:var(--brand-tint)]" : "bg-muted"}`}>
            <p className="text-[11px] text-muted-foreground">{m.mine ? "You" : m.senderName}</p>
            <p className="whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
        {q.data.messages.length === 0 && <p className="text-sm text-muted-foreground">Start the conversation below.</p>}
      </div>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!body.trim()) return;
          setSending(true);
          try {
            await apiPost(`/portal/messages/${threadId}`, { body: body.trim() });
            setBody("");
            await q.refetch();
          } catch (err) {
            notify.error(err instanceof Error ? err.message : "Could not send.");
          } finally {
            setSending(false);
          }
        }}
      >
        <textarea
          className="min-h-16 flex-1 rounded-md border px-3 py-2 text-sm"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a professional message"
        />
        <Button type="submit" loading={sending}>
          Send
        </Button>
      </form>
    </div>
  );
}
