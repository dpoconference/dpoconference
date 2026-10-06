import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, GraduationCap, LockKeyhole } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { apiGet } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Online Courses | Data Protection Officers Conference" },
      {
        name: "description",
        content: "Explore free guest courses and paid professional learning programmes.",
      },
    ],
  }),
  component: CoursesPage,
});

type Course = {
  id: string;
  title: string;
  summary: string;
  coverUrl?: string | null;
  guestAccess: boolean;
  priceNgn: number;
  isEnrolled: boolean;
  percent: number;
};

function CoursesPage() {
  const q = useQuery({
    queryKey: ["public-courses"],
    queryFn: () => apiGet<Course[]>("/public/courses"),
  });

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Courses"
        eyebrow="Online learning"
        title="Courses for every stage of your privacy career"
        subtitle="Start selected free courses instantly as a guest, or create an account to save progress, earn certificates, and purchase paid courses."
      />
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--brand-deep)]">Course catalogue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No membership is required for guest-access courses.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/register">Create a learner account</Link>
          </Button>
        </div>

        {q.isPending ? <Skeleton className="h-56" /> : null}
        {q.isError ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm">
            <p>Courses could not be loaded.</p>
            <Button className="mt-3" size="sm" variant="outline" onClick={() => void q.refetch()}>
              Try again
            </Button>
          </div>
        ) : null}
        {!q.isPending && !q.isError && q.data?.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No courses are published yet. Check back soon.
          </div>
        ) : null}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {(q.data ?? []).map((course) => {
            const isFree = Number(course.priceNgn) === 0;
            return (
              <article
                key={course.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                {course.coverUrl ? (
                  <img src={course.coverUrl} alt="" className="h-48 w-full object-cover" />
                ) : (
                  <div className="grid h-48 place-items-center bg-[color:var(--brand-tint)]/50">
                    <BookOpen className="h-10 w-10 text-[color:var(--brand-deep)]" />
                  </div>
                )}
                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-tint)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-deep)]">
                      {course.guestAccess && isFree ? (
                        <GraduationCap className="h-3.5 w-3.5" />
                      ) : (
                        <LockKeyhole className="h-3.5 w-3.5" />
                      )}
                      {course.guestAccess && isFree
                        ? "Free · Guest access"
                        : isFree
                          ? "Free · Account required"
                          : "Paid course"}
                    </span>
                    {course.isEnrolled ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        Enrolled · {course.percent}%
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[color:var(--brand-deep)]">
                      {course.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {course.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-sm font-semibold">
                      {isFree ? "Free" : formatNaira(Number(course.priceNgn))}
                    </p>
                    <Button asChild className="rounded-full">
                      <Link to="/courses/$id" params={{ id: course.id }}>
                        {course.isEnrolled
                          ? "Continue"
                          : course.guestAccess && isFree
                            ? "Start course"
                            : "View course"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </SiteLayout>
  );
}
