import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Search, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/members/directory")({
  head: () => ({
    meta: [{ title: "Member Directory | Data Protection Officers Conference" }, { name: "description", content: "Find and verify Data Protection Officers Conference professional members across Africa." }],
  }),
  component: DirectoryPage,
});

type Row = {
  name: string;
  membershipNumber: string;
  category: string;
  organisation: string | null;
  sector: string | null;
  state: string | null;
  photoUrl?: string | null;
};

function DirectoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [messaging, setMessaging] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const list = useQuery({
    queryKey: ["directory", debounced],
    queryFn: () =>
      apiGet<{ items: Row[] }>(`/public/directory?${new URLSearchParams(debounced ? { q: debounced } : {}).toString()}`),
  });

  async function messageMember(membershipNumber: string) {
    if (!user) {
      await navigate({ to: "/login", search: { redirect: "/members/directory" } });
      return;
    }
    setMessaging(membershipNumber);
    try {
      const thread = await apiPost<{ id: string }>("/portal/messages", { membershipNumber });
      await navigate({ to: "/portal/messages/$threadId", params: { threadId: thread.id } });
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Could not start a conversation.");
    } finally {
      setMessaging(null);
    }
  }

  return (
    <SiteLayout>
      <PageHero breadcrumb="Home / Directory" eyebrow="Professional Member Directory" title="Professional Member Directory" subtitle="Connect with members across industries, sectors and professional disciplines. Only information authorised by each member will be displayed." />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[color:var(--muted-foreground)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, sector, expertise…"
            className="w-full rounded-2xl border-2 border-[color:var(--border)] pl-12 pr-4 py-4 text-base md:text-sm focus:outline-none focus:border-[color:var(--brand-emerald)]"
          />
        </div>
        {list.isPending && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(list.data?.items ?? []).map((m) => (
            <div key={m.membershipNumber} className="p-6 rounded-2xl border border-[color:var(--border)] bg-white">
              <div className="flex items-start justify-between">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full gradient-brand grid place-items-center text-white font-bold text-lg">{m.name[0]}</div>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--brand-emerald)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              </div>
              <h3 className="mt-4 font-bold text-[color:var(--brand-deep)]">{m.name}</h3>
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {m.category}
                {m.sector ? ` · ${m.sector}` : ""}
              </p>
              <p className="mt-2 text-xs text-[color:var(--muted-foreground)]">{m.state ? `${m.state}, Nigeria` : m.organisation ?? "Nigeria"}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-4"
                loading={messaging === m.membershipNumber}
                onClick={() => void messageMember(m.membershipNumber)}
              >
                Message
              </Button>
            </div>
          ))}
        </div>
        {!list.isPending && (list.data?.items ?? []).length === 0 && (
          <p className="rounded-2xl border bg-white p-8 text-sm text-[color:var(--muted-foreground)]">
            No members have opted in to the public directory yet. Members can enable listing from the portal.
          </p>
        )}
      </section>
    </SiteLayout>
  );
}
