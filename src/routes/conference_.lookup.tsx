import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";
import { formatConferenceDates, formatNaira } from "@/lib/format";
import { notify } from "@/lib/toast";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/conference_/lookup")({
  head: () => ({ meta: [{ title: "Find my e-invite | Data Protection Officers Conference" }] }),
  component: Page,
});

type Invite = {
  registrationId: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  conferenceTitle: string;
  startsOn: string;
  endsOn: string;
  venue: string;
  city: string;
  amountNgn: number;
  isFree: boolean;
  paymentLabel: string;
  qrDataUrl?: string | null;
};

function Page() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invite[] | null>(null);

  async function lookup() {
    if (!email.trim() || !number.trim()) {
      notify.error("Enter both your registered email and registration number.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost<{ invites: Invite[] }>("/public/conference-invite/lookup", {
        ...(email.trim() ? { email: email.trim().toLowerCase() } : {}),
        ...(number.trim() ? { number: number.trim() } : {}),
      });
      setInvites(data.invites);
      if (!data.invites.length) notify.error("No confirmed registration matched those details.");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Lookup failed.");
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }

  async function resend(invite: Invite) {
    setResending(invite.registrationNumber);
    try {
      await apiPost("/public/conference-invite/resend", {
        number: invite.registrationNumber,
        email: invite.email,
      });
      notify.success("A copy of your e-invite has been emailed.");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Could not resend.");
    } finally {
      setResending(null);
    }
  }

  return (
    <SiteLayout>
      <style>{`
        @media print {
          .site > header, .site > footer, .lookup-form, .invite-actions { display: none !important; }
          @page { margin: 12mm; size: A5; }
        }
      `}</style>
      <PageHero
        breadcrumb="Home / Conference / Find e-invite"
        eyebrow="Attendee ticket"
        title="Find or reprint your e-invite"
        subtitle="Enter both the email address used to register and your Registration ID. This is a conference ticket, not membership."
      />
      <section className="mx-auto max-w-xl space-y-6 px-6 py-12">
        <form
          className="lookup-form space-y-3 rounded-2xl border border-[color:var(--border)] bg-white p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void lookup();
          }}
        >
          <label className="block text-sm">
            Registered email
            <input
              type="email"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value.trimStart())}
              placeholder="you@organisation.ng"
            />
          </label>
          <label className="block text-sm">
            Registration ID
            <input
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="CONF/2027/G/00001"
            />
          </label>
          <Button type="submit" loading={loading} className="w-full gradient-brand text-white">
            Find my registration
          </Button>
        </form>

        {(invites ?? []).map((invite) => {
          const paymentText =
            invite.isFree || invite.paymentLabel === "FREE" ? "FREE" : `${invite.paymentLabel} · ${formatNaira(Number(invite.amountNgn))}`;
          return (
            <div key={invite.registrationNumber} className="invite-card rounded-2xl border border-[color:var(--border)] bg-white p-8 text-center">
              <img src={logo} alt="Data Protection Officers Conference" className="mx-auto h-16 w-16 object-contain" />
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--brand-green)]">Data Protection Officers Conference</p>
              <h2 className="mt-4 text-xl font-extrabold text-[color:var(--brand-deep)]">{invite.conferenceTitle}</h2>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                {formatConferenceDates(invite.startsOn, invite.endsOn)} · {invite.venue}, {invite.city}
              </p>
              <p className="mt-4 text-xs uppercase tracking-wider text-[color:var(--brand-green)]">Attendee</p>
              <p className="mt-1 font-bold text-[color:var(--brand-deep)]">
                {invite.firstName} {invite.lastName}
              </p>
              <p className="text-sm text-[color:var(--muted-foreground)]">{invite.email}</p>
              <p className="mt-4 font-mono text-lg font-bold tracking-widest">{invite.registrationNumber}</p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--brand-green)]">Payment: {paymentText}</p>
              {invite.qrDataUrl ? (
                <img src={invite.qrDataUrl} alt="Check-in QR" className="mx-auto mt-4 h-[180px] w-[180px] rounded-xl border p-2" />
              ) : null}
              <div className="invite-actions mt-6 flex flex-wrap gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() =>
                    void navigate({
                      to: "/conference/invite",
                      search: { number: invite.registrationNumber, email: invite.email },
                    })
                  }
                >
                  Open invite
                </Button>
                <Button className="flex-1" onClick={() => window.print()}>
                  Print
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  loading={resending === invite.registrationNumber}
                  onClick={() => void resend(invite)}
                >
                  Email a copy
                </Button>
              </div>
            </div>
          );
        })}

        <p className="text-center text-sm">
          Need a new ticket?{" "}
          <Link to="/conferences" className="font-semibold text-[color:var(--brand-green)]">
            Browse conferences
          </Link>
        </p>
      </section>
    </SiteLayout>
  );
}
