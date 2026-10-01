import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Building2, ArrowRight } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/communities")({
  head: () => ({
    meta: [
      { title: "Sector Communities | DPO Conference" },
      { name: "description", content: "Sector-specific communities for privacy professionals in financial services, public sector, healthcare, tech, education and more." },
      { property: "og:title", content: "DPO Conference Sector Communities" },
      { property: "og:description", content: "Peer-led networks shaping sector responses to emerging regulation." },
    ],
  }),
  component: CommunitiesPage,
});

type Community = {
  slug: string;
  name: string;
  description: string | null;
  memberCount: number;
  joined: boolean;
};

function CommunitiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["communities"],
    queryFn: () => apiGet<Community[]>("/public/communities"),
  });

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Sector Communities"
        eyebrow="Sector Communities"
        title="Sector Communities and Professional Working Groups"
        subtitle="Different sectors face different privacy, cybersecurity and regulatory challenges. DPO Conference sector communities create focused platforms where members can discuss sector-specific issues, share good practices and collaborate on practical solutions."
      />

      <section className="mx-auto max-w-7xl px-6 py-20">
        {q.isPending && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(q.data ?? []).map((s) => (
            <div key={s.slug} className="group p-7 rounded-2xl border border-[color:var(--border)] bg-white hover:border-[color:var(--brand-emerald)]  transition-all">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-xl gradient-brand grid place-items-center text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-[color:var(--brand-green)]">{s.memberCount} members</span>
              </div>
              <h3 className="mt-5 font-bold text-lg text-[color:var(--brand-deep)]">{s.name}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{s.description ?? "Quarterly roundtables, working groups and sector-specific guidance."}</p>
              <Button
                variant="ghost"
                loading={busy === s.slug}
                className="mt-5 h-auto p-0 text-sm font-semibold text-[color:var(--brand-deep)]"
                onClick={async () => {
                  if (!user) {
                    await navigate({ to: "/login", search: { redirect: "/communities" } });
                    return;
                  }
                  setBusy(s.slug);
                  try {
                    await apiPost(`/portal/communities/${s.slug}/join`, {});
                    notify.success(s.joined ? "You are already a member of this community." : "You joined this community.");
                    await qc.invalidateQueries({ queryKey: ["communities"] });
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {s.joined ? "Joined" : "Join community"} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        {!q.isPending && (q.data ?? []).length === 0 && (
          <p className="text-sm text-[color:var(--muted-foreground)]">Communities will appear here once published by the Secretariat.</p>
        )}
      </section>
    </SiteLayout>
  );
}
