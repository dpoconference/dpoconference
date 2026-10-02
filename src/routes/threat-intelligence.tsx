import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { CheckList } from "@/components/site/CheckList";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/threat-intelligence")({
  head: () => ({
    meta: [
      { title: "Threat Intelligence and Cybersecurity Advisory Platform | Data Protection Officers Conference" },
      { name: "description", content: "Relevant cybersecurity information to support early identification and management of cybersecurity risks affecting personal data." },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["threats", user?.id],
    queryFn: () =>
      apiGet<{
        notice: string | null;
        items: { id: string; title: string; severity: string; summary: string; iocMd: string; iocHidden: boolean }[];
      }>(user ? "/portal/threats" : "/public/threats"),
  });
  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Threat Intelligence"
        title="Threat Intelligence and Cybersecurity Advisory Platform"
        subtitle="Privacy governance and cybersecurity are closely connected. A personal data breach may result from phishing, ransomware, system vulnerabilities, insider threats, malware or third-party compromise."
      />
      <section className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <p className="text-[15px] leading-7">
          The Data Protection Officers Conference Threat Intelligence Platform provides members with relevant information to support early identification and
          management of cybersecurity risks.
        </p>
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="font-extrabold text-[color:var(--brand-deep)]">Platform Content</h2>
          <p className="mt-2 text-sm">Members will receive:</p>
          <CheckList
            className="mt-3"
            items={[
              "Cybersecurity alerts",
              "Vulnerability advisories",
              "Phishing warnings",
              "Ransomware updates",
              "Malware intelligence",
              "Sector-specific security bulletins",
              "Data breach trends",
              "Threat actor information",
              "Indicators of compromise",
              "Recommended mitigation actions",
            ]}
          />
        </div>
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-7">
          <p className="font-semibold">Important Notice</p>
          <p className="mt-2">
            Threat intelligence provided through the platform is intended solely for lawful, defensive, professional and risk
            management purposes. Access to sensitive technical information may be restricted based on membership category and user
            role.
          </p>
        </div>
        {q.data?.notice && <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">{q.data.notice}</p>}
        {!user && (
          <p className="text-sm">
            <Link to="/login" search={{ redirect: "/threat-intelligence" }} className="font-semibold underline">
              Sign in
            </Link>{" "}
            to see your membership access level.
          </p>
        )}
        {(q.data?.items ?? []).map((t) => (
          <article key={t.id} className="rounded-2xl border bg-white p-6">
            <p className="text-xs font-bold uppercase">{t.severity}</p>
            <h3 className="mt-2 font-bold">{t.title}</h3>
            <p className="mt-2 text-sm">{t.summary}</p>
            {t.iocHidden ? (
              <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">IoC table hidden for your membership tier.</p>
            ) : (
              t.iocMd && <pre className="mt-3 overflow-x-auto rounded-md bg-[color:var(--muted)] p-3 text-xs">{t.iocMd}</pre>
            )}
          </article>
        ))}
      </section>
    </SiteLayout>
  );
}
