import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  ChevronDown,
  GraduationCap,
  Plus,
  Search,
  Settings2,
  Users,
  Wallet,
} from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { apiLearningVideoUpload, apiUpload } from "@/lib/upload";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/app/StatCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/learning")({
  component: Page,
});

const FALLBACK_AUDIENCES = [
  { value: "ALL", label: "All members" },
  { value: "associate", label: "Associate" },
  { value: "professional", label: "Professional" },
  { value: "corporate", label: "Corporate" },
  { value: "student", label: "Student" },
  { value: "fellow", label: "Fellow" },
];

type LearningAsset = {
  id: string;
  title: string;
  summary: string;
  bodyHtml?: string | null;
  coverUrl?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
  videoUrl?: string | null;
  audience: string;
  isPublished: boolean;
  isCourse: boolean;
  guestAccess: boolean;
  priceNgn: number | string;
  _count?: { chapters: number };
};

type Category = { slug: string; name: string };
type LearningChapter = {
  id: string;
  title: string;
  summary: string;
  bodyText: string;
  fileUrl: string | null;
  mimeType: string | null;
  sortOrder: number;
  isPublished: boolean;
  exam: LearningExamQuestion[];
  examPassMark: number;
};

type LearningExamQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctOption: number;
};

const emptyForm = {
  id: "",
  title: "",
  summary: "",
  bodyHtml: "",
  coverUrl: "",
  fileUrl: "",
  mimeType: "",
  videoUrl: "",
  audience: "ALL",
  isPublished: false,
  isCourse: true,
  guestAccess: false,
  priceNgn: "0",
};

function Page() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const can = hasPermission("cms.manage");
  const canManageUsers = hasPermission("users.manage");
  const canManageSettings = hasPermission("settings.manage");
  const coverRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState<"overview" | "manage" | "add">("overview");
  const [courseSearch, setCourseSearch] = useState("");
  const [courseStatus, setCourseStatus] = useState<"all" | "published" | "draft">("all");
  const [form, setForm] = useState(emptyForm);

  const assets = useQuery({
    queryKey: ["admin-learning-assets"],
    queryFn: () => apiGet<LearningAsset[]>("/admin/learning-assets"),
    enabled: can,
  });
  const eventDashboard = useQuery({
    queryKey: ["conference-lms-admin-dashboard"],
    queryFn: () =>
      apiGet<{
        totals: {
          courseEnrollments: number;
          courseCertificates: number;
        };
      }>("/admin/events/dashboard"),
    enabled: can,
  });
  const learners = useQuery({
    queryKey: ["admin-learning-recent-learners"],
    queryFn: () =>
      apiGet<
        {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          status: string;
          createdAt: string;
        }[]
      >("/admin/learners"),
    enabled: can && canManageUsers,
  });
  const learnerLogin = useQuery({
    queryKey: ["admin-learner-login"],
    queryFn: () => apiGet<{ enabled: boolean }>("/admin/settings/learner-login"),
    enabled: can && canManageSettings,
  });

  const categories = useQuery({
    queryKey: ["public-membership-categories"],
    queryFn: () =>
      apiGet<Category[]>("/public/membership-categories").catch(() => [] as Category[]),
    enabled: can,
  });

  const audienceOptions = [
    { value: "ALL", label: "All members" },
    ...((categories.data?.length
      ? categories.data.map((c) => ({ value: c.slug, label: c.name }))
      : FALLBACK_AUDIENCES.filter((a) => a.value !== "ALL")) as { value: string; label: string }[]),
  ];

  if (!can) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You need cms.manage permission to manage learning assets.
      </div>
    );
  }

  if (assets.isPending || eventDashboard.isPending) return <PageSkeleton />;
  if (assets.isError || eventDashboard.isError || !eventDashboard.data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-destructive">The LMS dashboard could not be loaded.</p>
        <Button
          className="mt-3"
          size="sm"
          variant="outline"
          onClick={() => {
            void assets.refetch();
            void eventDashboard.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }
  const courseAssets = (assets.data ?? []).filter((asset) => asset.isCourse);
  const visibleCourses = courseAssets.filter((asset) => {
    const matchesSearch = `${asset.title} ${asset.summary}`
      .toLowerCase()
      .includes(courseSearch.trim().toLowerCase());
    const matchesStatus =
      courseStatus === "all" ||
      (courseStatus === "published" ? asset.isPublished : !asset.isPublished);
    return matchesSearch && matchesStatus;
  });

  async function toggleLearnerLogin() {
    if (!learnerLogin.data) return;
    setLoading(true);
    try {
      const next = await apiPut<{ enabled: boolean }>("/admin/settings/learner-login", {
        enabled: !learnerLogin.data.enabled,
      });
      await learnerLogin.refetch();
      notify.success(next.enabled ? "LMS learner login is on." : "LMS learner login is off.");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Could not update LMS login access.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        eyebrow="DPO Conference LMS"
        title={
          section === "overview"
            ? "Learning dashboard"
            : section === "add"
              ? form.id
                ? "Edit course"
                : "Add course"
              : "Manage courses"
        }
        subtitle={
          section === "overview"
            ? "Monitor learners, courses, enrollments, and learner access."
            : section === "add"
              ? "Prepare course details, learning content, audience, pricing, and publication status."
              : "Search, review, edit, and publish your learning courses."
        }
      />

      <nav
        aria-label="LMS administration"
        className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2"
      >
        <Button
          type="button"
          size="sm"
          variant={section === "overview" ? "default" : "ghost"}
          onClick={() => setSection("overview")}
        >
          <BookOpen className="h-4 w-4" /> Overview
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant={section === "manage" || section === "add" ? "default" : "ghost"}
            >
              <GraduationCap className="h-4 w-4" /> Courses <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => setSection("manage")}>
              Manage Courses
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setForm(emptyForm);
                setSection("add");
              }}
            >
              <Plus className="h-4 w-4" /> Add Course
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {canManageUsers ? (
          <Button asChild type="button" size="sm" variant="ghost">
            <Link to="/admin/learners">
              <Users className="h-4 w-4" /> Learners
            </Link>
          </Button>
        ) : null}
        <Button asChild type="button" size="sm" variant="ghost">
          <Link to="/admin/certificates">
            <Award className="h-4 w-4" /> Certificates
          </Link>
        </Button>
        <Button asChild type="button" size="sm" variant="ghost">
          <Link to="/admin/payments">
            <Wallet className="h-4 w-4" /> Orders & payments
          </Link>
        </Button>
      </nav>

      {section === "overview" ? (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => setSection("manage")}
              className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <StatCard
                label="Total courses"
                value={courseAssets.length}
                hint={`${courseAssets.filter((asset) => asset.isPublished).length} published · ${courseAssets.filter((asset) => !asset.isPublished).length} drafts`}
                icon={BookOpen}
                className="h-full transition hover:border-primary/40 hover:bg-muted/30"
              />
            </button>
            {canManageUsers ? (
              <Link
                to="/admin/learners"
                className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <StatCard
                  label="Total learners"
                  value={
                    learners.isPending
                      ? "…"
                      : learners.isError
                        ? "Unavailable"
                        : (learners.data?.length ?? 0)
                  }
                  hint={
                    learners.isError
                      ? "Learner accounts could not be loaded"
                      : "Provisioned LMS learner accounts"
                  }
                  icon={Users}
                  className="h-full transition hover:border-primary/40 hover:bg-muted/30"
                />
              </Link>
            ) : (
              <StatCard
                label="Total learners"
                value="Restricted"
                hint="Requires learner-management permission"
                icon={Users}
              />
            )}
            <Link
              to="/admin/learners"
              className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <StatCard
                label="Total enrollments"
                value={eventDashboard.data.totals.courseEnrollments}
                hint={`${eventDashboard.data.totals.courseCertificates} certificates issued`}
                icon={GraduationCap}
                className="h-full transition hover:border-primary/40 hover:bg-muted/30"
              />
            </Link>
            <Link
              to="/admin/certificates"
              className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <StatCard
                label="Published courses"
                value={courseAssets.filter((asset) => asset.isPublished).length}
                hint="Visible in the public learning catalogue"
                icon={Award}
                well="gold"
                className="h-full transition hover:border-primary/40 hover:bg-muted/30"
              />
            </Link>
          </section>

          {canManageSettings ? (
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-primary/10 p-3 text-primary">
                  <Settings2 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold">LMS learner sign-in</h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Control learner access to the learning portal. Staff admin sign-in and public
                    course browsing remain available when learner sign-in is off.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant={learnerLogin.data?.enabled ? "default" : "outline"}
                loading={loading || learnerLogin.isPending}
                disabled={learnerLogin.isError || !learnerLogin.data}
                onClick={() => void toggleLearnerLogin()}
              >
                {learnerLogin.data?.enabled ? "Learner login on" : "Learner login off"}
              </Button>
              {learnerLogin.isError ? (
                <p className="w-full text-sm text-destructive">
                  LMS login setting could not be loaded. Refresh and try again.
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border p-5">
                <div>
                  <h2 className="font-semibold">Recent learners</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recently provisioned LMS accounts.
                  </p>
                </div>
                {canManageUsers ? (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/learners">View all</Link>
                  </Button>
                ) : null}
              </div>
              {canManageUsers ? (
                learners.isPending ? (
                  <div className="space-y-3 p-5">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                ) : learners.isError ? (
                  <div className="p-5 text-sm text-destructive">
                    Learner activity could not be loaded.
                  </div>
                ) : (learners.data ?? []).length ? (
                  <ul className="divide-y divide-border">
                    {learners.data.slice(0, 6).map((learner) => (
                      <li
                        key={learner.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {learner.firstName} {learner.lastName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{learner.email}</p>
                        </div>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
                          {learner.status.replaceAll("_", " ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-5 text-sm text-muted-foreground">
                    No learners have been added yet.
                  </p>
                )
              ) : (
                <div className="p-5 text-sm text-muted-foreground">
                  Learner records are restricted to staff with learner-management permission.
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
              <div>
                <h2 className="font-semibold">LMS operations</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Open the tools for learner access, courses, certificates, and payment review.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setSection("manage")}
              >
                Manage courses <BookOpen className="h-4 w-4" />
              </Button>
              {canManageUsers ? (
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/admin/learners">
                    Provision learner accounts <Users className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to="/admin/certificates">
                  Review certificates <Award className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to="/admin/payments">
                  Review course payments <Wallet className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        </div>
      ) : (
        <>
          {section === "add" ? (
            <form
              className="space-y-5 rounded-2xl border border-border bg-card p-5 lg:p-7"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const body = {
                    title: form.title,
                    summary: form.summary,
                    bodyHtml: form.bodyHtml,
                    coverUrl: form.coverUrl || null,
                    fileUrl: form.fileUrl || null,
                    mimeType: form.mimeType || null,
                    ...(form.videoUrl ||
                    (form.id &&
                      assets.data?.some((asset) =>
                        Object.prototype.hasOwnProperty.call(asset, "videoUrl"),
                      ))
                      ? { videoUrl: form.videoUrl || null }
                      : {}),
                    audience: form.audience,
                    isPublished: form.isPublished,
                    isCourse: form.isCourse,
                    guestAccess: form.guestAccess,
                    priceNgn: Number(form.priceNgn),
                  };
                  if (form.id) {
                    await apiPatch(`/admin/learning-assets/${form.id}`, body);
                    notify.success("Course updated. Add or update its chapters below.");
                  } else {
                    const created = await apiPost<{ id: string }>("/admin/learning-assets", body);
                    setForm((current) => ({ ...current, id: created.id }));
                    notify.success(
                      `${form.isPublished ? "Course published." : "Course saved as a draft."} Add course chapters below.`,
                    );
                  }
                  await assets.refetch();
                } catch (error) {
                  notify.error(
                    error instanceof Error ? error.message : "Could not save the course.",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h2 className="font-semibold">Course details and content</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add a title, description, course material, audience, and optional public
                    pricing.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSection("manage")}
                >
                  Back to Courses
                </Button>
              </div>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Summary"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
              >
                {audienceOptions.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isCourse}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isCourse: e.target.checked,
                      guestAccess: e.target.checked ? form.guestAccess : false,
                      priceNgn: e.target.checked ? form.priceNgn : "0",
                    })
                  }
                />
                Publish this learning asset as a course
              </label>
              {form.isCourse ? (
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={form.guestAccess}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          guestAccess: e.target.checked,
                          priceNgn: e.target.checked ? "0" : form.priceNgn,
                        })
                      }
                    />
                    <span>
                      <span className="block font-medium">Allow guest access</span>
                      <span className="block text-xs text-muted-foreground">
                        Free course content can be opened without an account or membership.
                      </span>
                    </span>
                  </label>
                  <label className="block space-y-1 text-xs font-medium">
                    One-time price (NGN)
                    <input
                      type="number"
                      min="0"
                      step="100"
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={form.priceNgn}
                      disabled={form.guestAccess}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          priceNgn: e.target.value,
                          guestAccess: Number(e.target.value) > 0 ? false : form.guestAccess,
                        })
                      }
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Paid courses require a learner account and a completed course purchase.
                  </p>
                </div>
              ) : null}
              <div className="space-y-2">
                <p className="text-xs font-semibold">Cover</p>
                {form.coverUrl ? (
                  <img src={form.coverUrl} alt="" className="h-28 w-full rounded-md object-cover" />
                ) : null}
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const up = await apiUpload(file, "ndpo/learning");
                      setForm((f) => ({ ...f, coverUrl: up.url }));
                      notify.success("Cover uploaded.");
                    } catch (err) {
                      notify.error(err instanceof Error ? err.message : "Upload failed.");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => coverRef.current?.click()}
                >
                  Upload cover
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold">Learning file</p>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Optional course overview file URL"
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,image/*,video/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const up = await apiUpload(file, "ndpo/learning");
                      setForm((f) => ({ ...f, fileUrl: up.url, mimeType: up.mime || file.type }));
                      notify.success("File uploaded.");
                    } catch (err) {
                      notify.error(err instanceof Error ? err.message : "Upload failed.");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload overview file
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold">Optional course video</p>
                <Input
                  placeholder="Course video URL"
                  value={form.videoUrl}
                  onChange={(event) => setForm({ ...form, videoUrl: event.target.value })}
                />
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const uploaded = await apiLearningVideoUpload(file);
                      setForm((current) => ({ ...current, videoUrl: uploaded.url }));
                      notify.success("Course video uploaded.");
                    } catch (error) {
                      notify.error(error instanceof Error ? error.message : "Video upload failed.");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => videoRef.current?.click()}
                >
                  Upload course video
                </Button>
              </div>
              <textarea
                className="min-h-28 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Body (HTML or notes)"
                value={form.bodyHtml}
                onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
                Published
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={loading}>
                  {form.id
                    ? "Save course changes"
                    : form.isPublished
                      ? "Publish course"
                      : "Save draft"}
                </Button>
                {form.id ? (
                  <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
                    Clear
                  </Button>
                ) : null}
              </div>
            </form>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
                <div className="relative min-w-[min(100%,16rem)] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search courses by title or description"
                    value={courseSearch}
                    onChange={(event) => setCourseSearch(event.target.value)}
                  />
                </div>
                <select
                  aria-label="Filter courses by publication status"
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={courseStatus}
                  onChange={(event) => setCourseStatus(event.target.value as typeof courseStatus)}
                >
                  <option value="all">All status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
                <Button
                  type="button"
                  onClick={() => {
                    setForm(emptyForm);
                    setSection("add");
                  }}
                >
                  <Plus className="h-4 w-4" /> Add Course
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link to="/courses">Preview catalogue</Link>
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                <div>
                  <h2 className="font-semibold">All Courses</h2>
                  <p className="text-xs text-muted-foreground">
                    Showing {visibleCourses.length} of {courseAssets.length} courses
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setForm(emptyForm);
                    setSection("add");
                  }}
                >
                  <Plus className="h-4 w-4" /> New course
                </Button>
              </div>
              {assets.isError ? (
                <div className="p-5 text-sm text-destructive">
                  Course list could not be loaded. Refresh the page and try again.
                </div>
              ) : visibleCourses.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {courseAssets.length === 0
                    ? "No courses yet. Add your first course to start publishing."
                    : "No courses match the current search or status filter."}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {visibleCourses.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{asset.title}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {asset.summary}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {asset._count?.chapters ?? 0} chapters
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Number(asset.priceNgn) > 0
                          ? `Paid · ${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(asset.priceNgn))}`
                          : asset.guestAccess
                            ? "Free · public access"
                            : "Free · account access"}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          asset.isPublished
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {asset.isPublished ? "Published" : "Draft"}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setForm({
                            id: asset.id,
                            title: asset.title,
                            summary: asset.summary ?? "",
                            bodyHtml: asset.bodyHtml ?? "",
                            coverUrl: asset.coverUrl ?? "",
                            fileUrl: asset.fileUrl ?? "",
                            mimeType: asset.mimeType ?? "",
                            videoUrl: asset.videoUrl ?? "",
                            audience: asset.audience,
                            isPublished: asset.isPublished,
                            isCourse: asset.isCourse,
                            guestAccess: asset.guestAccess,
                            priceNgn: String(asset.priceNgn ?? 0),
                          });
                          setSection("add");
                        }}
                      >
                        Manage course
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {section === "add" && form.id && form.isCourse ? (
            <ChapterPanel
              assetId={form.id}
              onChanged={() => {
                void queryClient.invalidateQueries({ queryKey: ["admin-learning-assets"] });
              }}
            />
          ) : null}
          {section === "add" && form.id ? <AssignmentPanel assetId={form.id} /> : null}
        </>
      )}
    </div>
  );
}

function ChapterPanel({ assetId, onChanged }: { assetId: string; onChanged: () => void }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [chapter, setChapter] = useState({
    title: "",
    summary: "",
    bodyText: "",
    fileUrl: "",
    mimeType: "",
    isPublished: false,
    exam: [] as LearningExamQuestion[],
    examPassMark: 70,
  });
  const chapters = useQuery({
    queryKey: ["admin-learning-chapters", assetId],
    queryFn: () => apiGet<LearningChapter[]>(`/admin/learning-assets/${assetId}/chapters`),
  });

  async function saveChapter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...chapter,
        fileUrl: chapter.fileUrl || null,
        mimeType: chapter.mimeType || null,
        ...(chapter.exam.length > 0 ||
        chapter.examPassMark !== 70 ||
        chapters.data?.some((item) =>
          Object.prototype.hasOwnProperty.call(item, "exam"),
        )
          ? { exam: chapter.exam, examPassMark: chapter.examPassMark }
          : {}),
      };
      if (editingId) {
        await apiPatch(`/admin/learning-chapters/${editingId}`, payload);
        notify.success("Course chapter updated.");
      } else {
        await apiPost(`/admin/learning-assets/${assetId}/chapters`, payload);
        notify.success("Course chapter added.");
      }
      setEditingId("");
      setChapter({
        title: "",
        summary: "",
        bodyText: "",
        fileUrl: "",
        mimeType: "",
        isPublished: false,
        exam: [],
        examPassMark: 70,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-learning-chapters", assetId] });
      onChanged();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Could not save course chapter.");
    } finally {
      setBusy(false);
    }
  }

  async function removeChapter(item: LearningChapter) {
    if (!window.confirm(`Delete chapter "${item.title}"?`)) return;
    setBusy(true);
    try {
      await apiDelete(`/admin/learning-chapters/${item.id}`);
      notify.success("Course chapter deleted.");
      await queryClient.invalidateQueries({ queryKey: ["admin-learning-chapters", assetId] });
      onChanged();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Could not delete course chapter.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5 lg:p-7">
      <div>
        <h2 className="font-semibold">Course chapters</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload and publish course material chapter by chapter. Draft chapters are visible only to
          admins until published.
        </p>
      </div>
      {chapters.isError ? (
        <div className="text-sm text-destructive">
          Chapters could not be loaded.{" "}
          <Button size="sm" variant="outline" onClick={() => void chapters.refetch()}>
            Retry
          </Button>
        </div>
      ) : chapters.isPending ? (
        <Skeleton className="h-20" />
      ) : chapters.data.length ? (
        <ol className="space-y-2">
          {chapters.data.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div>
                <p className="text-sm font-semibold">
                  {index + 1}. {item.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.isPublished ? "Published" : "Draft"}
                  {item.fileUrl ? " · File attached" : " · Text only"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(item.id);
                    setChapter({
                      title: item.title,
                      summary: item.summary,
                      bodyText: item.bodyText,
                      fileUrl: item.fileUrl ?? "",
                      mimeType: item.mimeType ?? "",
                      isPublished: item.isPublished,
                      exam: item.exam ?? [],
                      examPassMark: item.examPassMark ?? 70,
                    });
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void removeChapter(item)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No chapters added yet. Add the first chapter below.
        </p>
      )}
      <form
        onSubmit={(event) => void saveChapter(event)}
        className="space-y-3 rounded-xl bg-muted/30 p-4"
      >
        <h3 className="text-sm font-semibold">{editingId ? "Edit chapter" : "Add a chapter"}</h3>
        <Input
          required
          minLength={2}
          maxLength={200}
          placeholder="Chapter title"
          value={chapter.title}
          onChange={(event) => setChapter({ ...chapter, title: event.target.value })}
        />
        <Input
          maxLength={2000}
          placeholder="Short chapter description (optional)"
          value={chapter.summary}
          onChange={(event) => setChapter({ ...chapter, summary: event.target.value })}
        />
        <textarea
          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Chapter notes or text (optional if a file is uploaded)"
          value={chapter.bodyText}
          onChange={(event) => setChapter({ ...chapter, bodyText: event.target.value })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="min-w-[min(100%,20rem)] flex-1"
            placeholder="Uploaded chapter file URL"
            value={chapter.fileUrl}
            onChange={(event) => setChapter({ ...chapter, fileUrl: event.target.value })}
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/*,video/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                const uploaded = await apiUpload(file, "ndpo/learning/chapters");
                setChapter((current) => ({
                  ...current,
                  fileUrl: uploaded.url,
                  mimeType: uploaded.mime || file.type,
                }));
                notify.success("Chapter file uploaded.");
              } catch (error) {
                notify.error(error instanceof Error ? error.message : "Chapter upload failed.");
              }
            }}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
            Upload chapter file
          </Button>
        </div>
        <ChapterExamEditor
          exam={chapter.exam}
          passMark={chapter.examPassMark}
          onExamChange={(exam) => setChapter({ ...chapter, exam })}
          onPassMarkChange={(examPassMark) => setChapter({ ...chapter, examPassMark })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={chapter.isPublished}
            onChange={(event) => setChapter({ ...chapter, isPublished: event.target.checked })}
          />
          Publish this chapter
        </label>
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>
            {editingId ? "Save chapter" : "Add chapter"}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId("");
                setChapter({
                  title: "",
                  summary: "",
                  bodyText: "",
                  fileUrl: "",
                  mimeType: "",
                  isPublished: false,
                  exam: [],
                  examPassMark: 70,
                });
              }}
            >
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function ChapterExamEditor({
  exam,
  passMark,
  onExamChange,
  onPassMarkChange,
}: {
  exam: LearningExamQuestion[];
  passMark: number;
  onExamChange: (exam: LearningExamQuestion[]) => void;
  onPassMarkChange: (passMark: number) => void;
}) {
  function updateQuestion(id: string, update: Partial<LearningExamQuestion>) {
    onExamChange(exam.map((question) => (question.id === id ? { ...question, ...update } : question)));
  }

  return (
    <section className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">Chapter exam</h4>
          <p className="text-xs text-muted-foreground">
            Optional multiple-choice assessment. Learners must pass before continuing.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium">
          Pass mark
          <Input
            className="w-20"
            type="number"
            min={1}
            max={100}
            value={passMark}
            onChange={(event) => onPassMarkChange(Number(event.target.value))}
          />
          %
        </label>
      </div>
      {exam.map((question, questionIndex) => (
        <fieldset key={question.id} className="space-y-3 rounded-lg bg-muted/30 p-3">
          <div className="flex items-center justify-between gap-3">
            <legend className="text-sm font-semibold">Question {questionIndex + 1}</legend>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onExamChange(exam.filter((item) => item.id !== question.id))}
            >
              Remove question
            </Button>
          </div>
          <Input
            required
            minLength={3}
            maxLength={1000}
            placeholder="Question prompt"
            value={question.prompt}
            onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })}
          />
          <ol className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <li key={optionIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  aria-label={`Mark option ${optionIndex + 1} as correct`}
                  checked={question.correctOption === optionIndex}
                  onChange={() => updateQuestion(question.id, { correctOption: optionIndex })}
                />
                <Input
                  required
                  maxLength={300}
                  placeholder={`Answer choice ${optionIndex + 1}`}
                  value={option}
                  onChange={(event) =>
                    updateQuestion(question.id, {
                      options: question.options.map((value, index) =>
                        index === optionIndex ? event.target.value : value,
                      ),
                    })
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={question.options.length <= 2}
                  onClick={() => {
                    const options = question.options.filter((_, index) => index !== optionIndex);
                    updateQuestion(question.id, {
                      options,
                      correctOption:
                        question.correctOption === optionIndex
                          ? 0
                          : question.correctOption > optionIndex
                            ? question.correctOption - 1
                            : question.correctOption,
                    });
                  }}
                >
                  Remove choice
                </Button>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={question.options.length >= 6}
            onClick={() =>
              updateQuestion(question.id, { options: [...question.options, ""] })
            }
          >
            Add answer choice
          </Button>
        </fieldset>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={exam.length >= 40}
        onClick={() =>
          onExamChange([
            ...exam,
            {
              id: crypto.randomUUID(),
              prompt: "",
              options: ["", "", "", ""],
              correctOption: 0,
            },
          ])
        }
      >
        Add exam question
      </Button>
    </section>
  );
}

type Assignment = {
  id: string;
  title: string;
  instructions: string;
  dueOn?: string | null;
  isPublished: boolean;
  submissions: {
    id: string;
    notes: string;
    status: string;
    adminNote?: string | null;
    createdAt: string;
    user: { firstName: string; lastName: string; email: string };
  }[];
};

function AssignmentPanel({ assetId }: { assetId: string }) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [loading, setLoading] = useState(false);
  const q = useQuery({
    queryKey: ["admin-learning-assignments", assetId],
    queryFn: () => apiGet<Assignment[]>(`/admin/learning-assets/${assetId}/assignments`),
  });

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h3 className="font-semibold">Assignments for this asset</h3>
      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await apiPost(`/admin/learning-assets/${assetId}/assignments`, {
              title,
              instructions,
              ...(dueOn ? { dueOn: new Date(dueOn).toISOString() } : {}),
            });
            notify.success("Assignment published.");
            setTitle("");
            setInstructions("");
            setDueOn("");
            await q.refetch();
          } finally {
            setLoading(false);
          }
        }}
      >
        <input
          className="rounded-md border px-3 py-2 text-sm"
          required
          placeholder="Assignment title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="Instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
        <input
          type="date"
          className="rounded-md border px-3 py-2 text-sm sm:col-span-2"
          value={dueOn}
          onChange={(e) => setDueOn(e.target.value)}
        />
        <Button type="submit" loading={loading} className="sm:col-span-2 w-fit">
          Add assignment
        </Button>
      </form>
      {(q.data ?? []).map((a) => (
        <div key={a.id} className="border-t border-border pt-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.instructions}</p>
              {a.dueOn ? (
                <p className="text-xs text-muted-foreground">
                  Due {new Date(a.dueOn).toLocaleDateString("en-NG")}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                void apiPatch(`/admin/learning-assignments/${a.id}`, {
                  isPublished: !a.isPublished,
                }).then(() => {
                  notify.success(
                    a.isPublished ? "Assignment unpublished." : "Assignment published.",
                  );
                  void q.refetch();
                })
              }
            >
              {a.isPublished ? "Unpublish" : "Publish"}
            </Button>
          </div>
          <ul className="mt-2 space-y-2">
            {a.submissions.map((s) => (
              <li key={s.id} className="rounded-md bg-muted/40 p-3">
                <p className="font-medium">
                  {s.user.firstName} {s.user.lastName} · {s.status}
                </p>
                <p className="text-xs text-muted-foreground">{s.notes}</p>
                {s.status !== "REVIEWED" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      void apiPatch(`/admin/learning-submissions/${s.id}`, {
                        status: "REVIEWED",
                      }).then(() => {
                        notify.success("Marked reviewed.");
                        void q.refetch();
                      })
                    }
                  >
                    Mark reviewed
                  </Button>
                ) : null}
              </li>
            ))}
            {a.submissions.length === 0 && (
              <p className="text-xs text-muted-foreground">No submissions yet.</p>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
