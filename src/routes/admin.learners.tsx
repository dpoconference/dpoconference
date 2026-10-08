import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/admin/learners")({
  component: LearnersPage,
});

function LearnersPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "" });
  const learners = useQuery({
    queryKey: ["admin-learners"],
    queryFn: () => apiGet<Learner[]>("/admin/learners"),
    enabled: hasPermission("users.manage"),
  });

  if (!hasPermission("users.manage")) {
    return (
      <p className="text-sm text-muted-foreground">
        You need learner-management permission to provision accounts.
      </p>
    );
  }

  const rows = learners.data ?? [];
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

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
    const learners = bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(",").map((part) => part.trim()));
    if (
      learners.length === 0 ||
      learners.length > 100 ||
      learners.some((row) => row.length !== 3 || row.some((value) => !value))
    ) {
      notify.error("Enter 1–100 lines in First name,Last name,email format.");
      return;
    }
    setBusy(true);
    try {
      const result = await apiPost<{ count: number }>("/admin/learners/bulk", {
        learners: learners.map(([firstName, lastName, email]) => ({
          firstName,
          lastName,
          email: email.toLowerCase(),
        })),
      });
      setBulkText("");
      notify.success(`${result.count} learner accounts created; setup access remains pending.`);
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
        results: { userId: string; status: string; message?: string }[];
      }>("/admin/learners/release-access", { userIds: selectedIds });
      const failures = result.results.filter((row) => row.status !== "SENT");
      if (failures.length) {
        notify.error(
          `${result.sent} setup link(s) sent; ${failures.length} failed. Check each selected learner and retry.`,
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Learner accounts"
        subtitle="Provision accounts independently of conference registration or payment, then release setup links only when ready."
      />
      <form
        onSubmit={createLearner}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
      >
        <input
          className="rounded-md border px-3 py-2 text-sm"
          required
          type="email"
          maxLength={191}
          placeholder="Email address"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-md border px-3 py-2 text-sm"
            required
            maxLength={80}
            placeholder="First name"
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
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
      <form
        onSubmit={createLearnersInBulk}
        className="space-y-3 rounded-2xl border border-border bg-card p-5"
      >
        <div>
          <h2 className="font-semibold">Bulk provision</h2>
          <p className="text-xs text-muted-foreground">
            Paste up to 100 lines as First name,Last name,email. All accounts stay pending until
            setup links are sent.
          </p>
        </div>
        <textarea
          className="min-h-32 w-full rounded-md border px-3 py-2 font-mono text-sm"
          value={bulkText}
          onChange={(event) => setBulkText(event.target.value)}
          placeholder={"Amina,Okoro,amina@example.com\nDavid,Mensah,david@example.com"}
        />
        <Button type="submit" loading={busy}>
          Create learner accounts in bulk
        </Button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="font-semibold">Learners ({learners.data?.length ?? 0})</h2>
            <p className="text-xs text-muted-foreground">
              Setup emails use a secure one-hour password-creation link.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={rows.length === 0 || busy}
              onClick={() => setSelectedIds(allSelected ? [] : rows.map((row) => row.id))}
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
        ) : rows.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No learner accounts have been provisioned yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((learner) => (
              <label
                key={learner.id}
                className="flex cursor-pointer items-center gap-3 p-4 hover:bg-muted/40"
              >
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
                <span className="text-right text-xs text-muted-foreground">
                  {learner.attendeeLoginPending
                    ? "Setup pending"
                    : learner.emailVerifiedAt
                      ? "Active"
                      : learner.status}
                </span>
              </label>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
