import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { CheckList } from "@/components/site/CheckList";
import { cmsSection, useCmsPage } from "@/lib/cms";

export const Route = createFileRoute("/benefits")({
  head: () => ({
    meta: [
      { title: "Membership Benefits | DPO Conference" },
      { name: "description", content: "Professional networking, threat intelligence, quarterly training, CPD, regulatory intelligence, resources, careers, mentorship and recognition." },
    ],
  }),
  component: Page,
});

const sections = [
  {
    title: "Professional Networking",
    body: "Connect with Data Protection Officers, privacy professionals, cybersecurity experts, legal practitioners, researchers, regulators and industry leaders. Members can participate in sector communities, professional discussions, working groups and national events.",
  },
  {
    title: "Threat Intelligence Platform",
    body: "Members receive access to timely cybersecurity information and advisories designed to support proactive risk management. The platform may provide:",
    items: [
      "Emerging cyber threat updates",
      "Vulnerability advisories",
      "Ransomware and malware alerts",
      "Phishing and fraud intelligence",
      "Industry-specific security warnings",
      "Threat actor information",
      "Indicators of compromise",
      "Dark web monitoring reports",
      "Security bulletins",
      "Recommended mitigation measures",
    ],
  },
  {
    title: "Quarterly Professional Training",
    body: "Members receive four instructor-led professional training programmes every year. These programmes help members remain current with:",
    items: [
      "Regulatory developments",
      "Emerging technologies",
      "Industry trends",
      "Artificial intelligence governance",
      "Cybersecurity and privacy risks",
      "Practical compliance requirements",
    ],
  },
  {
    title: "Continuing Professional Development",
    body: "Members earn CPD credits through approved activities, including:",
    items: [
      "Annual conferences",
      "Quarterly training programmes",
      "Webinars",
      "Workshops",
      "Publications",
      "Research",
      "Professional presentations",
      "Mentorship",
      "Committee participation",
    ],
    extra: "Members can monitor their CPD progress through their portal dashboard.",
  },
  {
    title: "Regulatory Intelligence",
    body: "Members receive updates on:",
    items: [
      "The Nigeria Data Protection Act 2023",
      "Regulatory directives",
      "Implementation guidance",
      "Enforcement trends",
      "International privacy laws",
      "Cross-border data transfer developments",
      "Emerging compliance obligations",
    ],
  },
  {
    title: "Resource Library",
    body: "Members gain access to practical resources, including:",
    items: [
      "Privacy policies",
      "Governance frameworks",
      "Compliance checklists",
      "DPIA templates",
      "DSAR templates",
      "Consent forms",
      "Breach management procedures",
      "Vendor assessment tools",
      "AI governance frameworks",
      "Privacy engineering guides",
      "Risk assessment resources",
    ],
  },
  {
    title: "Career Development",
    body: "Members gain access to:",
    items: [
      "Data Protection Officer vacancies",
      "Privacy analyst positions",
      "Compliance opportunities",
      "Data governance roles",
      "Consultancy engagements",
      "Internship opportunities",
      "International career openings",
      "Professional leadership programmes",
    ],
  },
  {
    title: "Mentorship",
    body: "The mentorship programme connects members with experienced professionals in areas including:",
    items: [
      "Privacy programme development",
      "Regulatory engagement",
      "Compliance audits",
      "Career advancement",
      "Leadership development",
      "Certification preparation",
      "DPIAs",
      "Incident response",
      "Board and executive reporting",
    ],
  },
  {
    title: "Global Networking",
    body: "Members may participate in:",
    items: [
      "International webinars",
      "Global privacy forums",
      "Joint learning programmes",
      "Research collaborations",
      "International conferences",
      "Professional exchange programmes",
    ],
  },
  {
    title: "Professional Recognition",
    body: "Members may:",
    items: [
      "Present conference papers",
      "Publish professional articles",
      "Join panel discussions",
      "Lead working groups",
      "Participate in industry research",
      "Receive professional awards",
      "Contribute to policy discussions",
    ],
  },
];

function Page() {
  const cms = useCmsPage("benefits");
  const hero = cmsSection(cms.data, "hero");
  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Membership / Benefits"
        eyebrow="Membership Benefits"
        title={hero?.headline || "Membership Benefits"}
        subtitle={
          hero?.subhead ||
          "Year-round professional learning, networking, mentorship, CPD, regulatory updates, resources, career opportunities and the annual national conference."
        }
      />
      <section className="mx-auto max-w-4xl space-y-8 px-6 py-16">
        {sections.map((s) => (
          <article key={s.title} className="rounded-2xl border border-[color:var(--border)] bg-white p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-[color:var(--brand-deep)]">{s.title}</h2>
            <p className="mt-3 text-sm leading-7">{s.body}</p>
            {s.items && <CheckList items={s.items} className="mt-4" />}
            {s.extra && <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">{s.extra}</p>}
          </article>
        ))}
        <Link
          to="/register"
          search={{ redirect: "/portal/apply" }}
          className="inline-block rounded-md px-6 py-3 font-semibold text-white gradient-brand"
        >
          Become a Member
        </Link>
      </section>
    </SiteLayout>
  );
}
