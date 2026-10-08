import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, BookOpen, GraduationCap, Ticket } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { greetingWord } from "@/lib/format";

export const Route = createFileRoute("/portal/")({
  component: PortalHome,
});

type CourseEnrollment = {
  id: string;
  course: { id: string; title: string; summary: string };
  percent: number;
  completedAt: string | null;
};

function PortalHome() {
  const { user } = useAuth();
  const events = useQuery({
    queryKey: ["my-events-dash"],
    queryFn: () =>
      apiGet<{
        conference: { id: string; registrationNumber: string; status: string }[];
        seminars: { id: string; registrationNumber: string; attendanceStatus: string }[];
      }>("/events/me"),
  });
  const courses = useQuery({
    queryKey: ["my-courses-dashboard"],
    queryFn: () => apiGet<CourseEnrollment[]>("/portal/courses"),
  });
  const cpd = useQuery({
    queryKey: ["my-cpd-dashboard"],
    queryFn: () =>
      apiGet<{ points: number | string; required: number; outstanding: number | string }>("/portal/cpd"),
  });
  const certificates = useQuery({
    queryKey: ["my-certificates-dashboard"],
    queryFn: () => apiGet<{ id: string }[]>("/portal/certificates"),
  });

  if (events.isPending || courses.isPending || cpd.isPending || certificates.isPending) {
    return <PageSkeleton />;
  }

  const conferenceEvents = events.data?.conference ?? [];
  const seminarEvents = events.data?.seminars ?? [];
  const enrollments = courses.data ?? [];
  const completedCourses = enrollments.filter((enrollment) => enrollment.completedAt).length;

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        icon={GraduationCap}
        eyebrow="Conference and learning workspace"
        title={`${greetingWord()}, ${user?.firstName ?? "there"}.`}
        subtitle="Your conference registrations, continuing-learning courses, CPD progress and certificates."
        actions={
          <Button asChild className="rounded-full">
            <Link to="/courses">
              Browse courses <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold">Your activity</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/portal/events" className="block">
            <StatCard
              label="Conference registrations"
              value={conferenceEvents.length}
              hint={`${seminarEvents.length} seminar registration${seminarEvents.length === 1 ? "" : "s"}`}
              icon={Ticket}
              well="primary"
            />
          </Link>
          <Link to="/portal/courses" className="block">
            <StatCard
              label="My courses"
              value={enrollments.length}
              hint={`${completedCourses} completed`}
              icon={BookOpen}
            />
          </Link>
          <Link to="/portal/cpd" className="block">
            <StatCard
              label="CPD points"
              value={Number(cpd.data?.points ?? 0)}
              hint={`${Number(cpd.data?.outstanding ?? 0)} points outstanding`}
              icon={GraduationCap}
            />
          </Link>
          <Link to="/portal/certificates" className="block">
            <StatCard
              label="Certificates"
              value={certificates.data?.length ?? 0}
              hint="Available to view and download"
              icon={Award}
            />
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Continue learning</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Resume a course or find your next free or paid learning programme.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/portal/courses">View my courses</Link>
          </Button>
        </div>
        {enrollments.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {enrollments.slice(0, 6).map((enrollment) => (
              <Link
                key={enrollment.id}
                to="/courses/$id"
                params={{ id: enrollment.course.id }}
                className="rounded-xl border border-border p-4 transition hover:border-primary/40 hover:bg-muted/30"
              >
                <h3 className="font-semibold">{enrollment.course.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{enrollment.course.summary}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${enrollment.percent}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {enrollment.completedAt ? "Completed" : `${enrollment.percent}% complete`}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              You are not enrolled in a course yet. Browse the catalogue to find free and paid courses.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link to="/courses">Explore courses</Link>
            </Button>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">Conference and events</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View your conference tickets, seminar bookings and attendance records.
          </p>
          <Link to="/portal/events" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
            View my events <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">CPD and certificates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review event CPD awards and download certificates issued for completed learning.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link to="/portal/cpd" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              CPD activity <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/portal/certificates" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              My certificates <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
