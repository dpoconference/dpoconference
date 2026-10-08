import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet, apiPost } from "@/lib/api";
import { formatConferenceDates, formatNaira } from "@/lib/format";
import { notify } from "@/lib/toast";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/conference_/invite")({
  validateSearch: (s: Record<string, unknown>) => ({
    number: typeof s.number === "string" ? s.number : "",
    email: typeof s.email === "string" ? s.email : "",
  }),
  head: () => ({ meta: [{ title: "Conference e-invite | Data Protection Officers Conference" }] }),
  component: ConferenceInvitePage,
});

type Invite = {
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

function ConferenceInvitePage() {
  const { number, email } = Route.useSearch();
  const [resending, setResending] = useState(false);

  const q = useQuery({
    queryKey: ["conference-invite", number, email],
    enabled: Boolean(number && email),
    queryFn: () =>
      apiGet<Invite>(
        `/public/conference-invite?number=${encodeURIComponent(number)}&email=${encodeURIComponent(email)}`,
      ),
  });

  async function resend() {
    setResending(true);
    try {
      await apiPost("/public/conference-invite/resend", { number, email });
      notify.success("A copy of your e-invite has been emailed.");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Could not resend invite.");
    } finally {
      setResending(false);
    }
  }

  if (!number || !email) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-lg px-6 py-24 text-center text-sm">
          <h1 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">E-invite</h1>
          <p className="mt-3 text-[color:var(--muted-foreground)]">
            Open this page from your confirmation email, or look up your ticket using both your registered email and Registration ID.
          </p>
          <Link to="/conference/lookup" className="mt-6 inline-block font-semibold text-[color:var(--brand-green)]">
            Find my e-invite
          </Link>
        </section>
      </SiteLayout>
    );
  }

  if (q.isPending) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-lg px-6 py-16">
          <Skeleton className="h-[480px]" />
        </div>
      </SiteLayout>
    );
  }

  if (q.isError || !q.data) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-lg px-6 py-24 text-center text-sm">
          <h1 className="text-2xl font-extrabold text-[color:var(--brand-deep)]">Invite not found</h1>
          <p className="mt-3 text-[color:var(--muted-foreground)]">
            Check that payment is complete. You can also{" "}
            <Link to="/conference/lookup" className="font-semibold text-[color:var(--brand-green)]">
              look up your e-invite
            </Link>
            .
          </p>
        </section>
      </SiteLayout>
    );
  }

  const invite = q.data;
  const paymentText = invite.isFree || invite.paymentLabel === "FREE" ? "FREE" : `${invite.paymentLabel} · ${formatNaira(Number(invite.amountNgn))}`;

  return (
    <SiteLayout>
      <style>{`
        @media print {
          .site > header,
          .site > footer,
          .invite-actions {
            display: none !important;
          }
          .site > main {
            padding: 0 !important;
          }
          .invite-card {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          @page { margin: 12mm; size: A5; }
        }
      `}</style>
      <section className="mx-auto flex max-w-lg flex-col items-center px-6 py-12">
        <div className="invite-card w-full max-w-[560px] rounded-2xl border border-[color:var(--border)] bg-white p-8 text-center shadow-sm">
          <img src={logo} alt="Data Protection Officers Conference" className="mx-auto h-16 w-16 object-contain" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--brand-green)]">Data Protection Officers Conference</p>
          <h1 className="mt-4 text-2xl font-extrabold text-[color:var(--brand-deep)]">{invite.conferenceTitle}</h1>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
            {formatConferenceDates(invite.startsOn, invite.endsOn)}
          </p>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            {invite.venue}, {invite.city}
          </p>

          <div className="mt-8 rounded-xl bg-[color:var(--brand-tint)]/50 px-4 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-green)]">Attendee</p>
            <p className="mt-2 text-lg font-bold text-[color:var(--brand-deep)]">
              {invite.firstName} {invite.lastName}
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{invite.email}</p>
          </div>

          <p className="mt-6 text-xs uppercase tracking-wider text-[color:var(--muted-foreground)]">Registration ID</p>
          <p className="mt-2 font-mono text-xl font-bold tracking-widest text-[color:var(--brand-deep)]">
            {invite.registrationNumber}
          </p>
          <p className="mt-3 text-sm font-semibold text-[color:var(--brand-green)]">Payment: {paymentText}</p>

          {invite.qrDataUrl ? (
            <img src={invite.qrDataUrl} alt="Check-in QR" className="mx-auto mt-6 h-[220px] w-[220px] rounded-xl border bg-white p-2" />
          ) : (
            <p className="mt-6 text-sm text-[color:var(--muted-foreground)]">QR code will appear when your invite is ready.</p>
          )}
        </div>

        <div className="invite-actions mt-6 flex w-full max-w-[560px] flex-wrap gap-3">
          <Button className="flex-1 gradient-brand text-white" onClick={() => window.print()}>
            Print e-invite
          </Button>
          <Button variant="outline" className="flex-1" loading={resending} onClick={() => void resend()}>
            Email me a copy
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
