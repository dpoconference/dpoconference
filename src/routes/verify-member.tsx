import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { ShieldCheck } from "lucide-react";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

type Result = {
  name: string;
  membershipNumber: string;
  category: string;
  status: string;
  year: number;
} | null;

export const Route = createFileRoute("/verify-member")({
  validateSearch: (s: Record<string, unknown>): { n?: string; name?: string } => ({
    ...(typeof s.n === "string" ? { n: s.n } : {}),
    ...(typeof s.name === "string" ? { name: s.name } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Verify Member | DPO Conference" },
      { name: "description", content: "Verify DPO Conference professional membership using membership number, certificate number or QR code." },
      { property: "og:title", content: "Verify DPO Conference Membership" },
      { property: "og:description", content: "Confirm the professional standing of a DPO Conference member." },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const search = useSearch({ from: "/verify-member" });
  const [n, setN] = useState(search.n ?? "");
  const [name, setName] = useState(search.name ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | undefined>(undefined);

  async function verify(number = n, fullName = name) {
    if (!number.trim() && !fullName.trim()) {
      notify.error("Enter a membership number or name.");
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (number.trim()) qs.set("n", number.trim());
      if (fullName.trim()) qs.set("name", fullName.trim());
      const data = await apiGet<Result>(`/public/verify-member?${qs.toString()}`);
      setResult(data);
      if (!data) notify.info("No matching current membership found.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (search.n || search.name) void verify(search.n ?? "", search.name ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.n, search.name]);

  return (
    <SiteLayout>
      <PageHero breadcrumb="Home / Verify Member" eyebrow="Verification" title="Verify DPO Conference professional membership." subtitle="Confirm the professional standing and current status of any DPO Conference member." />
      <section className="mx-auto max-w-2xl px-6 py-20">
        <div className="p-8 rounded-2xl border border-[color:var(--border)] bg-white ">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl gradient-brand grid place-items-center text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Verify a member</h2>
          </div>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void verify();
            }}
          >
            <div>
              <label className="text-sm font-semibold">Membership number</label>
              <input
                placeholder="DPO/2026/PRO/90001"
                value={n}
                onChange={(e) => setN(e.target.value)}
                className="mt-1 w-full rounded-md border border-[color:var(--border)] px-3 py-3 text-base md:text-sm"
              />
            </div>
            <div className="text-center text-xs text-[color:var(--muted-foreground)]">or</div>
            <div>
              <label className="text-sm font-semibold">Full name</label>
              <input
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-[color:var(--border)] px-3 py-3 text-base md:text-sm"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full min-h-11 rounded-md gradient-brand text-white font-bold py-3">
              Verify
            </Button>
          </form>
          {result && (
            <div className="mt-6 rounded-xl border bg-[color:var(--brand-tint)]/40 p-5">
              <p className="text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">Verified record</p>
              <p className="mt-2 text-xl font-extrabold text-[color:var(--brand-deep)]">{result.name}</p>
              <p className="mt-1 text-sm">{result.membershipNumber}</p>
              <p className="mt-1 text-sm">
                {result.category} · {result.status} · {result.year}
              </p>
            </div>
          )}
          {result === null && <p className="mt-6 text-sm text-[color:var(--muted-foreground)]">No public record matched that search.</p>}
        </div>
      </section>
    </SiteLayout>
  );
}
