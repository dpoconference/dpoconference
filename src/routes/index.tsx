import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Users, GraduationCap, Award, Scale, Compass, Network, Calendar, MapPin, CheckCircle2, Sparkles, BookOpen, Briefcase, Building2, Star } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import hero from "@/assets/hero.jpg";
import conferenceImg from "@/assets/conference.jpg";
import trainingImg from "@/assets/training.jpg";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { cmsSection, useCmsPage } from "@/lib/cms";
import { formatConferenceDates, formatNaira } from "@/lib/format";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DPO Conference | Professional Network for Data Protection Officers in Africa" },
      { name: "description", content: "Africa's year-round professional network, conference and leadership platform for Data Protection Officers, privacy professionals and data-governance leaders." },
      { property: "og:title", content: "DPO Conference | Professional Network for Data Protection Officers in Africa" },
      { property: "og:description", content: "Africa's year-round professional network, conference and leadership platform for Data Protection Officers, privacy professionals and data-governance leaders." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteLayout>
      <Hero />
      <PartnersStrip />
      <WhyMatters />
      <CoreBenefits />
      <MembershipTiers />
      <ConferenceSpotlight />
      <TrainingSection />
      <Sectors />
      <Insights />
      <Testimonials />
      <Newsletter />
      <FinalCTA />
    </SiteLayout>
  );
}

function Hero() {
  const cms = useCmsPage("home");
  const heroCms = cmsSection(cms.data, "hero");
  const eyebrow = (heroCms?.eyebrow as string) || "Africa's Professional Community for Data Protection Officers";
  const headline =
    heroCms?.headline || "Strengthening the professionals who protect trust, privacy and data.";
  const subhead =
    heroCms?.subhead ||
    "DPO Conference is a year-round professional network, leadership forum and conference platform advancing the competence, effectiveness and influence of Data Protection Officers in Nigeria, Africa and the global privacy ecosystem.";
  const ctaLabel = heroCms?.ctaLabel || "Register for the Conference";
  const ctaHref = heroCms?.ctaHref || "/conferences";
  const secondaryCtaLabel = (heroCms?.secondaryCtaLabel as string) || "Become a Member";
  const secondaryCtaHref = (heroCms?.secondaryCtaHref as string) || "/membership";

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl" style={{background: "radial-gradient(circle, #11A36A, transparent 70%)"}}/>
      <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl" style={{background: "radial-gradient(circle, #063F2E, transparent 70%)"}}/>
      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-tint)] px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-deep)]">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--brand-emerald)]"/>
            {eyebrow}
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] text-[color:var(--brand-deep)]">
            {headline.includes("trust, privacy and data") ? (
              <>
                Strengthening the professionals who protect{" "}
                <span className="text-gradient-brand">trust, privacy and data.</span>
              </>
            ) : (
              headline
            )}
          </h1>
          <p className="mt-6 text-lg text-[color:var(--muted-foreground)] max-w-xl leading-relaxed">{subhead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={ctaHref} className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold text-white gradient-brand  hover:opacity-95">
              {ctaLabel} <ArrowRight className="h-4 w-4"/>
            </a>
            <a href={secondaryCtaHref} className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold border-2 border-[color:var(--brand-deep)] text-[color:var(--brand-deep)] hover:bg-[color:var(--brand-tint)]">
              {secondaryCtaLabel}
            </a>
            <Link to="/benefits" className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold border-2 border-[color:var(--brand-green)] text-[color:var(--brand-green)] hover:bg-[color:var(--brand-tint)]">
              Explore Member Benefits
            </Link>
            <Link to="/training" className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold text-[color:var(--brand-green)] hover:text-[color:var(--brand-deep)]">
              Explore Training →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
            {["Professional Community","Quarterly Training","CPD Credits","Regulatory Engagement","Sector Networks"].map(t => (
              <div key={t} className="flex items-start gap-1.5"><CheckCircle2 className="h-4 w-4 text-[color:var(--brand-emerald)] shrink-0 mt-0.5"/><span className="text-[color:var(--foreground)] font-medium">{t}</span></div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="relative rounded-2xl overflow-hidden ">
            <img src={hero} alt="African data protection professionals at DPO Conference" width={1600} height={1200} className="w-full h-64 sm:h-80 lg:h-[520px] object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--brand-deep)]/50 via-transparent to-transparent"/>
          </div>
          <div className="hidden md:block absolute -left-8 top-10 bg-white rounded-xl  p-5 w-64 border border-[color:var(--border)]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg gradient-brand grid place-items-center text-white"><Users className="h-5 w-5"/></div>
              <div>
                <p className="text-xs text-[color:var(--muted-foreground)]">Community</p>
                <p className="font-bold text-[color:var(--brand-deep)]">DPO Network</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[color:var(--muted-foreground)]">Peer roundtables, mentorship, and sector working groups across Africa.</p>
          </div>
          <div className="hidden md:block absolute -right-6 bottom-8 bg-white rounded-xl  p-5 w-64 border border-[color:var(--border)]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[color:var(--brand-gold)] grid place-items-center text-white"><Calendar className="h-5 w-5"/></div>
              <div>
                <p className="text-xs text-[color:var(--muted-foreground)]">Flagship Event</p>
                <p className="font-bold text-[color:var(--brand-deep)]">Conference 2026</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[color:var(--muted-foreground)]">Registration is now open — early-bird rates available.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnersStrip() {
  const items = ["Regulators", "Professional Institutions", "Corporate Partners", "Training Partners", "Academic Institutions", "Development Organisations"];
  return (
    <section className="border-y border-[color:var(--border)] bg-[color:var(--muted)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-center text-xs uppercase tracking-widest text-[color:var(--muted-foreground)]">Connecting professionals, regulators, institutions and industry leaders</p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map(i => (
            <div key={i} className="text-center text-sm font-semibold text-[color:var(--brand-deep)]/70 border border-dashed border-[color:var(--border)] rounded-lg py-4 bg-white/50">{i}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyMatters() {
  const cards = [
    { icon: Scale, title: "Growing Regulatory Responsibility", body: "DPOs interpret regulations, guide leadership and establish accountable privacy practices across the enterprise." },
    { icon: Sparkles, title: "Rapid Technology Change", body: "Artificial intelligence, cloud computing, cybersecurity risks and digital platforms continue to expand DPO responsibilities." },
    { icon: Network, title: "Need for Professional Community", body: "Professionals require trusted peer networks, continuous learning and access to practical guidance." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-14 items-center">
      <div className="relative">
        <div className="rounded-2xl overflow-hidden ">
          <img src={trainingImg} alt="DPO professionals collaborating" width={1200} height={900} loading="lazy" className="w-full h-[460px] object-cover"/>
        </div>
        <div className="static mt-4 sm:absolute sm:-bottom-6 sm:-right-6 bg-[color:var(--brand-deep)] text-white p-6 rounded-2xl max-w-xs ">
          <p className="text-3xl font-extrabold text-[color:var(--brand-gold)]">5</p>
          <p className="text-sm">Strategic pillars advancing privacy leadership across Africa.</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">Why DPO Conference Matters</p>
        <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)]">A professional platform built for a defining moment in privacy.</h2>
        <p className="mt-4 text-[color:var(--muted-foreground)] leading-relaxed">The role of the Data Protection Officer has never been more strategic — or more demanding. DPO Conference connects the practitioners shaping how organisations, regulators and societies handle personal data.</p>
        <div className="mt-8 space-y-4">
          {cards.map(c => (
            <div key={c.title} className="flex gap-4 p-5 rounded-xl border border-[color:var(--border)] bg-white  transition-">
              <div className="h-11 w-11 rounded-lg bg-[color:var(--brand-tint)] grid place-items-center text-[color:var(--brand-deep)] shrink-0"><c.icon className="h-5 w-5"/></div>
              <div>
                <h3 className="font-bold text-[color:var(--brand-deep)]">{c.title}</h3>
                <p className="text-sm text-[color:var(--muted-foreground)] mt-1">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoreBenefits() {
  const cards = [
    { icon: Users, title: "Professional Community", body: "Peer network of DPOs, privacy leaders and compliance professionals." },
    { icon: GraduationCap, title: "Quarterly Professional Training", body: "Practical workshops led by experienced privacy practitioners." },
    { icon: Award, title: "Continuing Professional Development", body: "Structured CPD credits, evidence and certification." },
    { icon: BookOpen, title: "Regulatory Intelligence", body: "Timely updates, guidance notes and jurisdiction-specific insights." },
    { icon: Compass, title: "Leadership Development", body: "Programmes designed for the next generation of privacy leaders." },
    { icon: Network, title: "Sector-Based Collaboration", body: "Dedicated working groups across finance, health, tech and public sector." },
  ];
  return (
    <section className="bg-[color:var(--brand-tint)]/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">What you gain</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)]">Everything a modern DPO needs — in one professional home.</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(c => (
            <div key={c.title} className="group p-7 rounded-2xl bg-white border border-[color:var(--border)] hover:border-[color:var(--brand-emerald)]  transition-all">
              <div className="h-12 w-12 rounded-xl gradient-brand grid place-items-center text-white mb-5"><c.icon className="h-6 w-6"/></div>
              <h3 className="font-bold text-lg text-[color:var(--brand-deep)]">{c.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)] leading-relaxed">{c.body}</p>
              <Link to="/benefits" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--brand-green)] group-hover:gap-2 transition-all">Learn more <ArrowRight className="h-3.5 w-3.5"/></Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MembershipTiers() {
  const tiers = [
    { name: "Student", for: "Students & aspiring privacy professionals", featured: false },
    { name: "Associate", for: "Early-career practitioners building competence", featured: false },
    { name: "Professional", for: "Certified & practising DPOs", featured: true, badge: "Most Popular" },
    { name: "Fellow", for: "Senior privacy leaders & contributors", featured: false, gold: true },
    { name: "Corporate", for: "Organisations & team memberships", featured: false },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">Membership</p>
        <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)]">Choose the category that matches your journey.</h2>
        <p className="mt-4 text-[color:var(--muted-foreground)]">Five membership categories designed for every stage of a privacy career — from student to fellow.</p>
      </div>
      <div className="mt-12 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {tiers.map(t => (
          <div key={t.name} className={`relative rounded-2xl p-6 border-2 bg-white transition-all ${t.featured ? "border-[color:var(--brand-emerald)]  lg:-translate-y-3" : t.gold ? "border-[color:var(--brand-gold)]" : "border-[color:var(--border)]"}`}>
            {t.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[color:var(--brand-emerald)] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{t.badge}</span>}
            {t.gold && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[color:var(--brand-gold)] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Distinguished</span>}
            <h3 className="text-xl font-extrabold text-[color:var(--brand-deep)]">{t.name}</h3>
            <p className="mt-2 text-xs text-[color:var(--muted-foreground)] min-h-[48px]">{t.for}</p>
            <div className="mt-4 py-3 border-y border-[color:var(--border)]">
              <p className="text-xs text-[color:var(--muted-foreground)]">Annual fee</p>
              <p className="text-lg font-bold text-[color:var(--brand-deep)]">On application</p>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-[color:var(--foreground)]">
              {["Member directory", "Training access", "CPD credits", "Conference discount"].map(b => (
                <li key={b} className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--brand-emerald)] shrink-0 mt-0.5"/>{b}</li>
              ))}
            </ul>
            <Link
              to="/register"
              search={{ redirect: "/portal/apply", category: t.name.toLowerCase() }}
              className={`mt-5 block text-center rounded-md px-3 py-2.5 text-sm font-semibold ${t.featured ? "gradient-brand text-white" : "border border-[color:var(--brand-deep)] text-[color:var(--brand-deep)] hover:bg-[color:var(--brand-tint)]"}`}
            >
              Apply Now
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConferenceSpotlight() {
  const q = useQuery({
    queryKey: ["conferences"],
    queryFn: () =>
      apiGet<
        {
          slug: string;
          title: string;
          theme?: string;
          coverUrl?: string | null;
          startsOn: string;
          endsOn: string;
          venue: string;
          city: string;
          format?: string | null;
          isFree: boolean;
          fromAmountNgn: number;
        }[]
      >("/public/conferences"),
  });

  const now = Date.now();
  const upcoming = (q.data ?? []).filter((c) => new Date(c.endsOn).getTime() >= now);
  const cards = (upcoming.length ? upcoming : q.data ?? []).slice(0, 3);
  const featured = cards[0];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-brand" />
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "radial-gradient(circle at 15% 30%, rgba(214,168,75,0.4), transparent 40%)" }}
      />
      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28 text-white">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[color:var(--brand-gold)] border border-[color:var(--brand-gold)]/50 px-3 py-1 rounded-full">
              DPO Conference
            </span>
            <h2 className="mt-5 text-4xl md:text-5xl font-extrabold leading-tight">
              The flagship gathering for Africa&apos;s privacy profession.
            </h2>
            <p className="mt-4 text-white/85 text-lg max-w-lg">
              Keynotes, workshops and cross-sector dialogue — register for upcoming conferences.
            </p>
          </div>
          <Link to="/conferences" className="text-sm font-semibold text-[color:var(--brand-gold)] hover:text-white">
            All conferences →
          </Link>
        </div>

        {q.isPending ? (
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <p className="mt-10 text-sm text-white/80">Published conferences will appear here.</p>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <article key={c.slug} className="overflow-hidden rounded-2xl border border-white/20 bg-white/5 backdrop-blur">
                <div className="aspect-video overflow-hidden">
                  <img src={c.coverUrl || conferenceImg} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wide text-white/60">{formatConferenceDates(c.startsOn, c.endsOn)}</p>
                  <h3 className="mt-2 text-lg font-bold leading-snug">{c.title}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {c.city}
                    {c.format ? ` · ${c.format}` : ""}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--brand-gold)]">
                    {c.isFree || Number(c.fromAmountNgn) === 0 ? "Free" : `From ${formatNaira(Number(c.fromAmountNgn))}`}
                  </p>
                  {c.theme ? <p className="mt-2 line-clamp-2 text-sm text-white/75">{c.theme}</p> : null}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to="/conferences/$slug/register"
                      params={{ slug: c.slug }}
                      className="rounded-md bg-[color:var(--brand-gold)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-deep)] hover:opacity-90"
                    >
                      Register
                    </Link>
                    <Link
                      to="/conferences/$slug"
                      params={{ slug: c.slug }}
                      className="rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {featured ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/conferences/$slug/register"
              params={{ slug: featured.slug }}
              className="rounded-md bg-[color:var(--brand-gold)] px-6 py-3 text-sm font-semibold text-[color:var(--brand-deep)] hover:opacity-90"
            >
              Register Now
            </Link>
            <Link
              to="/conferences/$slug"
              params={{ slug: featured.slug }}
              className="rounded-md border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              View Programme
            </Link>
            <Link to="/conference/sponsor" className="rounded-md px-6 py-3 text-sm font-semibold text-white/90 hover:text-white">
              Become a Sponsor →
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TrainingSection() {
  const q = useQuery({
    queryKey: ["home-seminars"],
    queryFn: () =>
      apiGet<{ slug: string; title: string; startsOn: string; format?: string | null; cpdPoints?: number | null }[]>(
        "/public/seminars",
      ),
  });
  const items = (q.data ?? []).slice(0, 3);
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">Training & CPD</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)] max-w-xl">Practical, accredited learning built by practitioners.</h2>
        </div>
        <Link to="/training" className="text-sm font-semibold text-[color:var(--brand-green)] hover:text-[color:var(--brand-deep)]">View training calendar →</Link>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((i) => (
          <div key={i.slug} className="rounded-2xl border border-[color:var(--border)] p-6 bg-white  transition-">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[color:var(--brand-green)] font-semibold">{i.format ?? "Training"}</span>
              {i.cpdPoints ? <span className="bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)] px-2 py-1 rounded-full font-semibold">{i.cpdPoints} CPD</span> : null}
            </div>
            <h3 className="mt-4 font-bold text-lg text-[color:var(--brand-deep)] leading-snug">{i.title}</h3>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)] flex items-center gap-1.5"><Calendar className="h-4 w-4"/>{new Date(i.startsOn).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
            <Link to="/seminars/$slug/register" params={{ slug: i.slug }} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--brand-deep)] hover:gap-2 transition-all">Register <ArrowRight className="h-3.5 w-3.5"/></Link>
          </div>
        ))}
        {!q.isPending && items.length === 0 && (
          <p className="text-sm text-[color:var(--muted-foreground)]">Upcoming programmes will appear here when published.</p>
        )}
      </div>
    </section>
  );
}

function Sectors() {
  const sectors = [
    "Financial Services", "Public Sector", "Healthcare", "Telecommunications", "Technology & Digital", "Education", "Legal & Professional", "Energy & Utilities", "Media & Marketing", "Non-Profit & Development",
  ];
  return (
    <section className="bg-[color:var(--brand-deep)] text-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[color:var(--brand-gold)] uppercase tracking-wider">Sector Communities</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold">Dedicated networks for the sectors you work in.</h2>
          <p className="mt-4 text-white/80">Join peer-led communities that share sector-specific guidance, run roundtables and shape sector-level responses to emerging regulation.</p>
        </div>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {sectors.map(s => (
            <Link to="/communities" key={s} className="group relative rounded-xl border border-white/15 p-5 hover:border-[color:var(--brand-gold)] hover:bg-white/5 transition-all">
              <Building2 className="h-6 w-6 text-[color:var(--brand-emerald)]"/>
              <p className="mt-3 font-semibold text-sm">{s}</p>
              <p className="mt-1 text-xs text-white/60 group-hover:text-[color:var(--brand-gold)]">Join community →</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Insights() {
  const q = useQuery({
    queryKey: ["home-news"],
    queryFn: () =>
      apiGet<{ slug: string; title: string; excerpt?: string; publishedOn?: string; coverUrl?: string | null }[]>(
        "/public/news",
      ),
  });
  const posts = (q.data ?? []).slice(0, 3);
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">Insights</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)]">Latest thinking from the DPO Conference network.</h2>
        </div>
        <Link to="/news" className="text-sm font-semibold text-[color:var(--brand-green)] hover:text-[color:var(--brand-deep)]">All news →</Link>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((p) => (
          <article key={p.slug} className="rounded-2xl overflow-hidden border border-[color:var(--border)] bg-white  transition-">
            <div className="h-40 gradient-brand relative overflow-hidden">
              {p.coverUrl ? (
                <img src={p.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 opacity-40" style={{backgroundImage:"radial-gradient(circle at 30% 30%, rgba(214,168,75,0.5), transparent 60%)"}}/>
              )}
              <span className="absolute top-4 left-4 bg-white/95 text-[color:var(--brand-deep)] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">News</span>
            </div>
            <div className="p-6">
              <p className="text-xs text-[color:var(--muted-foreground)]">{p.publishedOn ? new Date(p.publishedOn).toLocaleDateString("en-NG", { month: "short", year: "numeric" }) : ""}</p>
              <h3 className="mt-2 font-bold text-lg text-[color:var(--brand-deep)] leading-snug">{p.title}</h3>
              {p.excerpt ? <p className="mt-2 line-clamp-2 text-sm text-[color:var(--muted-foreground)]">{p.excerpt}</p> : null}
              <Link to="/news/$slug" params={{ slug: p.slug }} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--brand-green)]">Read insight <ArrowRight className="h-3.5 w-3.5"/></Link>
            </div>
          </article>
        ))}
        {!q.isPending && posts.length === 0 && (
          <p className="text-sm text-[color:var(--muted-foreground)]">Published articles will appear here.</p>
        )}
      </div>
    </section>
  );
}

function Testimonials() {
  const t = [
    { name: "Member", role: "Financial Services", body: "DPO Conference gave me a peer group I can actually pick up the phone to. The quarterly training is exactly what practising DPOs need." },
    { name: "Member", role: "Public Sector", body: "The sector community discussions are the most useful conversations I have all quarter — practical and unfiltered." },
    { name: "Member", role: "Technology", body: "The annual conference alone justifies membership. It's where regulators, DPOs and industry actually engage as equals." },
  ];
  return (
    <section className="bg-[color:var(--muted)] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">Members</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)]">Trusted by privacy leaders across the continent.</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {t.map(x => (
            <blockquote key={x.name} className="p-7 rounded-2xl bg-white border border-[color:var(--border)]">
              <div className="flex gap-1 text-[color:var(--brand-gold)]">
                {Array.from({length:5}).map((_,i)=><Star key={i} className="h-4 w-4 fill-current"/>)}
              </div>
              <p className="mt-4 text-[color:var(--foreground)] leading-relaxed">"{x.body}"</p>
              <footer className="mt-5 flex items-center gap-3 pt-4 border-t border-[color:var(--border)]">
                <div className="h-10 w-10 rounded-full gradient-brand grid place-items-center text-white font-bold">{x.name[0]}</div>
                <div>
                  <p className="font-bold text-sm text-[color:var(--brand-deep)]">{x.name}</p>
                  <p className="text-xs text-[color:var(--muted-foreground)]">{x.role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="rounded-3xl gradient-brand p-10 md:p-14 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 80% 20%, rgba(214,168,75,0.6), transparent 40%)"}}/>
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold">Stay informed about privacy, regulation and professional development.</h2>
            <p className="mt-3 text-white/85">Monthly briefings for DPOs, privacy leads and governance professionals.</p>
          </div>
          <form
            className="grid sm:grid-cols-2 gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                await apiPost("/public/newsletter", { email, consent: true, website: "" });
                notify.success("You are subscribed.");
                setEmail("");
              } finally {
                setLoading(false);
              }
            }}
          >
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="sm:col-span-2 rounded-md bg-white/10 border border-white/25 px-4 py-3 text-base md:text-sm placeholder:text-white/60 focus:outline-none focus:border-[color:var(--brand-gold)]"/>
            <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
            <label className="sm:col-span-2 flex items-start gap-2 text-xs text-white/80"><input type="checkbox" required className="mt-1"/> I consent to receive updates from DPO Conference.</label>
            <Button type="submit" loading={loading} className="sm:col-span-2 rounded-md bg-[color:var(--brand-gold)] text-[color:var(--brand-deep)] font-bold px-4 py-3 text-sm hover:opacity-95">Subscribe</Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 text-center">
      <h2 className="text-3xl md:text-5xl font-extrabold text-[color:var(--brand-deep)] max-w-3xl mx-auto leading-tight">Join the community shaping the future of privacy and data governance.</h2>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/conferences" className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold text-white gradient-brand ">Register for the Conference <ArrowRight className="h-4 w-4"/></Link>
        <Link to="/membership" className="rounded-md px-6 py-3.5 text-sm font-semibold border-2 border-[color:var(--brand-deep)] text-[color:var(--brand-deep)] hover:bg-[color:var(--brand-tint)]">Become a Member</Link>
        <Link to="/contact" className="rounded-md px-6 py-3.5 text-sm font-semibold text-[color:var(--brand-green)] hover:text-[color:var(--brand-deep)]">Speak with our team →</Link>
      </div>
    </section>
  );
}

void [Briefcase];
