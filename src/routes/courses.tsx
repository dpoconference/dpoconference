import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, GraduationCap, LockKeyhole, Search } from "lucide-react";
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

const COURSE_CATALOG_CACHE_KEY = "dpo-public-course-catalog-v1";

function readCachedCatalog(): Course[] | null {
  try {
    const cached = localStorage.getItem(COURSE_CATALOG_CACHE_KEY);
    if (!cached) return null;
    const parsed: unknown = JSON.parse(cached);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (course): course is Course =>
        typeof course === "object" &&
        course !== null &&
        typeof course.id === "string" &&
        typeof course.title === "string" &&
        typeof course.summary === "string" &&
        typeof course.guestAccess === "boolean" &&
        (typeof course.priceNgn === "number" || typeof course.priceNgn === "string"),
    );
  } catch {
    return null;
  }
}

function CoursesPage() {
  const [search, setSearch] = useState("");
  const [accessFilter, setAccessFilter] = useState<"all" | "free" | "paid" | "guest">("all");
  const q = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      try {
        const courses = await apiGet<Course[]>("/public/courses");
        const publicOnly = courses.map(
          ({ id, title, summary, coverUrl, guestAccess, priceNgn }) => ({
            id,
            title,
            summary,
            coverUrl,
            guestAccess,
            priceNgn,
          }),
        );
        try {
          localStorage.setItem(COURSE_CATALOG_CACHE_KEY, JSON.stringify(publicOnly));
        } catch {
          // Catalog browsing remains functional when browser storage is unavailable.
        }
        return { courses, isCached: false };
      } catch (error) {
        const cached = readCachedCatalog();
        if (cached) {
          return {
            courses: cached.map((course) => ({ ...course, isEnrolled: false, percent: 0 })),
            isCached: true,
          };
        }
        throw error;
      }
    },
  });
  const filteredCourses = useMemo(
    () =>
      (q.data?.courses ?? []).filter((course) => {
        const isFree = Number(course.priceNgn) === 0;
        const matchesSearch = `${course.title} ${course.summary}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        const matchesAccess =
          accessFilter === "all" ||
          (accessFilter === "free" && isFree) ||
          (accessFilter === "paid" && !isFree) ||
          (accessFilter === "guest" && course.guestAccess && isFree);
        return matchesSearch && matchesAccess;
      }),
    [q.data, search, accessFilter],
  );

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
        {!q.isPending && !q.isError && q.data?.courses.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No courses are published yet. Check back soon.
          </div>
        ) : null}

        {!q.isPending && !q.isError && q.data && q.data.courses.length > 0 ? (
          <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <label className="flex items-center gap-2 rounded-md border border-input px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses"
                aria-label="Search courses"
                className="min-h-11 w-full bg-transparent text-sm outline-none"
              />
            </label>
            <label className="flex items-center gap-3 rounded-md border border-input px-3 text-sm">
              <span className="shrink-0 text-muted-foreground">Show</span>
              <select
                value={accessFilter}
                onChange={(event) =>
                  setAccessFilter(event.target.value as "all" | "free" | "paid" | "guest")
                }
                aria-label="Filter courses by price and access"
                className="min-h-11 w-full bg-transparent font-medium outline-none"
              >
                <option value="all">All courses</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="guest">Free guest access</option>
              </select>
            </label>
          </div>
        ) : null}
        {q.data?.isCached ? (
          <p
            role="status"
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            Showing the last saved course catalogue while the course service is unavailable.
            Enrollment and checkout require a live connection.
          </p>
        ) : null}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => {
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
          {!q.isPending && !q.isError && q.data?.courses.length && filteredCourses.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
              No courses match those filters. Try a different search or access option.
            </p>
          ) : null}
        </section>
      </main>
    </SiteLayout>
  );
}
