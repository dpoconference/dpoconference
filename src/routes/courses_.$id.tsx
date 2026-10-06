import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Award, BookOpen, GraduationCap, LockKeyhole } from "lucide-react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import {
  BankTransferCheckout,
  type BankTransferSession,
} from "@/components/payments/BankTransferCheckout";
import {
  PaymentMethodStep,
  resolveDefaultMethod,
  type PaymentMethodChoice,
} from "@/components/payments/PaymentMethodStep";
import { apiGet, apiObjectUrl, apiPost, ApiRequestError } from "@/lib/api";
import { startCheckout, loadPaymentsConfig } from "@/lib/checkout";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/format";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/app/PageSkeleton";

export const Route = createFileRoute("/courses_/$id")({
  head: () => ({ meta: [{ title: "Course | Data Protection Officers Conference" }] }),
  component: CoursePage,
});

type Course = {
  id: string;
  title: string;
  summary: string;
  bodyHtml: string;
  coverUrl?: string | null;
  mimeType?: string | null;
  priceNgn: number;
  guestAccess: boolean;
  isEnrolled: boolean;
  canAccess: boolean;
  percent: number;
  assignments: {
    id: string;
    title: string;
    instructions: string;
    dueOn?: string | null;
    submission?: { id: string; notes: string; status: string } | null;
  }[];
};

function CoursePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);
  const [method, setMethod] = useState<PaymentMethodChoice>("PAYSTACK");
  const [bankSession, setBankSession] = useState<BankTransferSession | null>(null);
  const [working, setWorking] = useState(false);
  const [assignmentNotes, setAssignmentNotes] = useState<Record<string, string>>({});

  const courseQuery = useQuery({
    queryKey: ["public-course", id, user?.id],
    queryFn: () => apiGet<Course>(`/public/courses/${id}`),
  });
  const course = courseQuery.data;
  const payConfig = useQuery({
    queryKey: ["payments-config"],
    queryFn: () => loadPaymentsConfig(),
    enabled: Boolean(user && course && course.priceNgn > 0 && !course.isEnrolled),
  });

  useEffect(() => {
    if (typeof course?.percent === "number") setPercent(course.percent);
  }, [course?.percent]);

  useEffect(() => {
    if (payConfig.data) setMethod(resolveDefaultMethod(payConfig.data));
  }, [payConfig.data]);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    setFileUrl(null);
    setFileError(null);
    if (!course?.canAccess) return;
    void apiObjectUrl(`/public/courses/${id}/file`)
      .then(({ url }) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        revoked = url;
        setFileUrl(url);
      })
      .catch((error) => {
        if (!cancelled)
          setFileError(
            error instanceof Error ? error.message : "Course material could not be loaded.",
          );
      });
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [id, course?.canAccess]);

  if (courseQuery.isPending)
    return (
      <SiteLayout>
        <PageSkeleton />
      </SiteLayout>
    );

  if (courseQuery.isError || !course) {
    return (
      <SiteLayout>
        <main className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-sm text-muted-foreground">This course could not be loaded.</p>
          <Button className="mt-4" variant="outline" onClick={() => void courseQuery.refetch()}>
            Try again
          </Button>
          <Link to="/courses" className="ml-3 text-sm font-semibold text-primary">
            Course catalogue
          </Link>
        </main>
      </SiteLayout>
    );
  }

  const free = Number(course.priceNgn) === 0;
  const isGuestPreview = course.guestAccess && free && !user;
  const locked = !course.canAccess;

  async function enrollFree() {
    setWorking(true);
    try {
      await apiPost(`/portal/courses/${id}/enroll`);
      await courseQuery.refetch();
      notify.success(
        "You are enrolled. Your progress and certificate will be saved to your account.",
      );
    } catch (error) {
      notify.error(
        error instanceof ApiRequestError ? error.message : "Could not enroll in this course.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function saveProgress(nextPercent: number) {
    setWorking(true);
    try {
      const result = await apiPost<{
        progress: { percent: number };
        certificate: { certificateNumber: string } | null;
      }>(`/portal/courses/${id}/progress`, { percent: nextPercent, completed: nextPercent >= 100 });
      setPercent(result.progress.percent);
      await courseQuery.refetch();
      if (result.certificate)
        notify.success(
          `Course complete. Certificate ${result.certificate.certificateNumber} is ready in your portal.`,
        );
      else notify.success("Course progress saved.");
    } catch (error) {
      notify.error(
        error instanceof ApiRequestError ? error.message : "Could not save course progress.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function submitAssignment(assignmentId: string) {
    setWorking(true);
    try {
      await apiPost(`/portal/library/assignments/${assignmentId}/submit`, {
        notes: assignmentNotes[assignmentId] ?? "",
      });
      await courseQuery.refetch();
      notify.success("Assignment submitted.");
    } catch (error) {
      notify.error(
        error instanceof ApiRequestError ? error.message : "Could not submit this assignment.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function purchaseCourse() {
    if (!user) return;
    setWorking(true);
    try {
      const result = await startCheckout({
        purpose: "COURSE",
        linkedId: id,
        email: user.email,
        method,
      });
      if (result.mode === "bank") {
        setBankSession(result.session);
        return;
      }
      if (result.cancelled) {
        notify.error("Payment was cancelled.");
        return;
      }
      if (result.verified) {
        notify.success("Payment confirmed. You are enrolled.");
        await courseQuery.refetch();
      }
    } catch (error) {
      notify.error(
        error instanceof ApiRequestError ? error.message : "Could not start course checkout.",
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Courses"
        eyebrow={
          course.guestAccess && free
            ? "Free guest course"
            : free
              ? "Free course"
              : "Professional course"
        }
        title={course.title}
        subtitle={course.summary}
      />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> All courses
        </Link>

        {course.coverUrl ? (
          <img src={course.coverUrl} alt="" className="max-h-80 w-full rounded-2xl object-cover" />
        ) : null}

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">
            {course.guestAccess && free ? (
              <GraduationCap className="h-4 w-4" />
            ) : (
              <LockKeyhole className="h-4 w-4" />
            )}
            {course.guestAccess && free
              ? "Guests can take this course without an account"
              : free
                ? "Free · account required to enroll"
                : formatNaira(Number(course.priceNgn))}
          </span>
          {course.isEnrolled ? (
            <span className="text-sm font-semibold text-emerald-700">
              Enrolled · {course.percent}% complete
            </span>
          ) : null}
          {course.isEnrolled && course.percent >= 100 ? (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
              <Award className="h-4 w-4" /> Certificate earned
            </span>
          ) : null}
        </div>

        {locked ? (
          <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">Enroll to access the course</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {free
                    ? "Create an account to enroll and save your progress. Membership is not required unless stated in the course access conditions."
                    : "A learner account and one-time course purchase are required. No membership is needed for courses available to all learners."}
                </p>
              </div>
            </div>
            {!user ? (
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/register" search={{ redirect: `/courses/${id}` }}>
                    Create account to continue
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/login" search={{ redirect: `/courses/${id}` }}>
                    Sign in
                  </Link>
                </Button>
              </div>
            ) : free ? (
              <Button loading={working} onClick={() => void enrollFree()}>
                Enroll for free
              </Button>
            ) : bankSession ? (
              <BankTransferCheckout
                session={bankSession}
                onSubmitted={() =>
                  notify.success("Receipt submitted. Access will be added after payment approval.")
                }
              />
            ) : (
              <div className="space-y-3">
                {payConfig.data ? (
                  <PaymentMethodStep config={payConfig.data} value={method} onChange={setMethod} />
                ) : null}
                {payConfig.isError ? (
                  <p className="text-sm text-destructive">
                    Payment options could not be loaded. Please try again.
                  </p>
                ) : null}
                <Button
                  loading={working || payConfig.isPending}
                  disabled={!payConfig.data}
                  onClick={() => void purchaseCourse()}
                >
                  {method === "BANK_TRANSFER"
                    ? "Continue to bank transfer"
                    : `Purchase course · ${formatNaira(Number(course.priceNgn))}`}
                </Button>
              </div>
            )}
          </section>
        ) : null}

        {course.canAccess && user && !course.isEnrolled && course.guestAccess && free ? (
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-[color:var(--brand-tint)]/40 p-5">
            <p className="max-w-xl text-sm">
              You can continue as a guest, or enroll for free to save your progress and earn a
              certificate.
            </p>
            <Button loading={working} onClick={() => void enrollFree()}>
              Enroll and save progress
            </Button>
          </section>
        ) : null}

        {course.canAccess ? (
          <>
            <article className="prose prose-sm max-w-none rounded-2xl border border-border bg-card p-6">
              {course.bodyHtml ? (
                <div dangerouslySetInnerHTML={{ __html: course.bodyHtml }} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Course content is available in the learning material below.
                </p>
              )}
            </article>
            {fileUrl ? (
              <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 font-semibold">
                  <BookOpen className="h-4 w-4" /> Course material
                </h2>
                {course.mimeType?.startsWith("image/") ? (
                  <img
                    src={fileUrl}
                    alt={course.title}
                    className="max-h-[75vh] w-full rounded-xl object-contain"
                  />
                ) : (
                  <iframe
                    title={`${course.title} course material`}
                    src={fileUrl}
                    className="h-[70vh] w-full rounded-xl border border-border"
                  />
                )}
              </section>
            ) : null}
            {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}
            {course.assignments.length > 0 ? (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-semibold">Course assignments</h2>
                <ul className="mt-3 space-y-3">
                  {course.assignments.map((assignment) => (
                    <li key={assignment.id} className="border-t border-border pt-3 first:border-0">
                      <h3 className="text-sm font-semibold">{assignment.title}</h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {assignment.instructions}
                      </p>
                      {assignment.dueOn ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Due {new Date(assignment.dueOn).toLocaleDateString()}
                        </p>
                      ) : null}
                      {user && course.isEnrolled ? (
                        <div className="mt-3 space-y-2">
                          {assignment.submission ? (
                            <p className="text-xs font-semibold text-emerald-700">
                              Submitted · {assignment.submission.status}
                            </p>
                          ) : null}
                          <textarea
                            className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            aria-label={`Submission for ${assignment.title}`}
                            placeholder="Write your response"
                            value={
                              assignmentNotes[assignment.id] ?? assignment.submission?.notes ?? ""
                            }
                            onChange={(event) =>
                              setAssignmentNotes({
                                ...assignmentNotes,
                                [assignment.id]: event.target.value,
                              })
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            loading={working}
                            disabled={
                              (
                                assignmentNotes[assignment.id] ??
                                assignment.submission?.notes ??
                                ""
                              ).trim().length < 3
                            }
                            onClick={() => void submitAssignment(assignment.id)}
                          >
                            {assignment.submission ? "Update submission" : "Submit assignment"}
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {user && course.isEnrolled ? (
              <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
                <h2 className="font-semibold">Your learning progress</h2>
                <label className="flex items-center gap-3 text-sm">
                  <span>Progress</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={percent}
                    className="flex-1"
                    onChange={(event) => setPercent(Number(event.target.value))}
                  />
                  <span className="w-12 text-right font-semibold">{percent}%</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    loading={working}
                    onClick={() => void saveProgress(percent)}
                  >
                    Save progress
                  </Button>
                  <Button loading={working} onClick={() => void saveProgress(100)}>
                    Complete course
                  </Button>
                  {percent >= 100 ? (
                    <Button asChild variant="outline">
                      <Link to="/portal/certificates">View certificates</Link>
                    </Button>
                  ) : null}
                </div>
              </section>
            ) : isGuestPreview ? (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-[color:var(--brand-tint)]/40 p-5">
                <p className="max-w-xl text-sm">
                  You can study this course as a guest. Create an account if you want to save
                  progress and earn a course certificate.
                </p>
                <Button asChild>
                  <Link to="/register" search={{ redirect: `/courses/${id}` }}>
                    Save progress with an account
                  </Link>
                </Button>
              </section>
            ) : null}
          </>
        ) : null}
      </main>
    </SiteLayout>
  );
}
