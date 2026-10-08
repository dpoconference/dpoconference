import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  Handshake,
  Inbox,
  LayoutDashboard,
  Newspaper,
  Receipt,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { NeedActionPanel } from "@/components/app/NeedActionPanel";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatCard } from "@/components/app/StatCard";
import { useAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { formatNaira, greetingWord } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: Page,
});

const DONUT = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Page() {
  const { user, hasPermission } = useAuth();
  const q = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () =>
      apiGet<{
        membership: {
          total: number;
          active: number;
          expired: number;
          pendingApplications: number;
          byCategory: { category: string; count: number }[];
          paymentsCount: number;
          paymentsSum: number;
        };
      }>("/admin/dashboard"),
  });
  const home = useQuery({
    queryKey: ["admin-home"],
    queryFn: () =>
      apiGet<{ conferenceRegs: number; seminarRegs: number; newContacts: number; openTickets: number }>("/admin/home"),
  });

  if (q.isPending) return <PageSkeleton />;
  const m = q.data?.membership;
  if (!m) return null;

  const firstName = user?.firstName ?? "Secretariat";
  const actions = [
    ...(m.pendingApplications
      ? [
          {
            id: "apps",
            title: `${m.pendingApplications} application${m.pendingApplications === 1 ? "" : "s"} awaiting review`,
            body: "Paid or submitted files ready for Secretariat decision.",
            href: "/admin/applications",
            cta: "Review",
            urgency: "high" as const,
          },
        ]
      : []),
    ...((home.data?.openTickets ?? 0) > 0
      ? [
          {
            id: "tix",
            title: `${home.data?.openTickets} open support tickets`,
            body: "Members are waiting on a Secretariat reply.",
            href: "/admin/contacts",
            cta: "Inbox",
            urgency: "medium" as const,
          },
        ]
      : []),
    ...((home.data?.newContacts ?? 0) > 0
      ? [
          {
            id: "con",
            title: `${home.data?.newContacts} new contact submissions`,
            body: "Partnership and general enquiries from the public site.",
            href: "/admin/contacts",
            cta: "Open",
            urgency: "low" as const,
          },
        ]
      : []),
  ];

  const tiles = [
    {
      to: "/admin/applications",
      label: "Applications",
      desc: "Review paid membership files and request information",
      icon: ClipboardList,
      meta: `${m.pendingApplications} pending`,
    },
    {
      to: "/admin/events",
      label: "Events",
      desc: "Conference packages, seminars and materials",
      icon: Ticket,
      meta: `${home.data?.conferenceRegs ?? 0} conf regs`,
    },
    {
      to: "/admin/contacts",
      label: "Inbox",
      desc: "Public contacts and member support tickets",
      icon: Inbox,
      meta: `${home.data?.openTickets ?? 0} open tickets`,
    },
    {
      to: "/admin/reports",
      label: "Reports",
      desc: "Export membership and payment CSV extracts",
      icon: FileSpreadsheet,
      meta: `${m.paymentsCount} payments`,
    },
    ...(hasPermission("cms.manage")
      ? [
          {
            to: "/admin/learning",
            label: "Learning and courses",
            desc: "Create and publish free or paid continuing-learning courses",
            icon: BookOpen,
            meta: "LMS",
          },
          {
            to: "/admin/certificates",
            label: "Course certificates",
            desc: "Review, issue and revoke certificates for completed courses",
            icon: Award,
            meta: "Certificates",
          },
          {
            to: "/admin/cms",
            label: "Content",
            desc: "News, resources and public pages",
            icon: Newspaper,
            meta: "CMS",
          },
          {
            to: "/admin/jobs",
            label: "Jobs",
            desc: "Publish and manage vacancy listings",
            icon: Briefcase,
            meta: "Careers",
          },
        ]
      : []),
    ...(hasPermission("fees.manage")
      ? [
          {
            to: "/admin/fees",
            label: "Fees",
            desc: "Membership and event fee schedules",
            icon: Receipt,
            meta: "Pricing",
          },
        ]
      : []),
    {
      to: "/admin/cpd",
      label: "CPD",
      desc: "Continuing professional development settings",
      icon: GraduationCap,
      meta: "Learning",
    },
    ...(hasPermission("membership.review")
      ? [
          {
            to: "/admin/mentorship",
            label: "Mentorship",
            desc: "Match mentors and review programme requests",
            icon: Handshake,
            meta: "Programme",
          },
        ]
      : []),
    ...(hasPermission("users.manage")
      ? [
          {
            to: "/admin/users",
            label: "Staff",
            desc: "Invite and manage secretariat accounts",
            icon: Users,
            meta: "Access",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        icon={LayoutDashboard}
        eyebrow="Admin Control Suite"
        title={`${greetingWord()}, ${firstName}.`}
        subtitle="Membership, events and secretariat operations for the current year."
        actions={
          <ButtonLink to="/admin/applications">
            Review applications
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        }
      />

      {!hasPermission("fees.manage") && (
        <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          You are signed in with staff access. Fee overrides and some approvals may be limited.
        </p>
      )}

      <NeedActionPanel items={actions} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active members" value={m.active} hint={`${m.total} total · ${m.expired} expired`} icon={Users} />
        <StatCard label="Pending applications" value={m.pendingApplications} icon={ClipboardList} well="warning" />
        <StatCard
          label="Membership revenue"
          value={formatNaira(m.paymentsSum)}
          hint={`${m.paymentsCount} successful payments`}
          icon={Wallet}
          well="gold"
        />
        <StatCard
          label="Event registrations"
          value={(home.data?.conferenceRegs ?? 0) + (home.data?.seminarRegs ?? 0)}
          hint={`${home.data?.conferenceRegs ?? 0} conference · ${home.data?.seminarRegs ?? 0} seminar`}
          icon={Ticket}
        />
      </div>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold">Operations</h2>
          <p className="text-xs text-muted-foreground">Shortcut into every secretariat surface you can access.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.to}
                to={tile.to as never}
                className="group rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {tile.meta}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold">{tile.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tile.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Open <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Members by category</h2>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Current approved memberships across tracks.</p>
          {m.byCategory.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={m.byCategory}
                      dataKey="count"
                      nameKey="category"
                      innerRadius={50}
                      outerRadius={84}
                      paddingAngle={2}
                      stroke="var(--background)"
                      strokeWidth={2}
                    >
                      {m.byCategory.map((_, i) => (
                        <Cell key={i} fill={DONUT[i % DONUT.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-sm">
                {m.byCategory.map((row, i) => (
                  <li key={row.category} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: DONUT[i % DONUT.length] }} />
                      {row.category}
                    </span>
                    <span className="font-semibold">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Role notes</h2>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">What each signed-in type sees.</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="rounded-lg border border-border px-3 py-2">
              <span className="font-medium">Applicant</span>
              <p className="text-xs text-muted-foreground">Application stepper, documents, pay, support.</p>
            </li>
            <li className="rounded-lg border border-border px-3 py-2">
              <span className="font-medium">Member</span>
              <p className="text-xs text-muted-foreground">Card, renew, events, CPD, certificates, directory opt-in.</p>
            </li>
            <li className="rounded-lg border border-border px-3 py-2">
              <span className="font-medium">Corporate admin</span>
              <p className="text-xs text-muted-foreground">Seats, staff CPD, employer vacancies.</p>
            </li>
            <li className="rounded-lg border border-border px-3 py-2">
              <span className="font-medium">Staff</span>
              <p className="text-xs text-muted-foreground">Applications, events, CMS, reports — limited fee/approve rights.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ButtonLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to as never}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      {children}
    </Link>
  );
}
