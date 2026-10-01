import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusChip } from "@/components/app/StatusChip";
import { AssetPreview } from "@/components/app/AssetPreview";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/admin/applications_/$id")({
  component: Page,
});

type ApplicationDetail = {
  id: string;
  status: string;
  personal: Record<string, unknown>;
  organisation?: Record<string, unknown> | null;
  adminNote?: string;
  declarationAcceptedAt?: string | null;
  ethicsAcceptedAt?: string | null;
  privacyAcceptedAt?: string | null;
  createdAt?: string;
  user: { firstName: string; lastName: string; email: string; phone?: string | null };
  category: { name: string; slug: string };
  year?: { year: number };
  documents: {
    id: string;
    type: string;
    url: string;
    mime?: string;
    reviewStatus?: string;
    reviewNote?: string | null;
  }[];
  documentsFullyApproved?: boolean;
  canApproveMembership?: boolean;
  requiredDocuments?: string[];
  pendingDocuments?: string[];
  payments: { status: string; amountNgn: string; paystackReference: string; paidAt?: string | null }[];
};

const PERSONAL_SECTIONS: { title: string; keys: { key: string; label: string }[] }[] = [
  {
    title: "Identity",
    keys: [
      { key: "title", label: "Title" },
      { key: "firstName", label: "First name" },
      { key: "middleName", label: "Middle name" },
      { key: "lastName", label: "Surname" },
      { key: "dateOfBirth", label: "Date of birth" },
      { key: "gender", label: "Gender" },
      { key: "nationality", label: "Nationality" },
    ],
  },
  {
    title: "Contact",
    keys: [
      { key: "email", label: "Email" },
      { key: "phone", label: "Telephone" },
      { key: "address", label: "Address" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "country", label: "Country" },
    ],
  },
  {
    title: "Professional",
    keys: [
      { key: "organisation", label: "Organisation" },
      { key: "jobTitle", label: "Job title" },
      { key: "sector", label: "Sector" },
      { key: "yearsExperience", label: "Years of experience" },
      { key: "interests", label: "Interests" },
      { key: "qualifications", label: "Qualifications" },
      { key: "certification", label: "Certification" },
    ],
  },
];

const ORG_FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "Legal name" },
  { key: "cacNumber", label: "CAC number" },
  { key: "type", label: "Organisation type" },
  { key: "address", label: "Address" },
  { key: "website", label: "Website" },
];

function statusTone(status: string): "success" | "warning" | "danger" | "sky" | "muted" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED" || status === "WITHDRAWN") return "danger";
  if (status === "PAID_PENDING_REVIEW" || status === "INFO_REQUESTED") return "warning";
  if (status === "PAYMENT_PENDING" || status === "SUBMITTED") return "sky";
  return "muted";
}

function displayValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(String).join(", ") || "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function FieldGrid({
  fields,
  data,
}: {
  fields: { key: string; label: string }[];
  data: Record<string, unknown>;
}) {
  const present = fields.filter((f) => data[f.key] != null && data[f.key] !== "");
  const rows = present.length ? present : fields.filter((f) => f.key in data);
  if (!rows.length) return <p className="text-sm text-muted-foreground">No details provided.</p>;
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {rows.map((f) => (
        <div key={f.key} className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{f.label}</dt>
          <dd className="mt-1 break-words text-sm font-medium text-foreground">{displayValue(data[f.key])}</dd>
        </div>
      ))}
    </dl>
  );
}

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [docNotes, setDocNotes] = useState<Record<string, string>>({});
  const q = useQuery({
    queryKey: ["admin-app", id],
    queryFn: () => apiGet<ApplicationDetail>(`/admin/applications/${id}`),
  });

  async function act(path: string, body?: object) {
    setLoading(path);
    try {
      const data = await apiPost<{ membership?: { membershipNumber: string } }>(`/admin/applications/${id}/${path}`, body ?? {});
      if (path === "approve") {
        notify.success(`Member approved. Number ${data.membership?.membershipNumber} issued. Applicant emailed.`);
      } else if (path === "reject") {
        notify.success("Application rejected. Applicant emailed.");
      } else {
        notify.success("Information requested. Applicant emailed.");
      }
      await navigate({ to: "/admin/applications" });
    } finally {
      setLoading(null);
    }
  }

  async function reviewDoc(docId: string, decision: "approve" | "reject") {
    const key = `${decision}-${docId}`;
    setLoading(key);
    try {
      const body = decision === "reject" ? { note: docNotes[docId]?.trim() || "" } : {};
      if (decision === "reject" && !body.note) {
        notify.error("Enter a reason before rejecting this document.");
        return;
      }
      await apiPost(`/admin/applications/${id}/documents/${docId}/${decision}`, body);
      notify.success(decision === "approve" ? "Document accepted. Applicant emailed." : "Document rejected. Applicant emailed.");
      await q.refetch();
    } finally {
      setLoading(null);
    }
  }

  if (q.isPending) return <Skeleton className="h-96" />;
  const a = q.data;
  if (!a) return null;

  const personal = (a.personal ?? {}) as Record<string, unknown>;
  const organisation = (a.organisation ?? null) as Record<string, unknown> | null;
  const displayName =
    [personal.firstName, personal.lastName].filter(Boolean).join(" ") || `${a.user.firstName} ${a.user.lastName}`;

  const knownKeys = new Set(PERSONAL_SECTIONS.flatMap((s) => s.keys.map((k) => k.key)));
  const extraPersonal = Object.keys(personal).filter((k) => !knownKeys.has(k));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/admin/applications" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Applications
        </Link>
      </div>

      <PageHeader
        title={displayName}
        subtitle={`${a.category.name}${a.year?.year ? ` · ${a.year.year}` : ""}`}
        actions={<StatusChip tone={statusTone(a.status)}>{a.status.replaceAll("_", " ")}</StatusChip>}
      />

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight">Account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Login email</dt>
            <dd className="mt-1 text-sm font-medium">{a.user.email}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Account phone</dt>
            <dd className="mt-1 text-sm font-medium">{a.user.phone || "—"}</dd>
          </div>
        </dl>
      </section>

      {PERSONAL_SECTIONS.map((section) => {
        const hasAny = section.keys.some((k) => personal[k.key] != null && personal[k.key] !== "");
        if (!hasAny) return null;
        return (
          <section key={section.title} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold tracking-tight">{section.title}</h2>
            <div className="mt-4">
              <FieldGrid fields={section.keys} data={personal} />
            </div>
          </section>
        );
      })}

      {extraPersonal.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-tight">Additional details</h2>
          <div className="mt-4">
            <FieldGrid fields={extraPersonal.map((k) => ({ key: k, label: k }))} data={personal} />
          </div>
        </section>
      )}

      {organisation && Object.keys(organisation).length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-tight">Organisation</h2>
          <div className="mt-4">
            <FieldGrid fields={ORG_FIELDS} data={organisation} />
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Documents</h2>
          {a.documentsFullyApproved ? (
            <StatusChip tone="success">All documents accepted</StatusChip>
          ) : (
            <StatusChip tone="warning">Accept every document before membership approval</StatusChip>
          )}
        </div>
        {a.documents.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No documents uploaded.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {a.documents.map((d) => {
              const status = d.reviewStatus ?? "PENDING";
              const canReview =
                ["PAID_PENDING_REVIEW", "INFO_REQUESTED"].includes(a.status) &&
                status === "PENDING" &&
                Boolean(d.id);
              return (
                <div key={d.id || `${d.type}-${d.url}`} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{d.type.replaceAll("_", " ")}</p>
                      <div className="mt-1">
                        <StatusChip
                          tone={status === "APPROVED" ? "success" : status === "REJECTED" ? "danger" : "warning"}
                        >
                          {status.replaceAll("_", " ")}
                        </StatusChip>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <AssetPreview url={d.url} label={d.type.replaceAll("_", " ")} mime={d.mime} />
                  </div>
                  {status === "REJECTED" && d.reviewNote && (
                    <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive whitespace-pre-wrap">
                      {d.reviewNote}
                    </p>
                  )}
                  {canReview && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={docNotes[d.id] ?? ""}
                        onChange={(e) => setDocNotes((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        placeholder="Rejection reason (required to reject)"
                        className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="gradient-brand text-white"
                          loading={loading === `approve-${d.id}`}
                          onClick={() => void reviewDoc(d.id, "approve")}
                        >
                          Accept document
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          loading={loading === `reject-${d.id}`}
                          onClick={() => void reviewDoc(d.id, "reject")}
                        >
                          Reject with reason
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight">Payments</h2>
        {a.payments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No payments recorded.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {a.payments.map((p) => (
              <li key={p.paystackReference} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{formatNaira(Number(p.amountNgn))}</p>
                  <p className="text-xs text-muted-foreground">{p.paystackReference}</p>
                </div>
                <StatusChip tone={p.status === "SUCCESSFUL" ? "success" : p.status === "FAILED" ? "danger" : "warning"}>
                  {p.status}
                </StatusChip>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(a.adminNote || a.ethicsAcceptedAt || a.privacyAcceptedAt || a.declarationAcceptedAt) && (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-tight">Declarations & notes</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Ethics</dt>
              <dd className="mt-1 font-medium">{a.ethicsAcceptedAt ? "Accepted" : "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Privacy</dt>
              <dd className="mt-1 font-medium">{a.privacyAcceptedAt ? "Accepted" : "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Declaration</dt>
              <dd className="mt-1 font-medium">{a.declarationAcceptedAt ? "Accepted" : "—"}</dd>
            </div>
          </dl>
          {a.adminNote && (
            <p className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-sm whitespace-pre-wrap">{a.adminNote}</p>
          )}
        </section>
      )}

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight">Membership decision</h2>
        <p className="text-sm text-muted-foreground">
          Membership Approve stays disabled until every required document is accepted individually.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note to applicant (reject / request info)"
          className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
        />
        <input
          placeholder="Optional category slug override"
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            loading={loading === "approve"}
            className="gradient-brand text-white"
            disabled={!a.canApproveMembership && !a.documentsFullyApproved}
            title={
              a.documentsFullyApproved
                ? "Approve membership"
                : "Accept all documents first"
            }
            onClick={() => void act("approve", categorySlug ? { categorySlug } : {})}
          >
            Approve membership
          </Button>
          <Button loading={loading === "reject"} variant="destructive" onClick={() => void act("reject", { note })}>
            Reject application
          </Button>
          <Button loading={loading === "request-info"} variant="outline" onClick={() => void act("request-info", { note })}>
            Request information
          </Button>
        </div>
        {!a.documentsFullyApproved && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Pending documents: {(a.pendingDocuments ?? []).map((t) => t.replaceAll("_", " ")).join(", ") || "review above"}
          </p>
        )}
      </section>
    </div>
  );
}
