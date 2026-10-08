import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  BookOpen,
  GraduationCap,
  Ticket,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatNaira, greetingWord } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: Page,
});

type EventDashboard = {
  totals: {
    conferenceRegistrations: number;
    confirmedConferenceRegistrations: number;
    pendingConferenceRegistrations: number;
    waitlistEntries: number;
    groupRegistrations: number;
    pendingLoginReleases: number;
    publishedCourses: number;
    courseEnrollments: number;
    courseCertificates: number;
  };
  conference: { paidCount: number; revenue: number };
  seminar: { paidCount: number; revenue: number };
  recent: {
    id: string;
    name: string;
    email?: string;
    event: string;
    status: string;
    registrationNumber: string;
  }[];
};

function Page() {
  const { user } = useAuth();
  const dashboard = useQuery({
    queryKey: ["conference-lms-admin-dashboard"],
    queryFn: () => apiGet<EventDashboard>("/admin/events/dashboard"),
  });

  if (dashboard.isPending) return <PageSkeleton />;

  if (dashboard.isError || !dashboard.data) {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-destructive">Conference and learning dashboard could not be loaded.</p>
        <Button variant="outline" onClick={() => void dashboard.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { totals, conference, seminar, recent } = dashboard.data;
  const totalRevenue = conference.revenue + seminar.revenue;
  const shortcuts = [
    {
      to: "/admin/events",
      label: "Conference operations",
      description: "Conferences, registrations, waitlists, attendance and attendee access.",
      icon: Ticket,
    },
    {
      to: "/admin/learning",
      label: "Learning and courses",
      description: "Create and publish free or paid continuing-learning courses.",
      icon: BookOpen,
    },
    {
      to: "/admin/certificates",
      label: "Course certificates",
      description: "Review, issue and revoke certificates for completed courses.",
      icon: Award,
    },
    {
      to: "/admin/cpd",
      label: "CPD",
      description: "Review continuing professional development records and settings.",
      icon: GraduationCap,
    },
    {
      to: "/admin/payments",
      label: "Payments",
      description: "Review conference, seminar and course transactions.",
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        icon={Ticket}
        eyebrow="Conference and learning operations"
        title={`${greetingWord()}, ${user?.firstName ?? "Secretariat"}.`}
        subtitle="Manage conference registrations, attendee access and year-round learning."
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold">Conference and LMS overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Conference registrations"
            value={totals.conferenceRegistrations}
            hint={`${totals.confirmedConferenceRegistrations} paid or confirmed`}
            icon={Ticket}
          />
          <StatCard
            label="Awaiting learner access"
            value={totals.pendingLoginReleases}
            hint="Conference and seminar participants awaiting setup-link release"
            icon={GraduationCap}
            well={totals.pendingLoginReleases ? "warning" : undefined}
          />
          <StatCard
            label="Conference waitlist"
            value={totals.waitlistEntries}
            hint={`${totals.groupRegistrations} organisation registrations`}
            icon={BookOpen}
          />
          <StatCard
            label="Published courses"
            value={totals.publishedCourses}
            hint={`${totals.courseEnrollments} learner enrolments`}
            icon={Award}
          />
          <StatCard
            label="Course certificates"
            value={totals.courseCertificates}
            hint="Issued certificates"
            icon={Award}
          />
          <StatCard
            label="Event revenue"
            value={formatNaira(totalRevenue)}
            hint={`${conference.paidCount + seminar.paidCount} successful event payments`}
            icon={Wallet}
            well="gold"
          />
          <StatCard
            label="Awaiting payment"
            value={totals.pendingConferenceRegistrations}
            hint="Conference registrations not yet fulfilled"
            icon={Ticket}
            well={totals.pendingConferenceRegistrations ? "warning" : undefined}
          />
          <StatCard
            label="Seminar payments"
            value={seminar.paidCount}
            hint={formatNaira(seminar.revenue)}
            icon={GraduationCap}
          />
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold">Operations</h2>
          <p className="text-xs text-muted-foreground">
            Conference delivery and continuous learning tools.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/30"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Open <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Recent conference registrations</h2>
            <p className="mt-1 text-xs text-muted-foreground">Latest attendee registrations across conferences.</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/events">View registrations</Link>
          </Button>
        </div>
        {recent.length ? (
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-muted-foreground">
                <th className="p-2">Attendee</th>
                <th className="p-2">Registration</th>
                <th className="p-2">Conference</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.slice(0, 8).map((registration) => (
                <tr key={registration.id} className="border-t">
                  <td className="p-2">
                    <span className="font-medium">{registration.name || "Attendee"}</span>
                    {registration.email ? (
                      <span className="block text-xs text-muted-foreground">{registration.email}</span>
                    ) : null}
                  </td>
                  <td className="p-2 font-mono text-xs">{registration.registrationNumber}</td>
                  <td className="p-2">{registration.event}</td>
                  <td className="p-2">{registration.status.replaceAll("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="py-6 text-sm text-muted-foreground">No conference registrations yet.</p>
        )}
      </section>
    </div>
  );
}
