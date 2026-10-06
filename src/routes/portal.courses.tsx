import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/portal/courses")({
  component: MyCoursesPage,
});

type CourseEnrollment = {
  id: string;
  course: {
    id: string;
    title: string;
    summary: string;
    coverUrl?: string | null;
    priceNgn: number | string;
  };
  percent: number;
  completedAt?: string | null;
};

function MyCoursesPage() {
  const q = useQuery({
    queryKey: ["my-courses"],
    queryFn: () => apiGet<CourseEnrollment[]>("/portal/courses"),
  });

  if (q.isPending) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="My courses"
        subtitle="Pick up where you left off. Free and paid courses are available without a membership requirement unless a course says otherwise."
        actions={
          <Button asChild className="rounded-full">
            <Link to="/courses">
              Browse courses <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />
      {q.isError ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm">
          <p>Your courses could not be loaded.</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => void q.refetch()}>
            Try again
          </Button>
        </div>
      ) : null}
      {!q.isError && (q.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">You have not enrolled in a course yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse free courses or purchase a programme to start learning.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link to="/courses">Explore course catalogue</Link>
          </Button>
        </div>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(q.data ?? []).map(({ id, course, percent, completedAt }) => (
          <article key={id} className="overflow-hidden rounded-2xl border border-border bg-card">
            {course.coverUrl ? (
              <img src={course.coverUrl} alt="" className="h-40 w-full object-cover" />
            ) : (
              <div className="grid h-40 place-items-center bg-muted">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{course.title}</h2>
                {completedAt ? (
                  <Award
                    className="h-5 w-5 shrink-0 text-emerald-700"
                    aria-label="Course completed"
                  />
                ) : null}
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{course.summary}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span className="font-semibold">{percent}%</span>
                </div>
                <progress
                  className="h-2 w-full accent-primary"
                  max={100}
                  value={percent}
                  aria-label={`${percent}% complete`}
                />
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  {Number(course.priceNgn) > 0
                    ? formatNaira(Number(course.priceNgn))
                    : "Free course"}
                </span>
                <Button asChild size="sm" className="rounded-full">
                  <Link to="/courses/$id" params={{ id: course.id }}>
                    {completedAt ? "Review course" : "Continue"}
                  </Link>
                </Button>
              </div>
              {completedAt ? (
                <Link
                  to="/portal/certificates"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  View your certificate <ArrowRight className="h-3 w-3" />
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
