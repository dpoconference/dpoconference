import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { CheckList } from "@/components/site/CheckList";
import { Calendar, MapPin, Users, Mic, Award, Ticket } from "lucide-react";
import conferenceImg from "@/assets/conference.jpg";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { SafeHtml } from "@/components/SafeHtml";
import { formatConferenceDates } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/conference")({
  head: () => ({
    meta: [
      { title: "Data Protection Officers Conference Annual Conference" },
      {
        name: "description",
        content:
          "The flagship gathering of Data Protection Officers, regulators, policymakers, privacy professionals, cybersecurity experts, researchers, legal practitioners and organisational leaders.",
      },
    ],
  }),
  component: ConferencePage,
});

type PublicConference = {
  slug: string;
  title: string;
  theme?: string;
  overview?: string;
  bodyHtml?: string;
  coverUrl?: string | null;
  prospectusUrl?: string | null;
  startsOn: string;
  endsOn: string;
  venue: string;
  city: string;
  format?: string | null;
};

function ConferencePage() {
  const live = useQuery({
    queryKey: ["conferences"],
    queryFn: () => apiGet<PublicConference[]>("/public/conferences"),
  });

  useEffect(() => {
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    if (!targetId || !live.data) return;

    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [live.data]);

  if (live.isPending) {
    return (
      <SiteLayout>
        <Skeleton className="h-96 w-full rounded-none" />
      </SiteLayout>
    );
  }

  const list = live.data ?? [];
  if (list.length === 0) {
    return <Navigate to="/conferences" />;
  }

  const now = Date.now();
  const upcoming = list.filter((c) => new Date(c.endsOn).getTime() >= now);
  const c = upcoming[0] ?? list[0];
  const dates = formatConferenceDates(c.startsOn, c.endsOn) || "Announced by the Secretariat";
  const heroImg = c.coverUrl || conferenceImg;
  const registerTo = "/conferences/$slug/register" as const;

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-[color:var(--brand-deep)] text-white">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--brand-deep)]/95 via-[color:var(--brand-deep)]/85 to-[color:var(--brand-green)]/70" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <p className="mb-4 text-xs uppercase tracking-widest text-[color:var(--brand-gold)]">Home / Conference</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.05] md:text-6xl">{c.title}</h1>
          <p className="mt-5 max-w-2xl text-xl text-white/85">
            {c.theme ||
              "The flagship gathering of Data Protection Officers, regulators, policymakers, privacy professionals, cybersecurity experts, researchers, legal practitioners and organisational leaders."}
          </p>
          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
            <Meta icon={Calendar} label="Dates" value={dates} />
            <Meta icon={MapPin} label="Venue" value={`${c.venue}, ${c.city}`} />
            <Meta icon={Users} label="Audience" value="National meeting point" />
            <Meta icon={Ticket} label="Format" value={c.format ?? "In person and hybrid options"} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={registerTo}
              params={{ slug: c.slug }}
              className="min-h-11 rounded-md bg-[color:var(--brand-gold)] px-6 py-3.5 font-bold text-[color:var(--brand-deep)]"
            >
              Register Now
            </Link>
            <Link to="/conference/speak" className="min-h-11 rounded-md px-6 py-3.5 font-semibold text-white/90">
              Apply to Speak
            </Link>
            {c.prospectusUrl ? (
              <a
                href={c.prospectusUrl}
                target="_blank"
                rel="noreferrer"
                className="min-h-11 rounded-md border-2 border-white/50 px-6 py-3.5 font-semibold"
              >
                Download Sponsorship Prospectus
              </a>
            ) : (
              <Link to="/conference/sponsor" className="min-h-11 rounded-md border-2 border-white/50 px-6 py-3.5 font-semibold">
                Download Sponsorship Prospectus
              </Link>
            )}
            <Link to="/conferences" className="min-h-11 rounded-md px-6 py-3.5 text-sm font-semibold text-white/80 underline-offset-4 hover:underline">
              All conferences
            </Link>
          </div>
        </div>
      </section>

      <section id="overview" className="scroll-mt-40 mx-auto max-w-4xl px-6 py-16 text-[15px] leading-7">
        <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Conference Overview</h2>
        {c.bodyHtml?.trim() ? (
          <div className="mt-4">
            <SafeHtml html={c.bodyHtml} />
          </div>
        ) : (
          <p className="mt-4">
            {c.overview ||
              "The conference provides a platform for regulatory engagement, professional networking, knowledge sharing, research presentation and discussion of emerging issues affecting privacy and data governance."}
          </p>
        )}
      </section>

      <section id="why-attend" className="scroll-mt-40 bg-[color:var(--brand-tint)]/50 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Why Attend?</h2>
            <p className="mt-3 text-sm">Participants will:</p>
            <CheckList
              className="mt-4"
              items={[
                "Engage with regulators and industry leaders",
                "Receive practical compliance guidance",
                "Learn about emerging privacy and technology risks",
                "Build professional relationships",
                "Earn CPD credits",
                "Access research and professional resources",
                "Participate in technical workshops",
                "Discover career and partnership opportunities",
                "Celebrate professional excellence",
              ]}
            />
          </div>
          <div id="who-should-attend" className="scroll-mt-40">
            <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Who Should Attend?</h2>
            <CheckList
              className="mt-4"
              items={[
                "Data Protection Officers",
                "Privacy professionals",
                "Compliance officers",
                "Legal practitioners",
                "Cybersecurity professionals",
                "Risk managers",
                "Internal auditors",
                "Researchers",
                "Government officials",
                "Technology leaders",
                "Chief Information Security Officers",
                "Chief Risk Officers",
                "Board members",
                "Executive management",
                "DPCOs",
                "Students and aspiring privacy professionals",
              ]}
            />
          </div>
        </div>
      </section>

      <section id="themes" className="scroll-mt-40 mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--brand-green)]">Conference Themes</p>
        <h2 className="mt-3 text-3xl font-extrabold text-[color:var(--brand-deep)]">Topics may include:</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            "Artificial intelligence governance and accountability",
            "Privacy and emerging technologies",
            "Cybersecurity and data protection",
            "Cross-border data transfers",
            "Privacy engineering",
            "Data breach management",
            "Digital identity governance",
            "Data ethics",
            "Vendor risk management",
            "Children’s privacy",
            "Data governance",
            "The future of the DPO profession",
          ].map((t) => (
            <div key={t} className="rounded-xl border border-[color:var(--border)] bg-white p-5">
              <Mic className="h-4 w-4 text-[color:var(--brand-green)]" />
              <p className="mt-3 font-bold text-[color:var(--brand-deep)]">{t}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="activities" className="scroll-mt-40 bg-[color:var(--muted)] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Conference Activities</h2>
          <CheckList
            className="mt-6 grid gap-2 sm:grid-cols-2"
            items={[
              "Keynote addresses",
              "Regulatory sessions",
              "Panel discussions",
              "Technical workshops",
              "Research presentations",
              "Sector roundtables",
              "Leadership sessions",
              "Exhibitions",
              "Networking sessions",
              "Professional awards",
              "Closing communique",
            ]}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 grid gap-10 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-8">
          <h2 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Speaker Invitation</h2>
          <p className="mt-3 text-sm leading-7">
            Data Protection Officers Conference welcomes experienced professionals, researchers, regulators and industry leaders who wish to share practical
            knowledge and thought leadership. Prospective speakers may submit a presentation title, abstract, professional profile,
            learning objectives and supporting materials.
          </p>
          <Link to="/conference/speak" className="mt-6 inline-block rounded-md px-5 py-2.5 text-sm font-semibold text-white gradient-brand">
            Apply to Speak
          </Link>
        </div>
        <div className="rounded-2xl border bg-white p-8">
          <Award className="h-6 w-6 text-[color:var(--brand-gold)]" />
          <h2 className="mt-3 text-2xl font-extrabold text-[color:var(--brand-deep)]">Sponsorship and Exhibition</h2>
          <p className="mt-3 text-sm leading-7">
            Organisations can increase their visibility and demonstrate commitment to privacy, digital trust and professional
            development through sponsorship and exhibition opportunities.
          </p>
          <p className="mt-3 text-sm font-semibold">Sponsorship benefits may include:</p>
          <CheckList
            className="mt-3"
            items={[
              "Brand visibility",
              "Exhibition space",
              "Speaking opportunities",
              "Complimentary registrations",
              "Digital promotion",
              "Access to professional audiences",
              "Recognition in conference publications",
            ]}
          />
          {c.prospectusUrl ? (
            <a
              href={c.prospectusUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block text-sm font-semibold text-[color:var(--brand-green)]"
            >
              Download Sponsorship Prospectus
            </a>
          ) : (
            <Link to="/conference/sponsor" className="mt-6 inline-block text-sm font-semibold text-[color:var(--brand-green)]">
              Download Sponsorship Prospectus
            </Link>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/25 bg-white/5 p-4 backdrop-blur">
      <Icon className="h-4 w-4 text-[color:var(--brand-gold)]" />
      <p className="mt-2 text-xs uppercase text-white/60">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
