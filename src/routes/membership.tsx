import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { CheckCircle2, ArrowRight, FileText, CreditCard, ShieldCheck, UserPlus, ClipboardCheck, Upload, BadgeCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckList } from "@/components/site/CheckList";
import { membershipCategories } from "@/content/siteCopy";

function ApplyCta({
  category,
  className,
  children,
}: {
  category?: string;
  className: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (user) {
    return (
      <Link to="/portal/apply" search={category ? { category } : {}} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link
      to="/register"
      search={{ redirect: "/portal/apply", ...(category ? { category } : {}) }}
      className={className}
    >
      {children}
    </Link>
  );
}

export const Route = createFileRoute("/membership")({
  head: () => ({
    meta: [
      { title: "Become a Member of DPO Conference" },
      { name: "description", content: "Membership provides year-round access to professional learning, networking, mentorship, CPD programmes, regulatory updates, resources, career opportunities and the annual national conference." },
    ],
  }),
  component: MembershipPage,
});

type Category = {
  slug: string;
  name: string;
  description: string | null;
  currentFee: { amountNgn: number; year: number } | null;
};

const steps = [
  { icon: UserPlus, title: "Create your account" },
  { icon: ClipboardCheck, title: "Select a membership category" },
  { icon: FileText, title: "Complete the application form" },
  { icon: Upload, title: "Upload required supporting documents" },
  { icon: ShieldCheck, title: "Accept the membership terms and code of ethics" },
  { icon: CreditCard, title: "Make the applicable payment" },
  { icon: FileText, title: "Submit your application for review" },
  { icon: BadgeCheck, title: "Receive your membership confirmation and digital card" },
];

const copyBySlug: Record<string, (typeof membershipCategories)[keyof typeof membershipCategories]> = {
  student: membershipCategories.student,
  associate: membershipCategories.associate,
  professional: membershipCategories.professional,
  fellow: membershipCategories.fellow,
  corporate: membershipCategories.corporate,
};

function MembershipPage() {
  const cats = useQuery({
    queryKey: ["public-categories"],
    queryFn: () => apiGet<Category[]>("/public/membership-categories"),
  });

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Membership"
        eyebrow="Membership"
        title="Become a Member of DPO Conference"
        subtitle="Membership of DPO Conference provides year-round access to professional learning, networking, mentorship, CPD programmes, regulatory updates, resources, career opportunities and the annual national conference."
      />

      <section className="mx-auto max-w-4xl px-6 pt-12 text-[15px] leading-7">
        <p>
          Whether you are beginning your privacy career, practising as a Data Protection Officer or leading privacy governance
          within an organisation, there is a membership category suitable for you.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">Why become a member</p>
        <h2 className="mt-3 text-3xl font-extrabold text-[color:var(--brand-deep)]">Year-round professional access</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            "Professional learning",
            "Networking",
            "Mentorship",
            "CPD programmes",
            "Regulatory updates",
            "Professional resources",
            "Career opportunities",
            "Annual conference",
            "Sector communities",
            "Threat intelligence",
          ].map((b) => (
            <div key={b} className="p-4 rounded-lg border border-[color:var(--border)] bg-white text-sm font-medium flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-[color:var(--brand-emerald)] shrink-0 mt-0.5" />
              {b}
            </div>
          ))}
        </div>
        <Link to="/benefits" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--brand-green)]">
          Explore member benefits <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)]">Membership categories</h2>
          <p className="mt-3 text-[color:var(--muted-foreground)]">Choose the category that matches your experience and goals.</p>
        </div>
        {cats.isPending && (
          <div className="mt-12 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        )}
        <div className="mt-12 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {(cats.data ?? []).map((t) => {
            const featured = t.slug === "professional";
            const gold = t.slug === "fellow";
            const copy = copyBySlug[t.slug];
            return (
              <div
                key={t.slug}
                className={`relative rounded-2xl p-6 border-2 bg-white ${
                  featured ? "border-[color:var(--brand-emerald)]  xl:-translate-y-3" : gold ? "border-[color:var(--brand-gold)]" : "border-[color:var(--border)]"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[color:var(--brand-emerald)] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                {gold && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[color:var(--brand-gold)] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Distinguished
                  </span>
                )}
                <h3 className="text-xl font-extrabold text-[color:var(--brand-deep)]">{t.name}</h3>
                <p className="mt-2 text-xs text-[color:var(--muted-foreground)] min-h-[72px]">{copy?.for ?? t.description ?? "Apply to join this category."}</p>
                <p className="mt-3 text-sm font-bold text-[color:var(--brand-deep)]">
                  {t.currentFee ? formatNaira(t.currentFee.amountNgn) : "Fee on application"}
                </p>
                <ul className="mt-4 space-y-2 text-xs">
                  {(copy?.benefits.slice(0, 5) ?? ["Member directory", "Training access", "CPD credits"]).map((b) => (
                    <li key={b} className="flex gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--brand-emerald)] shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
                <ApplyCta
                  category={t.slug}
                  className={`mt-5 block text-center w-full rounded-md px-3 py-2.5 text-sm font-semibold min-h-11 ${
                    featured ? "gradient-brand text-white" : "border border-[color:var(--brand-deep)] text-[color:var(--brand-deep)] hover:bg-[color:var(--brand-tint)]"
                  }`}
                >
                  Apply Now
                </ApplyCta>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <a href="#compare" className="text-sm font-semibold text-[color:var(--brand-green)]">
            Compare plans →
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 space-y-8">
        {(Object.entries(membershipCategories) as [string, (typeof membershipCategories)[keyof typeof membershipCategories]][]).map(
          ([slug, copy]) => (
            <article key={slug} id={slug} className="rounded-2xl border border-[color:var(--border)] bg-white p-6 sm:p-8">
              <h3 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">{copy.name}</h3>
              <p className="mt-3 text-sm leading-7">{copy.for}</p>
              <div className="mt-6 grid gap-8 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-green)]">
                    {slug === "corporate" ? "Suitable organisations" : "Eligibility"}
                  </p>
                  <CheckList items={[...copy.eligibility]} className="mt-3" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-green)]">Benefits</p>
                  <CheckList items={[...copy.benefits]} className="mt-3" />
                </div>
              </div>
              <ApplyCta category={slug} className="mt-6 inline-block rounded-md px-5 py-2.5 text-sm font-semibold text-white gradient-brand">
                Apply for {copy.name.replace(" Membership", "")}
              </ApplyCta>
            </article>
          ),
        )}
      </section>

      <section id="compare" className="mx-auto max-w-7xl px-6 pb-8 overflow-x-auto">
        <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)] mb-4">Compare categories</h2>
        <table className="min-w-[720px] w-full text-sm border bg-white">
          <thead>
            <tr className="bg-[color:var(--brand-tint)] text-left">
              <th className="p-3">Category</th>
              <th className="p-3">Current fee</th>
              <th className="p-3">Typical applicant</th>
            </tr>
          </thead>
          <tbody>
            {(cats.data ?? []).map((t) => (
              <tr key={t.slug} className="border-t">
                <td className="p-3 font-semibold">{t.name}</td>
                <td className="p-3">{t.currentFee ? formatNaira(t.currentFee.amountNgn) : "Set by Secretariat"}</td>
                <td className="p-3 text-[color:var(--muted-foreground)]">{t.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-[color:var(--brand-tint)]/50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">Application Process</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)]">Membership Application Process</h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl bg-white p-6 border border-[color:var(--border)]">
                <span className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-[color:var(--brand-gold)] text-white grid place-items-center font-bold text-sm">{i + 1}</span>
                <s.icon className="h-8 w-8 text-[color:var(--brand-deep)]" />
                <h3 className="mt-4 font-bold text-[color:var(--brand-deep)]">{s.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)]">Ready to join the community?</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ApplyCta
            className="inline-flex items-center gap-2 rounded-md gradient-brand px-6 py-3.5 text-sm font-semibold text-white min-h-11"
          >
            Start Application <ArrowRight className="h-4 w-4" />
          </ApplyCta>
          <Link to="/contact" className="rounded-md border-2 border-[color:var(--brand-deep)] px-6 py-3.5 text-sm font-semibold text-[color:var(--brand-deep)] min-h-11">
            Speak to Membership Support
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
