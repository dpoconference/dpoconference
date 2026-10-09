import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ChevronDown, FileDown, FileUp, Search, Users } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/app/PageHeader";

type Learner = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  attendeeLoginPending: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
};

type Course = { id: string; title: string; isCourse: boolean; isPublished: boolean };
type LearnerRow = { firstName: string; lastName: string; email: string; phone: string };

function parseLearnerCsv(text: string): LearnerRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("The CSV has an unclosed quoted field.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  if (!rows.length) return [];

  const normalize = (value: string) => value.toLowerCase().replace(/[\s_-]/g, "");
  const headers = rows[0].map(normalize);
  const hasHeaders = headers.some((header) =>
    ["firstname", "lastname", "name", "fullname", "email"].includes(header),
  );
  const dataRows = hasHeaders ? rows.slice(1) : rows;
  const firstIndex = hasHeaders ? headers.indexOf("firstname") : 0;
  const lastIndex = hasHeaders ? headers.indexOf("lastname") : 1;
  const fullNameIndex = Math.max(headers.indexOf("name"), headers.indexOf("fullname"));
  const emailIndex = hasHeaders ? headers.indexOf("email") : 2;
  const phoneIndex = hasHeaders ? headers.indexOf("phone") : 3;
  if (emailIndex < 0 || (fullNameIndex < 0 && (firstIndex < 0 || lastIndex < 0))) {
    throw new Error("CSV headers must include firstName, lastName, and email (phone is optional).");
  }

  return dataRows.map((values) => {
    let firstName = values[firstIndex] ?? "";
    let lastName = values[lastIndex] ?? "";
    if (fullNameIndex >= 0) {
      const [first, ...rest] = (values[fullNameIndex] ?? "").trim().split(/\s+/);
      firstName = first ?? "";
      lastName = rest.join(" ");
    }
    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: (values[emailIndex] ?? "").trim().toLowerCase(),
      phone: phoneIndex >= 0 ? (values[phoneIndex] ?? "").trim() : "",
    };
  });
}

export const Route = createFileRoute("/admin/learners")({
  component: LearnersPage,
});

function LearnersPage() {
  const { hasPermission, user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = hasPermission("users.manage");
  const canEnroll = hasPermission("cms.manage");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkView, setBulkView] = useState(false);
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "" });
  const [manualLinks, setManualLinks] = useState<
    Record<string, { email: string; setupLink: string; expiresAt: string }>
  >({});

  const learners = useQuery({
    queryKey: ["admin-learners"],
    queryFn: () => apiGet<Learner[]>("/admin/learners"),
    enabled: canManage,
  });
  const courses = useQuery({
    queryKey: ["admin-bulk-enrollment-courses"],
    queryFn: () => apiGet<Course[]>("/admin/learning-assets"),
    enabled: canManage && canEnroll,
  });

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground">
        You need learner-management permission to provision accounts.
      </p>
    );
  }

  const rows = learners.data ?? [];
  const filteredRows = rows.filter((row) =>
    `${row.firstName} ${row.lastName} ${row.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const allSelected =
    filteredRows.length > 0 && filteredRows.every((row) => selectedIds.includes(row.id));
  const courseOptions = (courses.data ?? []).filter(
    (course) => course.isCourse && course.isPublished,
  );

  async function createLearner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await apiPost("/admin/learners", {
        email: form.email.trim().toLowerCase(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });
      setForm({ email: "", firstName: "", lastName: "" });
      notify.success(
        "Learner account created. Login access remains pending until you send a setup link.",
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-learners"] });
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Could not create the learner account.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createLearnersInBulk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let roster: LearnerRow[];
    try {
      roster = parseLearnerCsv(bulkText);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Could not read this CSV.");
      return;
    }
    if (
      roster.length === 0 ||
      roster.length > 100 ||
      roster.some((learner) => !learner.firstName || !learner.lastName || !learner.email)
    ) {
      notify.error("Add between 1 and 100 learners with first name, last name, and email.");
      return;
    }
    setBusy(true);
    try {
      const result = await apiPost<{ count: number; enrolledCount: number }>(
        "/admin/learners/bulk",
        {
          learners: roster,
          ...(courseId ? { courseId } : {}),
        },
      );
      setBulkText("");
      notify.success(
        courseId
          ? `${result.count} learner accounts created and enrolled in the selected course. Setup access remains pending.`
          : `${result.count} learner accounts created; setup access remains pending.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-learners"] });
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Could not create learner accounts in bulk.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function releaseAccess() {
    if (selectedIds.length === 0) return;
    setBusy(true);
    try {
      const result = await apiPost<{
        sent: number;
        results: {
          userId: string;
          email?: string;
          status: string;
          message?: string;
          setupLink?: string;
          expiresAt?: string;
        }[];
      }>("/admin/learners/release-access", { userIds: selectedIds });
      const failures = result.results.filter((row) => row.status !== "SENT");
      const fallbackLinks = result.results.filter(
        (row): row is typeof row & { email: string; setupLink: string; expiresAt: string } =>
          Boolean(row.email && row.setupLink && row.expiresAt),
      );
      if (fallbackLinks.length) {
        setManualLinks((current) => ({
          ...current,
          ...Object.fromEntries(
            fallbackLinks.map((row) => [
              row.userId,
              { email: row.email, setupLink: row.setupLink, expiresAt: row.expiresAt },
            ]),
          ),
        }));
      }
      if (failures.length) {
        notify.error(
          `${result.sent} setup email(s) sent; ${failures.length} failed. Copy the available one-time setup links below to deliver them manually.`,
        );
      } else {
        notify.success(`Setup link sent to ${result.sent} learner(s).`);
      }
      setSelectedIds([]);
      await queryClient.invalidateQueries({ queryKey: ["admin-learners"] });
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Could not send learner setup links.");
    } finally {
      setBusy(false);
    }
  }

  async function generateManualLink(userId: string) {
    setBusy(true);
    try {
      const result = await apiPost<{
        email: string;
        setupLink: string;
        expiresAt: string;
      }>(`/admin/learners/${userId}/setup-link`);
      setManualLinks((current) => ({ ...current, [userId]: result }));
      notify.success("One-time setup link generated. Copy it and send it securely.");
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Could not generate a manual setup link.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyManualDetails(details: {
    email: string;
    setupLink: string;
    expiresAt: string;
  }) {
    const signInUrl = `${new URL(details.setupLink).origin}/login`;
    const message = [
      "DPO Conference LMS access",
      `Email: ${details.email}`,
      `Set your password using this one-time link (expires ${new Date(details.expiresAt).toLocaleString()}):`,
      details.setupLink,
      `After setting your password, sign in at: ${signInUrl}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(message);
      notify.success(
        "Login instructions copied. Send them to the learner through a secure channel.",
      );
    } catch {
      notify.error("Could not copy the instructions. Select and copy the link shown below.");
    }
  }

  function downloadSampleCsv() {
    const sample = "firstName,lastName,email,phone\nAmina,Okoro,amina@example.com,+2348000000000\n";
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dpo-lms-bulk-enrolment-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title={bulkView ? "Bulk enrolment & account setup" : "Manage learners"}
        subtitle={
          bulkView
            ? "Upload a CSV roster to create learner accounts and optionally enrol them in a published course."
            : "Search learner accounts, create students, and securely release password setup links."
        }
      />
      <nav
        aria-label="Learner administration"
        className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="default">
              <Users className="h-4 w-4" /> Users <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => setBulkView(false)}>Manage learners</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setBulkView(true)}>
              <FileUp className="h-4 w-4" /> Bulk enrolment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="self-center px-2 text-sm font-medium text-muted-foreground">
          {bulkView ? "Bulk enrolment" : "Manage learners"}
        </span>
      </nav>

      {bulkView ? (
        <div className="space-y-5">
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Users className="h-4 w-4" /> Automated bulk learner enrolment
              </p>
              <h2 className="text-2xl font-bold">Bulk enrolment & account setup</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload a CSV containing first name, last name, email, and optional phone. New
                accounts receive a secure setup link when you release access.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={downloadSampleCsv}>
              <FileDown className="h-4 w-4" /> Download sample CSV
            </Button>
          </section>
          <form
            onSubmit={createLearnersInBulk}
            className="space-y-4 rounded-2xl border border-border bg-card p-5"
          >
            <label className="block space-y-2 text-sm font-semibold">
              1. Upload learner CSV file
              <Input
                type="file"
                accept=".csv,text/csv"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    notify.error("CSV file must be 10 MB or smaller.");
                    event.currentTarget.value = "";
                    return;
                  }
                  void file
                    .text()
                    .then(setBulkText)
                    .catch(() => {
                      notify.error("Could not read the selected CSV file.");
                    });
                }}
              />
              <span className="block text-xs font-normal text-muted-foreground">
                CSV only, maximum 10 MB and 100 learners. Convert Excel workbooks to CSV before
                uploading.
              </span>
            </label>
            <label className="block space-y-2 text-sm font-semibold">
              Or paste CSV rows
              <textarea
                className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                placeholder={
                  "firstName,lastName,email,phone\nAmina,Okoro,amina@example.com,+2348000000000"
                }
              />
            </label>
            {canEnroll ? (
              <label className="block space-y-2 text-sm font-semibold">
                2. Enrol these learners in a course (optional)
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
                >
                  <option value="">Create learner accounts only</option>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                {courses.isError ? (
                  <span className="block text-xs font-normal text-destructive">
                    Published courses could not be loaded. Retry from the course management page.
                  </span>
                ) : null}
                {!courses.isPending && !courses.isError && courseOptions.length === 0 ? (
                  <span className="block text-xs font-normal text-muted-foreground">
                    Publish a course before assigning learners through bulk enrolment.
                  </span>
                ) : null}
              </label>
            ) : (
              <p className="text-xs text-muted-foreground">
                Course enrolment requires course-management permission.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Existing email addresses and duplicate rows are rejected; no existing accounts are
              changed. Selected-course enrolment is an administrative access grant and does not
              create a payment record. Learner sign-in stays pending until setup links are sent.
            </p>
            <Button type="submit" loading={busy} disabled={Boolean(courseId && !canEnroll)}>
              <FileUp className="h-4 w-4" /> Create learner accounts{courseId ? " and enrol" : ""}
            </Button>
          </form>
        </div>
      ) : (
        <>
          <form
            onSubmit={createLearner}
            className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
          >
            <Input
              required
              type="email"
              maxLength={191}
              placeholder="Email address"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                required
                maxLength={80}
                placeholder="First name"
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              />
              <Input
                required
                maxLength={80}
                placeholder="Last name"
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
              />
            </div>
            <Button type="submit" loading={busy} className="sm:col-span-2">
              Create learner account
            </Button>
          </form>
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div className="flex min-w-[min(100%,18rem)] flex-1 items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <Button type="button" variant="outline" onClick={() => setBulkView(true)}>
                  <FileUp className="h-4 w-4" /> Bulk enrolment
                </Button>
              </div>
              <div>
                <h2 className="font-semibold">All learners ({filteredRows.length})</h2>
                <p className="text-xs text-muted-foreground">
                  Setup emails use a secure one-hour password-creation link.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={filteredRows.length === 0 || busy}
                  onClick={() =>
                    setSelectedIds(
                      allSelected
                        ? selectedIds.filter((id) => !filteredRows.some((row) => row.id === id))
                        : [...new Set([...selectedIds, ...filteredRows.map((row) => row.id)])],
                    )
                  }
                >
                  {allSelected ? "Clear selection" : "Select all"}
                </Button>
                <Button
                  type="button"
                  disabled={selectedIds.length === 0 || busy}
                  loading={busy}
                  onClick={() => void releaseAccess()}
                >
                  Send setup links ({selectedIds.length})
                </Button>
              </div>
            </div>
            {learners.isPending ? (
              <p className="p-5 text-sm text-muted-foreground">Loading learner accounts…</p>
            ) : learners.isError ? (
              <div className="p-5">
                <p className="text-sm text-destructive">Learner accounts could not be loaded.</p>
                <Button className="mt-3" variant="outline" onClick={() => void learners.refetch()}>
                  Retry
                </Button>
              </div>
            ) : filteredRows.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                {search
                  ? "No learners match this search."
                  : "No learner accounts have been provisioned yet."}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {filteredRows.map((learner) => (
                  <div
                    key={learner.id}
                    className="flex flex-wrap items-center gap-3 p-4 hover:bg-muted/40"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(learner.id)}
                        onChange={(event) =>
                          setSelectedIds((current) =>
                            event.target.checked
                              ? [...current, learner.id]
                              : current.filter((id) => id !== learner.id),
                          )
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {learner.firstName} {learner.lastName}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {learner.email}
                        </span>
                      </span>
                    </label>
                    <span className="text-right text-xs text-muted-foreground">
                      {learner.attendeeLoginPending
                        ? "Setup pending"
                        : learner.emailVerifiedAt
                          ? "Active"
                          : learner.status}
                    </span>
                    {user?.role === "SUPER_ADMIN" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void generateManualLink(learner.id)}
                      >
                        Generate manual link
                      </Button>
                    ) : null}
                    {manualLinks[learner.id] ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void copyManualDetails(manualLinks[learner.id])}
                      >
                        Copy login details
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            {Object.entries(manualLinks).length > 0 ? (
              <div className="space-y-3 border-t border-border bg-muted/20 p-4">
                <div>
                  <h3 className="text-sm font-semibold">Manual delivery links</h3>
                  <p className="text-xs text-muted-foreground">
                    These one-time links expire after one hour. Send them securely; learners create
                    their own password before signing in. Generating another link invalidates the
                    previous one.
                  </p>
                </div>
                {Object.entries(manualLinks).map(([userId, details]) => (
                  <div
                    key={userId}
                    className="space-y-2 rounded-lg border border-border bg-card p-3"
                  >
                    <p className="text-sm font-medium">{details.email}</p>
                    <Input
                      aria-label={`One-time setup link for ${details.email}`}
                      readOnly
                      value={details.setupLink}
                      onFocus={(event) => event.currentTarget.select()}
                      className="text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(details.expiresAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
