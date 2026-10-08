import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { CheckList } from "@/components/site/CheckList";
import { Target, Compass, Users, GraduationCap, Sparkles, Shield, Award, BookOpen, CalendarDays } from "lucide-react";
import { cmsSection, useCmsPage } from "@/lib/cms";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Data Protection Officers Conference" },
      {
        name: "description",
        content:
          "The Data Protection Officers Conference brings privacy professionals together for practical events and continuing learning.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const cms = useCmsPage("about");
  const hero = cmsSection(cms.data, "hero");
  const pillars = [
    { icon: CalendarDays, title: "Conferences and seminars" },
    { icon: GraduationCap, title: "Practical professional learning" },
    { icon: Award, title: "Attendance-based CPD" },
    { icon: BookOpen, title: "Free and paid courses" },
    { icon: Users, title: "Professional connections" },
    { icon: Shield, title: "Regulatory engagement" },
    { icon: Compass, title: "Leadership and good practice" },
    { icon: Sparkles, title: "Research and innovation" },
    { icon: Target, title: "Ethics and accountability" },
  ];

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / About"
        eyebrow={(hero?.eyebrow as string) || "About Data Protection Officers Conference"}
        title={hero?.headline || "About Data Protection Officers Conference"}
        subtitle={
          hero?.subhead ||
          "A conference and learning platform bringing together Data Protection Officers and privacy professionals to share practical knowledge, build connections and continue learning."
        }
      />

      <section className="mx-auto max-w-4xl px-6 py-16 space-y-4 text-[15px] leading-7">
        <p>
          The Data Protection Officers Conference brings together Data Protection Officers, privacy professionals and leaders
          responsible for protecting personal data and building digital trust.
        </p>
        <p>
          Alongside its conferences and seminars, the platform offers continuing-learning courses, attendance-based CPD and
          certificates to support participants beyond each event.
        </p>
        <p>Our focus is practical learning, meaningful dialogue and professional growth through events and accessible learning programmes.</p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-[color:var(--brand-emerald)] bg-[color:var(--brand-tint)] p-8">
          <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Our Vision</h2>
          <p className="mt-3 leading-relaxed">
            To convene a leading conference and learning platform for privacy professionals, advancing excellence, accountability
            and trust in data protection and governance.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[color:var(--brand-deep)] bg-white p-8">
          <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Our Mission</h2>
          <p className="mt-3 leading-relaxed">
            To strengthen professional practice through high-quality conferences, seminars and continuing learning for people
            responsible for data protection and privacy.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Our Objectives</h2>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">Data Protection Officers Conference seeks to:</p>
        <div className="mt-6 max-w-3xl">
          <CheckList
            items={[
              "Deliver practical conferences and seminars for Data Protection Officers and privacy professionals.",
              "Make free and paid continuing-learning courses available beyond the conference.",
              "Strengthen the practical implementation of data protection requirements.",
              "Facilitate engagement between regulators and practitioners.",
              "Support practical research and knowledge sharing.",
              "Promote responsible artificial intelligence and digital governance.",
              "Award configured CPD points for verified event attendance.",
              "Provide certificates for eligible completed learning.",
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
                  "Limited access to practical guidance",
                  "Rapid regulatory and technological changes",
                  "Limited international exposure",
                  "Difficulty communicating privacy risks to senior management",
                ]}
              />
            </div>
            <p className="mt-4 text-sm">            Our conferences, seminars and courses create practical opportunities to address these challenges.</p>
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
        <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Take part in the conference and keep learning</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/conferences" className="rounded-md px-6 py-3.5 text-sm font-semibold text-white gradient-brand">
            Explore conferences
          </Link>
          <Link to="/courses" className="rounded-md border-2 border-[color:var(--brand-deep)] px-6 py-3.5 text-sm font-semibold text-[color:var(--brand-deep)]">
            Browse courses
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
