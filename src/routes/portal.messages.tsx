import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { apiGet } from "@/lib/api";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";

export const Route = createFileRoute("/portal/messages")({
  component: Page,
});

type Thread = {
  id: string;
  lastBody: string;
  lastAt: string;
  unread?: boolean;
  peer: { id: string; name: string; membershipNumber?: string | null; category?: string | null } | null;
};

function Page() {
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["member-threads"],
    queryFn: () => apiGet<Thread[]>("/portal/messages"),
  });

  if (q.isPending) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MessageSquare}
        title="Messages"
        subtitle="Message members in your category, or anyone listed in the public directory. Conference tickets do not unlock this."
      />
      <div className="divide-y rounded-2xl border border-border bg-card">
        {(q.data ?? []).map((t) => (
          <button
            key={t.id}
            type="button"
            className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-muted/40"
            onClick={() => void navigate({ to: "/portal/messages/$threadId", params: { threadId: t.id } })}
          >
            <div>
              <p className="font-medium">
                {t.peer?.name ?? "Member"}
                {t.unread ? <span className="ml-2 text-xs text-[color:var(--brand-green)]">New</span> : null}
              </p>
              <p className="line-clamp-1 text-sm text-muted-foreground">{t.lastBody || "No messages yet"}</p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">{new Date(t.lastAt).toLocaleDateString("en-NG")}</p>
          </button>
        ))}
        {(q.data ?? []).length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">
            No conversations yet. Open the{" "}
            <Link to="/members/directory" className="font-semibold text-[color:var(--brand-green)]">
              member directory
            </Link>{" "}
            and choose Message.
          </p>
        )}
      </div>
    </div>
  );
}
