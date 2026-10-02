import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { CheckList } from "@/components/site/CheckList";
import { Target, HeartHandshake, Compass, Users, GraduationCap, Sparkles, Shield, Award, Network } from "lucide-react";
import { cmsSection, useCmsPage } from "@/lib/cms";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Data Protection Officers Conference" },
      {
        name: "description",
        content:
          "The Data Protection Officers Conference, Professional Network and Leadership Forum strengthens the competence, effectiveness and professional standing of Data Protection Officers.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const cms = useCmsPage("about");
  const hero = cmsSection(cms.data, "hero");
  const pillars = [
    { icon: GraduationCap, title: "Professional capacity development" },
    { icon: Shield, title: "Regulatory engagement" },
    { icon: Users, title: "Networking and collaboration" },
    { icon: Compass, title: "Leadership development" },
    { icon: Sparkles, title: "Research and innovation" },
    { icon: Award, title: "Continuing professional development" },
    { icon: Network, title: "Career advancement" },
    { icon: HeartHandshake, title: "International partnerships" },
    { icon: Target, title: "Professional ethics and accountability" },
  ];

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / About"
        eyebrow={(hero?.eyebrow as string) || "About Data Protection Officers Conference"}
        title={hero?.headline || "About Data Protection Officers Conference"}
        subtitle={
          hero?.subhead ||
          "A year-round professional platform established to strengthen the competence, effectiveness, leadership capacity and professional standing of Data Protection Officers."
        }
      />

      <section className="mx-auto max-w-4xl px-6 py-16 space-y-4 text-[15px] leading-7">
        <p>
          The Data Protection Officers Conference, Professional Network and Leadership Forum is a year-round professional
          platform established to strengthen the competence, effectiveness, leadership capacity and professional standing of Data
          Protection Officers.
        </p>
        <p>
          Data Protection Officers Conference combines an annual flagship conference with continuous professional development, mentorship, networking,
          research, career opportunities, regulatory engagement and access to practical professional resources.
        </p>
        <p>The initiative is designed to support Data Protection Officers and other privacy professionals throughout their professional journey.</p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-[color:var(--brand-emerald)] bg-[color:var(--brand-tint)] p-8">
          <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Our Vision</h2>
          <p className="mt-3 leading-relaxed">
            To establish the largest and most respected professional community for Data Protection Officers in Africa, promoting
            excellence, accountability, innovation and leadership in privacy and data governance.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[color:var(--brand-deep)] bg-white p-8">
          <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Our Mission</h2>
          <p className="mt-3 leading-relaxed">
            To strengthen the competence, effectiveness and professional standing of Data Protection Officers through continuous
            learning, networking, mentorship, collaboration, research, leadership development and global engagement.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Our Objectives</h2>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">Data Protection Officers Conference seeks to:</p>
        <div className="mt-6 max-w-3xl">
          <CheckList
            items={[
              "Build a strong and sustainable professional community for Data Protection Officers.",
              "Promote continuous learning and professional development.",
              "Strengthen the practical implementation of data protection requirements.",
              "Improve leadership and strategic communication capabilities.",
              "Facilitate engagement between regulators and practitioners.",
              "Support privacy research and innovation.",
              "Create mentorship and career advancement opportunities.",
              "Promote responsible artificial intelligence and digital governance.",
              "Strengthen Nigeria’s position within the African and global privacy ecosystem.",
            ]}
          />
        </div>
      </section>

      <section className="bg-[color:var(--muted)] py-16">
        <div className="mx-auto max-w-7xl px-6 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">The Professional Challenge</h2>
            <p className="mt-4 text-sm leading-7">
              The responsibilities of Data Protection Officers continue to increase as organisations adopt artificial intelligence,
              cloud systems, digital identity platforms, financial technologies and data-driven business models.
            </p>
            <p className="mt-3 text-sm font-semibold">However, many Data Protection Officers still face:</p>
            <div className="mt-4">
              <CheckList
                items={[
                  "Professional isolation",
                  "Limited access to practical guidance",
                  "Rapid regulatory and technological changes",
                  "Limited mentorship opportunities",
                  "Inadequate career development structures",
                  "Limited international exposure",
                  "Difficulty communicating privacy risks to senior management",
                ]}
              />
            </div>
            <p className="mt-4 text-sm">Data Protection Officers Conference provides the professional structure required to address these challenges.</p>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Expected National Impact</h2>
            <p className="mt-4 text-sm">Data Protection Officers Conference will contribute to:</p>
            <div className="mt-4">
              <CheckList
                items={[
                  "Stronger implementation of the Nigeria Data Protection Act 2023",
                  "Better-trained Data Protection Officers",
                  "Improved privacy governance within organisations",
                  "Higher-quality compliance audit returns",
                  "Better Data Protection Impact Assessments",
                  "Stronger breach management and incident response",
                  "Greater regulatory awareness",
                  "Increased public trust",
                  "Improved national privacy maturity",
                  "Stronger digital trust across the economy",
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="pillars" className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--brand-green)]">Our Strategic Pillars</p>
        <h2 className="mt-3 text-3xl font-extrabold text-[color:var(--brand-deep)]">Our programmes are built around:</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-2xl border border-[color:var(--border)] bg-white p-6">
              <p.icon className="h-6 w-6 text-[color:var(--brand-green)]" />
              <p className="mt-3 font-bold text-[color:var(--brand-deep)]">{p.title}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 text-center">
        <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Join the professional community</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/membership" className="rounded-md px-6 py-3.5 text-sm font-semibold text-white gradient-brand">
            Join Data Protection Officers Conference
          </Link>
          <Link to="/partnerships" className="rounded-md border-2 border-[color:var(--brand-deep)] px-6 py-3.5 text-sm font-semibold text-[color:var(--brand-deep)]">
            Partner With Us
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
