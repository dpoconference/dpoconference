import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Calendar, MapPin, Ticket, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { CheckList } from "@/components/site/CheckList";
import { ConferenceRegisterForm } from "@/components/site/ConferenceRegisterForm";
import { Button } from "@/components/ui/button";
import { SafeHtml } from "@/components/SafeHtml";
import { apiGet, apiPost } from "@/lib/api";
import { formatConferenceDateLabel, formatConferenceDates, formatNaira } from "@/lib/format";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import conferenceImg from "@/assets/conference.jpg";

export const Route = createFileRoute("/conferences_/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} | Data Protection Officers Conference` }],
  }),
  component: ConferenceDetailPage,
});

type AgendaDay = {
  date: string;
  title?: string;
  items?: { time?: string; title: string; description?: string }[];
};

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
  isFree: boolean;
  fromAmountNgn: number | null;
  capacity?: number | null;
  registrationOpen?: boolean;
  registrationReady?: boolean;
  datesToBeAnnounced?: boolean;
  registrationOpensOn?: string | null;
  registrationClosesOn?: string | null;
  agenda?: AgendaDay[] | null;
};

function ConferenceDetailPage() {
  const { slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["conference", slug],
    queryFn: () => apiGet<PublicConference>(`/public/conferences/${slug}`),
  });
  const c = q.data;
  const isUpcoming = Boolean(c && new Date(c.endsOn).getTime() >= Date.now());
  const registrationReady = c?.registrationReady ?? false;
  const heroImg = c?.coverUrl || conferenceImg;
  const priceLabel =
    !c
      ? ""
      : c.isFree
        ? "Free"
        : c.fromAmountNgn == null
          ? "Waitlist open"
          : c.fromAmountNgn === 0
            ? "Free"
            : `From ${formatNaira(c.fromAmountNgn)}`;

  if (q.isPending) {
    return (
      <SiteLayout>
        <Skeleton className="h-96 w-full rounded-none" />
        <div className="mx-auto max-w-4xl px-6 py-16">
          <Skeleton className="h-40" />
        </div>
      </SiteLayout>
    );
  }

  if (q.isError || !c) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Conference not found</h1>
          <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">This event may be unpublished or the link is incorrect.</p>
          <Link to="/conferences" className="mt-6 inline-block text-sm font-semibold text-[color:var(--brand-green)]">
            Browse conferences
          </Link>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-[color:var(--brand-deep)] text-white">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--brand-deep)]/95 via-[color:var(--brand-deep)]/85 to-[color:var(--brand-green)]/70" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <p className="mb-4 text-xs uppercase tracking-widest text-[color:var(--brand-gold)]">Home / Conferences / {c.title}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.05] md:text-6xl">{c.title}</h1>
          {c.theme ? <p className="mt-5 max-w-2xl text-xl text-white/85">{c.theme}</p> : null}
          <div className="mt-8 flex flex-wrap gap-2">
            <Chip icon={Calendar} label={formatConferenceDateLabel(c.startsOn, c.endsOn, c.datesToBeAnnounced)} />
            <Chip icon={MapPin} label={`${c.venue}, ${c.city}`} />
            <Chip icon={Ticket} label={c.format ?? "Hybrid"} />
            <Chip icon={Users} label={priceLabel} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#register"
              className="min-h-11 rounded-md bg-[color:var(--brand-gold)] px-6 py-3.5 font-bold text-[color:var(--brand-deep)]"
            >
              {isUpcoming && !registrationReady ? "Join waitlist" : "Register"}
            </a>
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
                Download prospectus
              </a>
            ) : (
              <Link to="/conference/sponsor" className="min-h-11 rounded-md border-2 border-white/50 px-6 py-3.5 font-semibold">
                Partner
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-[15px] leading-7">
        <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Overview</h2>
        {c.bodyHtml?.trim() ? (
          <div className="mt-4">
            <SafeHtml html={c.bodyHtml} />
          </div>
        ) : (
          <p className="mt-4">
            {c.overview ||
              "The Data Protection Officers Conference gathering brings together Data Protection Officers, regulators, policymakers, privacy professionals, cybersecurity experts, researchers, legal practitioners and organisational leaders for regulatory engagement, networking and CPD."}
          </p>
        )}
      </section>

      <section className="bg-[color:var(--brand-tint)]/50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Why attend</h2>
          <CheckList
            className="mt-4"
            items={[
              "Engage with regulators and industry leaders",
              "Receive practical compliance guidance",
              "Learn about emerging privacy and technology risks",
              "Build professional relationships",
              "Earn CPD credits",
              "Participate in technical workshops",
              "Discover career and partnership opportunities",
              "Celebrate professional excellence",
            ]}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Agenda</h2>
        {!c.agenda?.length ? (
          <p className="mt-4 text-sm text-[color:var(--muted-foreground)]">Programme will be published by the Secretariat.</p>
        ) : (
          <div className="mt-8 space-y-8">
            {c.agenda.map((day) => (
              <div key={`${day.date}-${day.title}`} className="border-t border-[color:var(--border)] pt-6">
                <h3 className="text-xl font-bold text-[color:var(--brand-deep)]">
                  {day.title || "Programme day"} ·{" "}
                  {new Date(day.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                </h3>
                <ul className="mt-4 space-y-3">
                  {(day.items ?? []).map((item, idx) => (
                    <li key={`${item.title}-${idx}`} className="text-sm leading-6">
                      {item.time ? <span className="font-semibold text-[color:var(--brand-green)]">{item.time} · </span> : null}
                      <span className="font-semibold text-[color:var(--brand-deep)]">{item.title}</span>
                      {item.description ? <p className="mt-1 text-[color:var(--muted-foreground)]">{item.description}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[color:var(--muted)] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Who should attend</h2>
          <CheckList
            className="mt-6 grid gap-2 sm:grid-cols-2"
            items={[
              "Data Protection Officers",
              "Privacy professionals",
              "Compliance officers",
              "Legal practitioners",
              "CISOs and cybersecurity professionals",
              "Risk managers",
              "Internal auditors",
              "Researchers",
              "Government officials",
              "DPCOs",
              "Students and aspiring privacy professionals",
            ]}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Practical</h2>
        <ul className="mt-4 space-y-2 text-sm leading-7">
          <li>
            <span className="font-semibold">Registration: </span>
            {registrationReady ? "Open" : isUpcoming ? "Waitlist" : "Closed"}
            {!c.datesToBeAnnounced && (c.registrationOpensOn || c.registrationClosesOn)
              ? ` · ${c.registrationOpensOn ? formatConferenceDates(c.registrationOpensOn, c.registrationOpensOn) : "…"} to ${c.registrationClosesOn ? formatConferenceDates(c.registrationClosesOn, c.registrationClosesOn) : "…"}`
              : null}
          </li>
          {c.capacity != null ? (
            <li>
              <span className="font-semibold">Capacity: </span>
              {c.capacity} attendees
            </li>
          ) : null}
          <li>
            <span className="font-semibold">Fee: </span>
            {priceLabel}
          </li>
        </ul>
      </section>

      <section id="register" className="border-t border-[color:var(--border)] bg-[color:var(--brand-tint)]/40 py-16">
        <div className="mx-auto max-w-xl px-6">
          {registrationReady ? (
            <>
              <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Register</h2>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                Anyone can register — member or guest. Complete the form, pay if required, and receive your e-invite.
              </p>
              <div className="mt-8">
                <ConferenceRegisterForm slug={c.slug} compact />
              </div>
            </>
          ) : isUpcoming ? (
            <>
              <h2 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">Join the waitlist</h2>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                Registration details are being prepared. Join the waitlist and we’ll email you when the programme and ticket
                options are ready.
              </p>
              <div className="mt-8">
                <ConferenceWaitlistForm slug={c.slug} />
              </div>
            </>
          ) : (
            <p className="text-sm text-[color:var(--muted-foreground)]">Registration for this conference is closed.</p>
          )}
        </div>
      </section>

      <div className="sticky bottom-0 z-20 border-t border-[color:var(--border)] bg-white/95 p-4 backdrop-blur md:hidden">
        <a
          href="#register"
          className="flex min-h-11 w-full items-center justify-center rounded-md bg-[color:var(--brand-gold)] font-bold text-[color:var(--brand-deep)]"
        >
          {isUpcoming && !registrationReady ? "Join waitlist" : "Register"}
        </a>
      </div>
    </SiteLayout>
  );
}

function ConferenceWaitlistForm({ slug }: { slug: string }) {
  const [form, setForm] = useState({ name: "", organisationName: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiPost<{ whatsappGroupUrl: string }>(`/public/conferences/${slug}/waitlist`, {
        name: form.name.trim(),
        organisationName: form.organisationName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      });
      setWhatsappGroupUrl(data.whatsappGroupUrl);
      notify.success("You’ve joined the conference waitlist.");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Could not join the waitlist.");
    } finally {
      setLoading(false);
    }
  }

  if (whatsappGroupUrl) {
    return (
      <div className="space-y-4 rounded-xl border border-[color:var(--border)] bg-white p-5">
        <p className="text-sm font-semibold text-[color:var(--brand-deep)]">
          You’re on the waitlist. We’ll email you when registration opens.
        </p>
        <a
          href={whatsappGroupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-[color:var(--brand-green)] px-5 py-3 font-semibold text-white"
        >
          Join our WhatsApp group
        </a>
      </div>
    );
  }

  return (
    <form className="space-y-3 rounded-xl border border-[color:var(--border)] bg-white p-5" onSubmit={submit}>
      <input
        required
        minLength={2}
        maxLength={160}
        placeholder="Full name"
        autoComplete="name"
        className="w-full rounded-md border px-3 py-3"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        required
        minLength={2}
        maxLength={200}
        placeholder="Organization name"
        autoComplete="organization"
        className="w-full rounded-md border px-3 py-3"
        value={form.organisationName}
        onChange={(e) => setForm({ ...form, organisationName: e.target.value })}
      />
      <input
        required
        type="email"
        placeholder="Email address"
        autoComplete="email"
        className="w-full rounded-md border px-3 py-3"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        required
        type="tel"
        minLength={5}
        maxLength={40}
        placeholder="Phone number"
        autoComplete="tel"
        className="w-full rounded-md border px-3 py-3"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <p className="text-xs leading-5 text-muted-foreground">
        We’ll use these details to manage your waitlist request and notify you when registration opens. See our{" "}
        <Link to="/legal/$slug" params={{ slug: "privacy-notice" }} className="font-semibold text-[color:var(--brand-green)]">
          Privacy Notice
        </Link>
        .
      </p>
      <Button type="submit" loading={loading} className="w-full gradient-brand text-white">
        Join waitlist
      </Button>
    </form>
  );
}

function Chip({ icon: Icon, label }: { icon: typeof Calendar; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-3 py-2 text-sm backdrop-blur">
      <Icon className="h-4 w-4 text-[color:var(--brand-gold)]" />
      {label}
    </span>
  );
}
