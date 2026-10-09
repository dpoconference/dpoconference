import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { apiUpload } from "@/lib/upload";
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
  fileUrl: string;
  mimeType?: string | null;
  audience: string;
  isPublished: boolean;
  isCourse: boolean;
  guestAccess: boolean;
  priceNgn: number | string;
};

type Category = { slug: string; name: string };

const emptyForm = {
  id: "",
  title: "",
  summary: "",
  bodyHtml: "",
  coverUrl: "",
  fileUrl: "",
  mimeType: "",
  audience: "ALL",
  isPublished: false,
  isCourse: true,
  guestAccess: false,
  priceNgn: "0",
};

function Page() {
  const { hasPermission } = useAuth();
  const can = hasPermission("cms.manage");
  const canManageUsers = hasPermission("users.manage");
  const canManageSettings = hasPermission("settings.manage");
  const coverRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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
                if (!form.fileUrl) {
                  notify.error("Upload a learning file first.");
                  return;
                }
                setLoading(true);
                try {
                  const body = {
                    title: form.title,
                    summary: form.summary,
                    bodyHtml: form.bodyHtml,
                    coverUrl: form.coverUrl || null,
                    fileUrl: form.fileUrl,
                    mimeType: form.mimeType || null,
                    audience: form.audience,
                    isPublished: form.isPublished,
                    isCourse: form.isCourse,
                    guestAccess: form.guestAccess,
                    priceNgn: Number(form.priceNgn),
                  };
                  if (form.id) {
                    await apiPatch(`/admin/learning-assets/${form.id}`, body);
                    notify.success("Course updated.");
                  } else {
                    await apiPost("/admin/learning-assets", body);
                    notify.success(
                      form.isPublished ? "Course published." : "Course saved as a draft.",
                    );
                  }
                  setForm(emptyForm);
                  await assets.refetch();
                  setSection("manage");
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
                  placeholder="File URL"
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  required
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
                  Upload file
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
                            fileUrl: asset.fileUrl,
                            mimeType: asset.mimeType ?? "",
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

          {section === "add" && form.id ? <AssignmentPanel assetId={form.id} /> : null}
        </>
      )}
    </div>
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
