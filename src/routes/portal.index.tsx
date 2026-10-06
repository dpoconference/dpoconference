import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  CreditCard,
  FileText,
  GraduationCap,
  Handshake,
  IdCard,
  LifeBuoy,
  RefreshCw,
  ScrollText,
  Shield,
  ShieldAlert,
  Ticket,
  UserRound,
} from "lucide-react";
import { NeedActionPanel, type NeedActionItem } from "@/components/app/NeedActionPanel";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatCard } from "@/components/app/StatCard";
import { StatusChip } from "@/components/app/StatusChip";
import { Button } from "@/components/ui/button";
import { apiGet, apiPatch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { greetingWord } from "@/lib/format";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/portal/")({
  component: PortalHome,
});

function PortalHome() {
  const { user } = useAuth();
  const app = useQuery({
    queryKey: ["my-application"],
    queryFn: () => apiGet<Record<string, unknown> | null>("/membership/applications/me"),
  });
  const mem = useQuery({
    queryKey: ["my-membership"],
    queryFn: () => apiGet<Record<string, unknown> | null>("/membership/me"),
  });
  const cpd = useQuery({
    queryKey: ["my-cpd"],
    queryFn: () =>
      apiGet<{
        points: number | string;
        required: number;
        outstanding: number | string;
        compliant: boolean;
      }>("/portal/cpd").catch(() => null),
  });
  const events = useQuery({
    queryKey: ["my-events-dash"],
    queryFn: () =>
      apiGet<{
        conference: { registrationNumber: string; status: string }[];
      }>("/events/me").catch(() => ({ conference: [] })),
  });
  const certs = useQuery({
    queryKey: ["certs-dash"],
    queryFn: () => apiGet<{ id: string }[]>("/portal/certificates").catch(() => []),
  });
  const notifs = useQuery({
    queryKey: ["my-notifications-preview"],
    queryFn: () =>
      apiGet<{ id: string; title: string; body: string; readAt?: string | null }[]>(
        "/portal/notifications",
      ).catch(() => []),
  });

  if (app.isPending || mem.isPending) return <PageSkeleton />;

  const membership = mem.data as {
    membershipNumber?: string;
    status?: string;
    category?: { name: string };
    membershipYear?: number;
    directoryVisible?: boolean;
  } | null;
  const application = app.data as { status?: string; category?: { name: string } } | null;
  const firstName = user?.firstName ?? "there";
  const conferenceRegs = events.data?.conference ?? [];
  const hasConferenceTicket = conferenceRegs.length > 0;

  const actions: NeedActionItem[] = [];
  if (!membership && !application) {
    actions.push({
      id: "apply",
      title: "Start your membership application",
      body: "Select a category, complete the form and pay the published fee.",
      href: "/portal/apply",
      cta: "Apply",
      urgency: "high",
    });
  } else if (application && !membership && application.status !== "APPROVED") {
    actions.push({
      id: "app",
      title: "Application in progress",
      body: `${application.category?.name ?? "Membership"} — ${String(application.status).replaceAll("_", " ")}`,
      href: "/portal/application",
      cta: "Open",
      urgency: application.status === "INFO_REQUESTED" ? "high" : "medium",
    });
  }
  const cpdPoints = Number(cpd.data?.points ?? 0);
  const cpdRequired = Number(cpd.data?.required ?? 20);
  const cpdOutstanding = Number(cpd.data?.outstanding ?? 0);
  if (membership && cpd.data && !cpd.data.compliant) {
    actions.push({
      id: "cpd",
      title: "CPD hours outstanding",
      body: `${cpdOutstanding} points remaining against a ${cpdRequired}-point year.`,
      href: "/portal/cpd",
      cta: "Record",
      urgency: "medium",
    });
  }
  if (membership && !hasConferenceTicket) {
    actions.push({
      id: "conf",
      title: "Register for a conference",
      body: "Browse published conferences and secure your seat.",
      href: "/conferences",
      cta: "Browse",
      urgency: "low",
    });
  }
  if (membership && membership.directoryVisible === false) {
    actions.push({
      id: "dir",
      title: "Directory listing is off",
      body: "You appear in Find a DPO only after you opt in.",
      href: "/portal",
      cta: "Review",
      urgency: "low",
    });
  }

  const memberShortcuts = membership
    ? ([
        {
          to: "/portal/library",
          label: "Library",
          desc: "View-only learning materials and resources",
          icon: BookOpen,
        },
        {
          to: "/portal/threats",
          label: "Threat intelligence",
          desc: "Defensive advisories for your category",
          icon: ShieldAlert,
        },
        {
          to: "/portal/careers",
          label: "Careers",
          desc: "Jobs, applications and alerts",
          icon: Briefcase,
        },
        {
          to: "/portal/mentorship",
          label: "Mentorship",
          desc: "Profiles, matches and sessions",
          icon: Handshake,
        },
      ] as const)
    : [];

  const shortcuts = [
    ...memberShortcuts,
    {
      to: membership ? "/portal/card" : "/portal/apply",
      label: membership ? "Digital card" : "Apply",
      desc: membership ? "Download or show your ID card" : "Start or continue membership",
      icon: membership ? IdCard : FileText,
    },
    {
      to: "/portal/events",
      label: "My events",
      desc: "Conference and seminar registrations",
      icon: Ticket,
    },
    {
      to: "/portal/courses",
      label: "My courses",
      desc: "Continue courses and track learning progress",
      icon: GraduationCap,
    },
    {
      to: "/portal/training",
      label: "Training",
      desc: "Browse seminars and enrol",
      icon: GraduationCap,
    },
    {
      to: "/portal/cpd",
      label: "CPD tracker",
      desc: "Log points toward your yearly target",
      icon: ScrollText,
    },
    {
      to: "/portal/renew",
      label: "Renew",
      desc: "Pay the next membership year fee",
      icon: RefreshCw,
    },
    {
      to: "/portal/support",
      label: "Support",
      desc: "Raise or track a secretariat ticket",
      icon: LifeBuoy,
    },
    {
      to: "/portal/profile",
      label: "Profile",
      desc: "Update name and phone details",
      icon: UserRound,
    },
    {
      to: "/portal/privacy",
      label: "Privacy",
      desc: "Export or request account deletion",
      icon: Shield,
    },
  ] as const;

  const unread = (notifs.data ?? []).filter((n) => !n.readAt).slice(0, 3);

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        icon={IdCard}
        eyebrow="Member workspace"
        title={`${greetingWord()}, ${firstName}.`}
        subtitle={
          membership
            ? `${membership.category?.name} · ${membership.membershipNumber}`
            : "Membership, events and professional development in one place."
        }
        actions={
          membership ? (
            <Button asChild className="rounded-full">
              <Link to="/portal/events">
                Register for an event <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild className="rounded-full">
              <Link to="/portal/apply" search={{}}>
                Start application <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )
        }
      />

      <NeedActionPanel items={actions} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          to={membership ? "/portal/card" : "/portal/apply"}
          search={membership ? undefined : {}}
          className="block"
        >
          <StatCard
            label="Membership"
            value={membership?.status ?? application?.status?.replaceAll("_", " ") ?? "Not started"}
            hint={membership ? `Year ${membership.membershipYear}` : "Complete apply to join"}
            icon={IdCard}
          />
        </Link>
        <Link to="/portal/cpd" className="block">
          <StatCard
            label="CPD progress"
            value={cpd.data ? `${cpdPoints}/${cpdRequired}` : "—"}
            hint={cpd.data ? `${cpdOutstanding} outstanding` : "Available after approval"}
            icon={GraduationCap}
            well={cpd.data?.compliant ? "success" : "warning"}
          />
        </Link>
        <Link to={hasConferenceTicket ? "/portal/events" : "/conferences"} className="block">
          <StatCard
            label="Conference"
            value={hasConferenceTicket ? "Registered" : "Register"}
            hint={
              hasConferenceTicket
                ? `${conferenceRegs.length} ticket(s) on file`
                : "Browse published conferences"
            }
            icon={Ticket}
            well={hasConferenceTicket ? "success" : "primary"}
          />
        </Link>
        <Link to="/portal/certificates" className="block">
          <StatCard
            label="Certificates"
            value={certs.data?.length ?? 0}
            hint="Issued after attendance is marked"
            icon={CreditCard}
          />
        </Link>
        <Link to="/portal/library" className="block">
          <StatCard
            label="Library"
            value="Open"
            hint="Learning assets and member resources"
            icon={BookOpen}
          />
        </Link>
        <Link to="/portal/mentorship" className="block">
          <StatCard
            label="Mentorship"
            value="Open"
            hint="Apply, matches and sessions"
            icon={Handshake}
          />
        </Link>
        <Link to="/portal/careers" className="block">
          <StatCard
            label="Careers"
            value="Open"
            hint="Jobs, saves and applications"
            icon={Briefcase}
          />
        </Link>
        <Link to="/portal/threats" className="block">
          <StatCard
            label="Threat intelligence"
            value="Open"
            hint="Defensive advisories for members"
            icon={ShieldAlert}
          />
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Quick links</h2>
            <p className="text-xs text-muted-foreground">Jump into the tools you use most.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={`${item.to}-${item.label}`}
                to={item.to}
                search={item.to === "/portal/apply" ? {} : undefined}
                className="group rounded-2xl border border-border bg-card p-4 transition hover:border-[color:var(--brand-emerald)]/40 hover:bg-[color:var(--brand-tint)]/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-[color:var(--brand-deep)]">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Open <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <IdCard className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Membership status</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {membership
              ? `Active record for ${membership.membershipYear}. Digital card and renewal live here.`
              : application
                ? `Application status: ${String(application.status).replaceAll("_", " ")}`
                : "No application on file yet. Start when you are ready."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {membership && <StatusChip tone="success">{membership.status}</StatusChip>}
            {application && !membership && (
              <StatusChip tone="warning">
                {String(application.status).replaceAll("_", " ")}
              </StatusChip>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {membership ? (
              <Link
                to="/portal/card"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View card <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <Link
                to="/portal/apply"
                search={{}}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Apply now <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            <Link
              to="/portal/renew"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Renew <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              to="/portal/application"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Application file <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Events & CPD</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Conference, seminars, certificates and the CPD tracker. Required year: {cpdRequired}{" "}
            points.
          </p>
          {cpd.data && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${Math.min(100, (cpdPoints / Math.max(1, cpdRequired)) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {cpdPoints} recorded · {cpdOutstanding} outstanding
              </p>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/portal/events"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Open events <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              to="/portal/cpd"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              CPD log <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              to="/portal/certificates"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Certificates <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              to="/conferences"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Browse conferences <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {unread.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Recent alerts</h2>
            </div>
            <Link
              to="/portal/notifications"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {unread.map((n) => (
              <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {membership && membership.directoryVisible === false && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Find a DPO directory</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Listing is opt-in. Public verification of your membership number remains available
            regardless.
          </p>
          <Button
            size="sm"
            className="mt-4 rounded-full"
            onClick={() =>
              void apiPatch("/portal/directory-consent", { visible: true }).then(() => {
                notify.success("You are now listed in the directory.");
                void mem.refetch();
              })
            }
          >
            Opt in to directory
          </Button>
        </div>
      )}
    </div>
  );
}
