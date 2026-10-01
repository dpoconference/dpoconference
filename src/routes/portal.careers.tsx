import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Bookmark } from "lucide-react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatusChip } from "@/components/app/StatusChip";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portal/careers")({
  component: Page,
});

type Job = {
  id: string;
  title: string;
  organisation: string;
  location: string;
  sector?: string | null;
  employmentType?: string | null;
  workMode?: string | null;
  description?: string;
  closesOn?: string | null;
};

type SavedRow = { id: string; jobId?: string; job?: Job };
type Application = {
  id: string;
  status?: string;
  createdAt?: string;
  job?: Job;
};
type Alert = { id: string; query: Record<string, unknown>; createdAt?: string };

type Tab = "all" | "saved" | "applications" | "alerts";

function Page() {
  const [tab, setTab] = useState<Tab>("all");
  const [qtext, setQtext] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [alertKeywords, setAlertKeywords] = useState("");
  const [alertLocation, setAlertLocation] = useState("");

  const jobs = useQuery({
    queryKey: ["public-jobs"],
    queryFn: () => apiGet<Job[]>("/public/jobs"),
  });
  const saved = useQuery({
    queryKey: ["portal-jobs-saved"],
    queryFn: () => apiGet<SavedRow[]>("/portal/jobs/saved"),
  });
  const applications = useQuery({
    queryKey: ["portal-jobs-applications"],
    queryFn: () => apiGet<Application[]>("/portal/jobs/applications"),
  });
  const alerts = useQuery({
    queryKey: ["portal-jobs-alerts"],
    queryFn: () => apiGet<Alert[]>("/portal/jobs/alerts"),
  });

  const savedIds = useMemo(() => {
    const set = new Set<string>();
    for (const row of saved.data ?? []) {
      const id = row.job?.id ?? row.jobId ?? (row as { id: string }).id;
      if (id) set.add(id);
    }
    return set;
  }, [saved.data]);

  const filteredJobs = useMemo(() => {
    const needle = qtext.trim().toLowerCase();
    const rows = jobs.data ?? [];
    if (!needle) return rows;
    return rows.filter((j) =>
      `${j.title} ${j.organisation} ${j.location} ${j.sector ?? ""}`.toLowerCase().includes(needle),
    );
  }, [jobs.data, qtext]);

  if (jobs.isPending) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Careers"
        subtitle="Browse vacancies, save roles, apply, and manage job alerts."
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["saved", "Saved"],
            ["applications", "Applications"],
            ["alerts", "Alerts"],
          ] as const
        ).map(([id, label]) => (
          <Button key={id} size="sm" variant={tab === id ? "default" : "outline"} onClick={() => setTab(id)}>
            {label}
          </Button>
        ))}
      </div>

      {tab === "all" && (
        <div className="space-y-4">
          <input
            className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
            placeholder="Search jobs"
            value={qtext}
            onChange={(e) => setQtext(e.target.value)}
          />
          <div className="space-y-3">
            {filteredJobs.map((j) => {
              const isSaved = savedIds.has(j.id);
              return (
                <article key={j.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">{j.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {j.organisation} · {j.location}
                        {j.employmentType ? ` · ${j.employmentType}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={loadingId === `save-${j.id}`}
                        onClick={async () => {
                          setLoadingId(`save-${j.id}`);
                          try {
                            if (isSaved) {
                              await apiDelete(`/portal/jobs/${j.id}/save`);
                              notify.success("Removed from saved.");
                            } else {
                              await apiPost(`/portal/jobs/${j.id}/save`);
                              notify.success("Job saved.");
                            }
                            await saved.refetch();
                          } finally {
                            setLoadingId(null);
                          }
                        }}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        {isSaved ? "Unsave" : "Save"}
                      </Button>
                      <Button size="sm" onClick={() => setApplyJobId(j.id)}>
                        Apply
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/careers/$id" params={{ id: j.id }}>
                          Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                  {applyJobId === j.id && (
                    <form
                      className="mt-4 space-y-2 border-t border-border pt-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setLoadingId(`apply-${j.id}`);
                        try {
                          await apiPost(`/portal/jobs/${j.id}/apply`, {
                            coverLetter,
                            cvUrl: cvUrl || undefined,
                          });
                          notify.success("Application submitted.");
                          setApplyJobId(null);
                          setCoverLetter("");
                          setCvUrl("");
                          await applications.refetch();
                          setTab("applications");
                        } finally {
                          setLoadingId(null);
                        }
                      }}
                    >
                      <textarea
                        className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                        required
                        minLength={20}
                        placeholder="Cover letter"
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                      />
                      <input
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="CV URL (optional)"
                        value={cvUrl}
                        onChange={(e) => setCvUrl(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" loading={loadingId === `apply-${j.id}`}>
                          Submit application
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setApplyJobId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
            {filteredJobs.length === 0 && (
              <p className="text-sm text-muted-foreground">No published jobs match your search.</p>
            )}
          </div>
        </div>
      )}

      {tab === "saved" && (
        <div className="space-y-3">
          {(saved.data ?? []).map((row) => {
            const j = row.job;
            if (!j) return null;
            return (
              <div key={row.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-semibold">{j.title}</p>
                <p className="text-xs text-muted-foreground">
                  {j.organisation} · {j.location}
                </p>
              </div>
            );
          })}
          {(saved.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No saved jobs yet.</p>
          )}
        </div>
      )}

      {tab === "applications" && (
        <div className="space-y-3">
          {(applications.data ?? []).map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{a.job?.title ?? "Application"}</p>
                {a.status && <StatusChip tone="muted">{a.status}</StatusChip>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {a.job?.organisation}
                {a.createdAt ? ` · ${new Date(a.createdAt).toLocaleDateString("en-NG")}` : ""}
              </p>
            </div>
          ))}
          {(applications.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">You have not applied to any roles yet.</p>
          )}
        </div>
      )}

      {tab === "alerts" && (
        <div className="space-y-4">
          <form
            className="max-w-lg space-y-3 rounded-2xl border border-border bg-card p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoadingId("alert");
              try {
                await apiPost("/portal/jobs/alerts", {
                  query: {
                    keywords: alertKeywords,
                    location: alertLocation || undefined,
                  },
                });
                notify.success("Alert created.");
                setAlertKeywords("");
                setAlertLocation("");
                await alerts.refetch();
              } finally {
                setLoadingId(null);
              }
            }}
          >
            <h3 className="text-sm font-semibold">Create alert</h3>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              placeholder="Keywords"
              value={alertKeywords}
              onChange={(e) => setAlertKeywords(e.target.value)}
            />
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Location (optional)"
              value={alertLocation}
              onChange={(e) => setAlertLocation(e.target.value)}
            />
            <Button type="submit" size="sm" loading={loadingId === "alert"}>
              Save alert
            </Button>
          </form>
          <ul className="space-y-3">
            {(alerts.data ?? []).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="text-sm">
                  <p className="font-medium">{String(a.query.keywords ?? "Alert")}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.query.location ? String(a.query.location) : "Any location"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  loading={loadingId === a.id}
                  onClick={async () => {
                    setLoadingId(a.id);
                    try {
                      await apiDelete(`/portal/jobs/alerts/${a.id}`);
                      notify.success("Alert deleted.");
                      await alerts.refetch();
                    } finally {
                      setLoadingId(null);
                    }
                  }}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
