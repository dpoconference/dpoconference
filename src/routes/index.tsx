import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  GraduationCap,
  Award,
  Scale,
  Compass,
  Network,
  Calendar,
  MapPin,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Briefcase,
  Building2,
} from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { cmsSection, useCmsPage } from "@/lib/cms";
import { formatConferenceDateLabel, formatNaira } from "@/lib/format";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";

const DEFAULT_HERO_HEADLINE = "Join the people shaping data protection and privacy.";
const BOARD_IMAGE = "https://res.cloudinary.com/o00thbsd/image/upload/v1790941351/board.png";
const COMMISSIONER_IMAGE = "https://res.cloudinary.com/o00thbsd/image/upload/v1790937623/nc.jpg";
const CONFERENCE_SPOTLIGHT_IMAGE =
  "https://res.cloudinary.com/o00thbsd/image/upload/v1791120794/photo_2026-10-04_14-24-55.jpg";

const HERO_HEADLINES = [
  { text: "Strengthening the professionals who protect trust.", tone: "hero-phrase--emerald" },
  { text: "Championing professionals who safeguard privacy.", tone: "hero-phrase--gold" },
  { text: "Empowering leaders to protect people and data.", tone: "hero-phrase--navy" },
] as const;

const HERO_METRICS = [
  { value: 9, suffix: "", label: "Strategic pillars advancing privacy leadership across Africa" },
  { value: 4, suffix: "×", label: "training cycles / year" },
  { value: 1, suffix: "", label: "flagship conference" },
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "DPO Conference | Data Protection, Privacy and Learning",
      },
      {
        name: "description",
        content:
          "Discover the DPO Conference: practical programme sessions, expert speakers, professional learning and registration for data protection and privacy leaders.",
      },
      {
        property: "og:title",
        content: "DPO Conference | Data Protection, Privacy and Learning",
      },
      {
        property: "og:description",
        content:
          "Discover the DPO Conference: practical programme sessions, expert speakers, professional learning and registration for data protection and privacy leaders.",
      },
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
      <ConferenceSpotlight />
      <LearningSpotlight />
      <Insights />
      <Newsletter />
      <FinalCTA />
    </SiteLayout>
  );
}

function Hero() {
  const cms = useCmsPage("home");
  const heroCms = cmsSection(cms.data, "hero");
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [typedLength, setTypedLength] = useState(HERO_HEADLINES[0].text.length);
  const [isDeleting, setIsDeleting] = useState(false);
  const eyebrow =
    (heroCms?.eyebrow as string) || "DPO Conference · Practical learning · Professional connection";
  const headline = heroCms?.headline || DEFAULT_HERO_HEADLINE;
  const usesTypewriter = headline === DEFAULT_HERO_HEADLINE;
  const subhead =
    heroCms?.subhead ||
    "Discover the conference programme, meet privacy and data protection leaders, and register for practical learning, cross-sector dialogue and professional development.";
  const configuredCtaHref = (heroCms?.ctaHref as string | undefined) || "/conferences";
  const configuredCtaLabel = (heroCms?.ctaLabel as string | undefined) || "";
  const ctaPointsToLegacyFlow =
    /^\/(membership|register|login)(\/|$)/.test(configuredCtaHref) ||
    /membership|sign[\s-]?in|sign[\s-]?up|create account/i.test(configuredCtaLabel);
  const ctaLabel = ctaPointsToLegacyFlow
    ? "Register for the Conference"
    : configuredCtaLabel || "Register for the Conference";
  const ctaHref = ctaPointsToLegacyFlow ? "/conferences" : configuredCtaHref;

  useEffect(() => {
    if (!usesTypewriter) return;

    const phrase = HERO_HEADLINES[headlineIndex].text;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedLength(phrase.length);
      setIsDeleting(false);
      return;
    }

    const finishedTyping = typedLength >= phrase.length;
    const finishedDeleting = isDeleting && typedLength === 0;
    const delay =
      finishedTyping && !isDeleting ? 1600 : finishedDeleting ? 280 : isDeleting ? 28 : 48;
    const timeoutId = window.setTimeout(() => {
      if (finishedTyping && !isDeleting) {
        setIsDeleting(true);
        return;
      }
      if (finishedDeleting) {
        setHeadlineIndex((index) => (index + 1) % HERO_HEADLINES.length);
        setIsDeleting(false);
        return;
      }
      setTypedLength((length) =>
        Math.max(0, Math.min(phrase.length, length + (isDeleting ? -1 : 1))),
      );
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [headlineIndex, isDeleting, typedLength, usesTypewriter]);

  return (
    <section className="home-hero relative isolate overflow-hidden">
      <div className="hero-sky pointer-events-none absolute inset-0" aria-hidden="true">
        <span className="hero-light-ray hero-light-ray--emerald" />
        <span className="hero-light-ray hero-light-ray--gold" />
      </div>
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="hero-enter hero-enter--1 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-deep)] shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--brand-emerald)]" />
            {eyebrow}
          </span>
          <h1 className="hero-enter hero-enter--2 mt-5 text-4xl font-extrabold leading-[1.05] text-[color:var(--brand-deep)] md:text-5xl lg:text-6xl">
            {usesTypewriter ? (
              <span
                key={headlineIndex}
                className={`hero-typewriter-text ${HERO_HEADLINES[headlineIndex].tone}`}
                aria-label={HERO_HEADLINES[headlineIndex].text}
              >
                {HERO_HEADLINES[headlineIndex].text.slice(0, typedLength)}
                <span className="hero-typewriter-caret" aria-hidden="true" />
              </span>
            ) : (
              headline
            )}
          </h1>
          <p className="hero-enter hero-enter--3 mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--muted-foreground)]">
            {subhead}
          </p>
          <div className="hero-enter hero-enter--4 mt-8 flex flex-wrap gap-3">
            <a
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold text-white gradient-brand  hover:opacity-95"
            >
              {ctaLabel} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="hero-metrics-bar hero-enter hero-enter--5 mt-10 grid max-w-xl grid-cols-3 overflow-hidden rounded-lg">
            {HERO_METRICS.map((metric) => (
              <div
                key={metric.label}
                className="border-r border-white/20 px-3 py-4 last:border-r-0 sm:px-4 sm:py-5"
              >
                <AnimatedMetric value={metric.value} suffix={metric.suffix} label={metric.label} />
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <figure className="hero-portrait-enter mx-auto w-full max-w-[640px]">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--brand-tint)]">
              <img
                src={BOARD_IMAGE}
                alt="Board members of the Data Protection Officers Conference"
                width={1448}
                height={1086}
                className="h-full w-full object-cover object-center"
              />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}

function AnimatedMetric({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  const metricRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);

  useEffect(() => {
    const element = metricRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasEnteredViewport(true);
        observer.disconnect();
      },
      { threshold: 0.6 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEnteredViewport) return;

    let animationFrame = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animationFrame = window.requestAnimationFrame(() => setCount(value));
      return () => window.cancelAnimationFrame(animationFrame);
    }

    const startedAt = window.performance.now();
    const duration = 1000;
    const updateCount = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setCount(Math.round(value * progress));
      if (progress < 1) animationFrame = window.requestAnimationFrame(updateCount);
    };

    animationFrame = window.requestAnimationFrame(updateCount);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [value, hasEnteredViewport]);

  return (
    <div ref={metricRef}>
      <p className="hero-metric-value tabular-nums" aria-label={`${value}${suffix} ${label}`}>
        {String(count).padStart(2, "0")}
        {suffix}
      </p>
      <p className="mt-2 text-xs leading-snug text-[color:var(--muted-foreground)] sm:text-sm">
        {label}
      </p>
    </div>
  );
}

function PartnersStrip() {
  const items = [
    "Regulators",
    "Professional Institutions",
    "Corporate Partners",
    "Training Partners",
    "Academic Institutions",
    "Development Organisations",
  ];
  return (
    <section className="border-y border-[color:var(--border)] bg-[color:var(--muted)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-center text-xs uppercase tracking-widest text-[color:var(--muted-foreground)]">
          Connecting professionals, regulators, institutions and industry leaders
        </p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((i) => (
            <div
              key={i}
              className="text-center text-sm font-semibold text-[color:var(--brand-deep)]/70 border border-dashed border-[color:var(--border)] rounded-lg py-4 bg-white/50"
            >
              {i}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyMatters() {
  const [pillarCount, setPillarCount] = useState(1);
  const conferenceGuides = [
    {
      title: "Who should attend?",
      description: "Find the professionals and leaders this gathering is for.",
      icon: Users,
      hash: "who-should-attend",
    },
    {
      title: "Why attend?",
      description: "Explore the practical value, connections and CPD on offer.",
      icon: Sparkles,
      hash: "why-attend",
    },
    {
      title: "Themes and topics",
      description: "See the issues shaping privacy and data governance.",
      icon: Compass,
      hash: "themes",
    },
    {
      title: "Conference activities",
      description: "Preview the sessions, workshops and networking.",
      icon: Calendar,
      hash: "activities",
    },
  ];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPillarCount(9);
      return;
    }

    let count = 1;
    let timeoutId: number;
    const advance = () => {
      if (count === 9) {
        timeoutId = window.setTimeout(() => {
          count = 1;
          setPillarCount(count);
          timeoutId = window.setTimeout(advance, 140);
        }, 10_000);
        return;
      }

      timeoutId = window.setTimeout(() => {
        count += 1;
        setPillarCount(count);
        advance();
      }, 140);
    };

    timeoutId = window.setTimeout(advance, 140);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-x-14 gap-y-8 px-6 py-12 lg:grid-cols-2 lg:py-16">
      <div>
        <CommissionerPortrait />
      </div>
      <div className="flex h-full flex-col">
        <div>
          <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">
            Why Data Protection Officers Conference Matters
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)]">
            A professional platform built for a defining moment in privacy.
          </h2>
        </div>
        <div className="mt-4 flex flex-1 flex-col justify-between text-sm leading-6 text-[color:var(--muted-foreground)]">
          <p>
            As organisations handle more personal data, the Data Protection Officer's role has
            become central to lawful, secure and responsible governance. The conference brings
            together DPOs, privacy professionals, regulators and organisational leaders to share
            knowledge and address the issues reshaping the profession.
          </p>
          <div>
            <h3 className="font-bold text-[color:var(--brand-deep)]">
              Practical knowledge and professional growth
            </h3>
            <p className="mt-1">
              Go beyond compliance theory with real-world approaches to privacy risks,
              accountability and effective data protection programmes. Explore emerging regulation,
              implementation challenges and technology-driven risks while building skills and
              earning CPD.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-[color:var(--brand-deep)]">
              Connections across every discipline
            </h3>
            <p className="mt-1">
              Responsible data protection depends on collaboration across legal, compliance, IT,
              cybersecurity, human resources and leadership. The conference creates space for these
              perspectives to meet, exchange experience and build stronger professional networks.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-[color:var(--brand-deep)]">
              Trust today, readiness for what comes next
            </h3>
            <p className="mt-1">
              Examine how artificial intelligence, digital transformation, cyber threats and
              cross-border data flows are changing privacy. Share practical ways to move beyond
              reactive compliance and build lasting trust, resilience and responsible innovation.
            </p>
          </div>
          <p className="font-semibold text-[color:var(--brand-deep)]">
            More than a conference, it is a meeting point for the people protecting personal data
            and shaping the future of privacy.
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6 lg:col-span-2">
        <Link
          to="/about"
          hash="pillars"
          className="group flex min-h-48 flex-col justify-between rounded-lg border border-white/20 bg-[color:var(--brand-deep)] p-4 text-white transition-colors hover:bg-[color:var(--brand-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-gold)] md:col-span-2 xl:col-span-2"
        >
          <div className="flex min-h-28 items-center gap-4">
            <p
              className="shrink-0 text-8xl font-extrabold leading-none text-[color:var(--brand-gold)]"
              aria-label={`${pillarCount} strategic pillars`}
            >
              {pillarCount}
            </p>
            <div className="min-w-0">
              <h3 className="text-xl font-bold">Strategic Pillars</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/75">
                Explore all nine programme areas.
              </p>
            </div>
          </div>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-[color:var(--brand-gold)]">
            View all{" "}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        {conferenceGuides.map(({ title, description, icon: Icon, hash }) => (
          <Link
            key={hash}
            to="/conference"
            hash={hash}
            className="group flex min-h-48 flex-col justify-between rounded-lg border border-white/20 bg-[color:var(--brand-deep)] p-4 text-white transition-colors hover:bg-[color:var(--brand-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-gold)]"
          >
            <div>
              <Icon className="h-5 w-5 text-[color:var(--brand-gold)]" />
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{description}</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-[color:var(--brand-gold)]">
              View more{" "}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CommissionerPortrait() {
  return (
    <figure className="commissioner-portrait">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[color:var(--brand-deep)]">
        <img
          src={COMMISSIONER_IMAGE}
          alt="National Commissioner of the Nigeria Data Protection Commission"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>
    </figure>
  );
}

function CoreBenefits() {
  const cards = [
    {
      icon: Users,
      title: "Cross-sector connections",
      body: "Meet DPOs, privacy leaders, regulators and professionals from across disciplines.",
    },
    {
      icon: GraduationCap,
      title: "Practical programme",
      body: "Explore sessions and workshops focused on real data protection and privacy challenges.",
    },
    {
      icon: Award,
      title: "Event CPD",
      body: "Earn configured CPD points when your event attendance is recorded.",
    },
    {
      icon: BookOpen,
      title: "Continued learning",
      body: "Access eligible free and paid learning courses through the conference LMS.",
    },
    {
      icon: Compass,
      title: "Expert perspectives",
      body: "Learn from speakers and practitioners working across privacy, policy and technology.",
    },
    {
      icon: Network,
      title: "Certificates",
      body: "View and download certificates issued under the event's attendance and completion rules.",
    },
  ];
  return (
    <section className="bg-[color:var(--brand-tint)]/40 py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">
            What you gain
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)]">
            A conference experience built for practical professional growth.
          </h2>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c) => (
            <div
              key={c.title}
              className="group p-7 rounded-2xl bg-white border border-[color:var(--border)] hover:border-[color:var(--brand-emerald)]  transition-all"
            >
              <div className="h-12 w-12 rounded-xl gradient-brand grid place-items-center text-white mb-5">
                <c.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-[color:var(--brand-deep)]">{c.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)] leading-relaxed">
                {c.body}
              </p>
              <Link
                to="/conference"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--brand-green)] group-hover:gap-2 transition-all"
              >
                Conference details <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
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
          fromAmountNgn: number | null;
          datesToBeAnnounced?: boolean;
          registrationReady?: boolean;
          packages?: { isActive: boolean }[];
        }[]
      >("/public/conferences"),
  });

  const now = Date.now();
  const upcoming = (q.data ?? []).filter((c) => new Date(c.endsOn).getTime() >= now);
  const spotlightConference = upcoming.find((c) => c.slug === "annual-2027");
  const isRegistrationReady = (conference: (typeof upcoming)[number]) =>
    conference.registrationReady ??
    (conference.fromAmountNgn != null || Boolean(conference.packages?.some((pkg) => pkg.isActive)));
  const cards = spotlightConference
    ? [
        spotlightConference,
        ...upcoming.filter((c) => c.slug !== spotlightConference.slug).slice(0, 2),
      ]
    : upcoming.slice(0, 3);
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-brand" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 30%, rgba(214,168,75,0.4), transparent 40%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 py-20 text-white lg:py-28">
        <div className="min-w-0">
          <div className="mb-5 flex justify-end">
            <Link
              to="/conferences"
              className="text-sm font-semibold text-[color:var(--brand-gold)] hover:text-white"
            >
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
            <article className="mt-10 max-w-2xl rounded-lg border border-white/20 bg-white/5 p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-[color:var(--brand-gold)]">
                Coming Soon
              </p>
              <h3 className="mt-2 text-xl font-bold">
                A new chapter for Africa&apos;s privacy profession
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                Expect practical sessions, conversations with regulators and privacy leaders, and
                fresh perspectives on the issues shaping data protection. Conference dates and
                registration details will be announced here once confirmed.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  to="/conference"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[color:var(--brand-gold)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-deep)] hover:opacity-90"
                >
                  Read more <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/conferences"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  View all conferences <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  disabled
                  className="min-h-11 cursor-not-allowed rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white/50"
                >
                  Registration coming soon
                </button>
              </div>
            </article>
          ) : (
            <div className="mt-6 grid gap-6">
              {cards.map((c) => (
                <article
                  key={c.slug}
                  className="grid overflow-hidden rounded-2xl border border-white/20 bg-white/5 backdrop-blur sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]"
                >
                  <div className="flex flex-col p-6 md:p-8">
                    <span className="mb-4 inline-flex w-fit rounded-full border border-[color:var(--brand-gold)]/50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[color:var(--brand-gold)]">
                      Data Protection Officers Conference
                    </span>
                    <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">{c.title}</h2>
                    <p className="mt-3 max-w-xl text-base leading-relaxed text-white/85">
                      {c.theme ||
                        "Join DPOs, regulators and privacy leaders for practical learning, professional connections and cross-sector dialogue."}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-white/60">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatConferenceDateLabel(c.startsOn, c.endsOn, c.datesToBeAnnounced)}
                    </p>
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-white/80">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {c.city}
                      {c.format ? ` · ${c.format}` : ""}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[color:var(--brand-gold)]">
                      {!isRegistrationReady(c)
                        ? "Waitlist open"
                        : c.isFree || c.fromAmountNgn === 0
                          ? "Free"
                          : c.fromAmountNgn == null
                            ? "Registration details coming soon"
                            : `From ${formatNaira(c.fromAmountNgn)}`}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-3 pt-6">
                      {!isRegistrationReady(c) ? (
                        <Link
                          to="/conferences/$slug"
                          params={{ slug: c.slug }}
                          hash="register"
                          className="rounded-md bg-[color:var(--brand-gold)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-deep)] hover:opacity-90"
                        >
                          Join waitlist
                        </Link>
                      ) : (
                        <Link
                          to="/conferences/$slug/register"
                          params={{ slug: c.slug }}
                          className="rounded-md bg-[color:var(--brand-gold)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-deep)] hover:opacity-90"
                        >
                          Register now
                        </Link>
                      )}
                      <Link
                        to="/conferences/$slug"
                        params={{ slug: c.slug }}
                        className="rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                      >
                        View programme
                      </Link>
                    </div>
                  </div>
                  <div className="flex min-h-64 items-center justify-center bg-black/10 p-5 sm:min-h-full sm:p-7">
                    <img
                      src={c.coverUrl || CONFERENCE_SPOTLIGHT_IMAGE}
                      alt={`${c.title} conference artwork`}
                      className="max-h-[28rem] w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function LearningSpotlight() {
  return (
    <section className="bg-[color:var(--brand-deep)] text-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-[color:var(--brand-gold)] uppercase tracking-wider">
            Learning beyond the conference
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold">Keep learning all year.</h2>
          <p className="mt-4 text-white/80">
            Continue your professional development with free and paid courses, practical seminars
            and CPD learning connected to the conference community.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-md bg-[color:var(--brand-gold)] px-5 py-3 text-sm font-bold text-[color:var(--brand-deep)]"
          >
            Browse courses <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/training"
            className="inline-flex items-center gap-2 rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Explore seminars <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Insights() {
  const q = useQuery({
    queryKey: ["home-news"],
    queryFn: () =>
      apiGet<
        {
          slug: string;
          title: string;
          excerpt?: string;
          publishedOn?: string;
          coverUrl?: string | null;
        }[]
      >("/public/news"),
  });
  const posts = (q.data ?? []).slice(0, 3);
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <p className="text-sm font-semibold text-[color:var(--brand-green)] uppercase tracking-wider">
            Insights
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-[color:var(--brand-deep)]">
            Latest thinking from the Data Protection Officers Conference network.
          </h2>
        </div>
        <Link
          to="/news"
          className="text-sm font-semibold text-[color:var(--brand-green)] hover:text-[color:var(--brand-deep)]"
        >
          All news →
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((p) => (
          <article
            key={p.slug}
            className="rounded-2xl overflow-hidden border border-[color:var(--border)] bg-white  transition-"
          >
            <div className="h-40 gradient-brand relative overflow-hidden">
              {p.coverUrl ? (
                <img
                  src={p.coverUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 30% 30%, rgba(214,168,75,0.5), transparent 60%)",
                  }}
                />
              )}
              <span className="absolute top-4 left-4 bg-white/95 text-[color:var(--brand-deep)] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                News
              </span>
            </div>
            <div className="p-6">
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {p.publishedOn
                  ? new Date(p.publishedOn).toLocaleDateString("en-NG", {
                      month: "short",
                      year: "numeric",
                    })
                  : ""}
              </p>
              <h3 className="mt-2 font-bold text-lg text-[color:var(--brand-deep)] leading-snug">
                {p.title}
              </h3>
              {p.excerpt ? (
                <p className="mt-2 line-clamp-2 text-sm text-[color:var(--muted-foreground)]">
                  {p.excerpt}
                </p>
              ) : null}
              <Link
                to="/news/$slug"
                params={{ slug: p.slug }}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--brand-green)]"
              >
                Read insight <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        ))}
        {!q.isPending && posts.length === 0 && (
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Published articles will appear here.
          </p>
        )}
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
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, rgba(214,168,75,0.6), transparent 40%)",
          }}
        />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Stay informed about privacy, regulation and professional development.
            </h2>
            <p className="mt-3 text-white/85">
              Monthly briefings for DPOs, privacy leads and governance professionals.
            </p>
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
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="sm:col-span-2 rounded-md bg-white/10 border border-white/25 px-4 py-3 text-base md:text-sm placeholder:text-white/60 focus:outline-none focus:border-[color:var(--brand-gold)]"
            />
            <input
              type="text"
              name="website"
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
            />
            <label className="sm:col-span-2 flex items-start gap-2 text-xs text-white/80">
              <input type="checkbox" required className="mt-1" /> I consent to receive updates from
              Data Protection Officers Conference.
            </label>
            <Button
              type="submit"
              loading={loading}
              className="sm:col-span-2 rounded-md bg-[color:var(--brand-gold)] text-[color:var(--brand-deep)] font-bold px-4 py-3 text-sm hover:opacity-95"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 text-center">
      <h2 className="text-3xl md:text-5xl font-extrabold text-[color:var(--brand-deep)] max-w-3xl mx-auto leading-tight">
        Join the Data Protection Officers Conference.
      </h2>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/conferences"
          className="inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold text-white gradient-brand "
        >
          Register for the Conference <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/contact"
          className="rounded-md px-6 py-3.5 text-sm font-semibold text-[color:var(--brand-green)] hover:text-[color:var(--brand-deep)]"
        >
          Speak with our team →
        </Link>
      </div>
    </section>
  );
}

void [Briefcase];
