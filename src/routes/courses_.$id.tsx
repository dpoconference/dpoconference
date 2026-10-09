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
  hasMaterial: boolean;
  chapters: {
    id: string;
    title: string;
    summary: string;
    bodyText: string;
    mimeType?: string | null;
    sortOrder: number;
    hasFile: boolean;
  }[];
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
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [chapterFileUrl, setChapterFileUrl] = useState<string | null>(null);
  const [chapterFileError, setChapterFileError] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);
  const [method, setMethod] = useState<PaymentMethodChoice>("PAYSTACK");
  const [bankSession, setBankSession] = useState<BankTransferSession | null>(null);
  const [working, setWorking] = useState(false);
  const [guestBuyer, setGuestBuyer] = useState({ fullName: "", email: "", phone: "", country: "" });
  const [guestConsent, setGuestConsent] = useState(false);
  const [assignmentNotes, setAssignmentNotes] = useState<Record<string, string>>({});

  const courseQuery = useQuery({
    queryKey: ["public-course", id, user?.id],
    queryFn: () => apiGet<Course>(`/public/courses/${id}`),
  });
  const course = courseQuery.data;
  const payConfig = useQuery({
    queryKey: ["payments-config"],
    queryFn: () => loadPaymentsConfig(),
    enabled: Boolean(course && course.priceNgn > 0 && !course.isEnrolled),
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
    if (!course?.canAccess || !course.hasMaterial) return;
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
  }, [id, course?.canAccess, course?.hasMaterial]);

  useEffect(() => {
    const chapters = course?.chapters ?? [];
    const selectedChapter =
      chapters.find((chapter) => chapter.id === selectedChapterId) ?? chapters[0];
    setChapterFileUrl(null);
    setChapterFileError(null);
    if (!selectedChapter) {
      if (selectedChapterId) setSelectedChapterId("");
      return;
    }
    if (selectedChapter.id !== selectedChapterId) {
      setSelectedChapterId(selectedChapter.id);
      return;
    }
    if (!course?.canAccess || !selectedChapter.hasFile) return;

    let revoked: string | null = null;
    let cancelled = false;
    void apiObjectUrl(`/public/courses/${id}/chapters/${selectedChapter.id}/file`)
      .then(({ url }) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        revoked = url;
        setChapterFileUrl(url);
      })
      .catch((error) => {
        if (!cancelled)
          setChapterFileError(
            error instanceof Error ? error.message : "Chapter file could not be loaded.",
          );
      });
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [id, course?.canAccess, course?.chapters, selectedChapterId]);

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
    if (
      !user &&
      (!guestBuyer.fullName.trim() || !guestBuyer.email.trim() || !guestBuyer.phone.trim())
    ) {
      notify.error("Enter your name, email, and phone number to continue.");
      return;
    }
    if (!user && !guestConsent) {
      notify.error("Accept the terms, privacy notice, and refund policy to continue.");
      return;
    }
    setWorking(true);
    try {
      const result = await startCheckout({
        purpose: "COURSE",
        linkedId: id,
        email: user?.email ?? guestBuyer.email.trim().toLowerCase(),
        method,
        ...(!user
          ? {
              buyer: {
                fullName: guestBuyer.fullName.trim(),
                phone: guestBuyer.phone.trim(),
                ...(guestBuyer.country.trim() ? { country: guestBuyer.country.trim() } : {}),
                termsAccepted: true as const,
                privacyAccepted: true as const,
                refundPolicyAccepted: true as const,
              },
            }
          : {}),
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
        if (user) {
          notify.success("Payment confirmed. You are enrolled.");
          await courseQuery.refetch();
        } else {
          notify.success("Payment confirmed. Check your email for the secure account setup link.");
        }
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
            {!user && free ? (
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
            ) : !user ? (
              bankSession ? (
                <BankTransferCheckout
                  session={bankSession}
                  onSubmitted={() =>
                    notify.success(
                      "Receipt received. Course access and account setup follow payment approval.",
                    )
                  }
                />
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Buy this course without an existing account. After payment is confirmed, we’ll
                    create your learner account and email you a one-time password setup link.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      Full name
                      <input
                        required
                        autoComplete="name"
                        className="w-full rounded-md border px-3 py-2"
                        value={guestBuyer.fullName}
                        onChange={(event) =>
                          setGuestBuyer({ ...guestBuyer, fullName: event.target.value })
                        }
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      Email
                      <input
                        required
                        type="email"
                        autoComplete="email"
                        className="w-full rounded-md border px-3 py-2"
                        value={guestBuyer.email}
                        onChange={(event) =>
                          setGuestBuyer({ ...guestBuyer, email: event.target.value })
                        }
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      Phone number
                      <input
                        required
                        type="tel"
                        autoComplete="tel"
                        className="w-full rounded-md border px-3 py-2"
                        value={guestBuyer.phone}
                        onChange={(event) =>
                          setGuestBuyer({ ...guestBuyer, phone: event.target.value })
                        }
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      Country (optional)
                      <input
                        autoComplete="country-name"
                        className="w-full rounded-md border px-3 py-2"
                        value={guestBuyer.country}
                        onChange={(event) =>
                          setGuestBuyer({ ...guestBuyer, country: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={guestConsent}
                      onChange={(event) => setGuestConsent(event.target.checked)}
                    />
                    <span>
                      I agree to the{" "}
                      <Link
                        to="/legal/$slug"
                        params={{ slug: "terms-of-use" }}
                        className="font-semibold text-primary"
                      >
                        terms
                      </Link>
                      ,{" "}
                      <Link
                        to="/legal/$slug"
                        params={{ slug: "privacy-notice" }}
                        className="font-semibold text-primary"
                      >
                        privacy notice
                      </Link>
                      , and{" "}
                      <Link
                        to="/legal/$slug"
                        params={{ slug: "refund-policy" }}
                        className="font-semibold text-primary"
                      >
                        refund policy
                      </Link>
                      .
                    </span>
                  </label>
                  {payConfig.data ? (
                    <PaymentMethodStep
                      config={payConfig.data}
                      value={method}
                      onChange={setMethod}
                    />
                  ) : null}
                  {payConfig.isError ? (
                    <p className="text-sm text-destructive">
                      Payment options could not be loaded. Please try again.
                    </p>
                  ) : null}
                  <Button
                    loading={working || payConfig.isPending}
                    disabled={!payConfig.data || !guestConsent}
                    onClick={() => void purchaseCourse()}
                  >
                    {method === "BANK_TRANSFER"
                      ? "Continue to bank transfer"
                      : `Buy course · ${formatNaira(Number(course.priceNgn))}`}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      search={{ redirect: `/courses/${id}` }}
                      className="font-semibold text-primary"
                    >
                      Sign in before purchasing
                    </Link>
                  </p>
                </div>
              )
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
            {course.bodyHtml ? (
              <article className="prose prose-sm max-w-none rounded-2xl border border-border bg-card p-6">
                <div dangerouslySetInnerHTML={{ __html: course.bodyHtml }} />
              </article>
            ) : null}
            {course.chapters.length > 0 ? (
              <section className="grid gap-5 rounded-2xl border border-border bg-card p-5 lg:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.5fr)]">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold">
                    <BookOpen className="h-4 w-4" /> Course chapters
                  </h2>
                  <ol className="mt-3 space-y-2">
                    {course.chapters.map((chapter, index) => (
                      <li key={chapter.id}>
                        <button
                          type="button"
                          aria-current={selectedChapterId === chapter.id ? "step" : undefined}
                          className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                            selectedChapterId === chapter.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/40"
                          }`}
                          onClick={() => setSelectedChapterId(chapter.id)}
                        >
                          <span className="block text-xs text-muted-foreground">
                            Chapter {index + 1}
                          </span>
                          <span className="mt-1 block font-medium">{chapter.title}</span>
                          {chapter.summary ? (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {chapter.summary}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
                {(() => {
                  const activeChapter = course.chapters.find(
                    (chapter) => chapter.id === selectedChapterId,
                  );
                  if (!activeChapter) return null;
                  return (
                    <div className="min-w-0 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">{activeChapter.title}</h3>
                        {activeChapter.summary ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {activeChapter.summary}
                          </p>
                        ) : null}
                      </div>
                      {activeChapter.bodyText ? (
                        <div className="whitespace-pre-wrap text-sm leading-7">
                          {activeChapter.bodyText}
                        </div>
                      ) : null}
                      {chapterFileError ? (
                        <p className="text-sm text-destructive">{chapterFileError}</p>
                      ) : null}
                      {chapterFileUrl ? (
                        activeChapter.mimeType?.startsWith("image/") ? (
                          <img
                            src={chapterFileUrl}
                            alt={activeChapter.title}
                            className="max-h-[75vh] w-full rounded-xl object-contain"
                          />
                        ) : activeChapter.mimeType?.startsWith("video/") ? (
                          <video
                            controls
                            src={chapterFileUrl}
                            className="max-h-[75vh] w-full rounded-xl"
                          >
                            Your browser does not support embedded video.
                          </video>
                        ) : (
                          <iframe
                            title={`${activeChapter.title} chapter file`}
                            src={chapterFileUrl}
                            className="h-[70vh] w-full rounded-xl border border-border"
                          />
                        )
                      ) : activeChapter.hasFile && !chapterFileError ? (
                        <p className="text-sm text-muted-foreground">Loading chapter file…</p>
                      ) : null}
                    </div>
                  );
                })()}
              </section>
            ) : null}
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
