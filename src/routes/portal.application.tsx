import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CreditCard,
  FileText,
  FolderOpen,
  ClipboardList,
  AlertCircle,
  Upload,
} from "lucide-react";
import { api, apiGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusChip } from "@/components/app/StatusChip";
import { Button } from "@/components/ui/button";
import { ApplyProgressTracker } from "@/components/membership/ApplyProgressTracker";
import { AssetPreview } from "@/components/app/AssetPreview";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/portal/application")({
  component: Page,
});

const STATUS_STEPS = [
  {
    id: 1,
    key: "DRAFT",
    title: "Draft",
    detail: "Category, personal details and documents are being prepared.",
    icon: FileText,
  },
  {
    id: 2,
    key: "PAYMENT_PENDING",
    title: "Payment",
    detail: "Fee checkout with Paystack is required before review.",
    icon: CreditCard,
  },
  {
    id: 3,
    key: "PAID_PENDING_REVIEW",
    title: "Secretariat review",
    detail: "Your file is with the Secretariat for decision.",
    icon: ClipboardList,
  },
  {
    id: 4,
    key: "APPROVED",
    title: "Approved",
    detail: "Membership number issued and digital card available.",
    icon: BadgeCheck,
  },
];

function statusToStep(status: string) {
  if (status === "APPROVED") return 4;
  if (status === "PAID_PENDING_REVIEW" || status === "INFO_REQUESTED" || status === "SUBMITTED") return 3;
  if (status === "PAYMENT_PENDING") return 2;
  if (status === "REJECTED" || status === "WITHDRAWN") return 3;
  return 1;
}

type AppDoc = {
  id?: string;
  type: string;
  url: string;
  mime?: string;
  reviewStatus?: string;
  reviewNote?: string | null;
};

function Page() {
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const q = useQuery({
    queryKey: ["my-application"],
    queryFn: () =>
      apiGet<{
        id: string;
        status: string;
        category: { name: string };
        assignedNumber?: string;
        adminNote?: string;
        missingDocuments: string[];
        requiredDocuments?: string[];
        documents?: AppDoc[];
        payments?: { status: string; paystackReference: string; amountNgn?: string | number }[];
      } | null>("/membership/applications/me"),
  });

  async function reupload(type: string, file: File) {
    if (!q.data?.id) return;
    setUploadingType(type);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("type", type);
      await api(`/membership/applications/${q.data.id}/documents`, { method: "POST", body });
      notify.success("Document uploaded. Secretariat will review it again.");
      await q.refetch();
    } finally {
      setUploadingType(null);
    }
  }

  if (q.isPending) return <Skeleton className="h-64" />;

  if (!q.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={FolderOpen}
          title="Application"
          subtitle="Track your membership file from draft through approval."
        />
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">You have not started an application.</p>
          <Button asChild className="mt-4">
            <Link to="/portal/apply" search={{}}>
              Start application
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const current = statusToStep(q.data.status);
  const canContinue = !["APPROVED", "REJECTED"].includes(q.data.status);
  const needsAction = q.data.status === "INFO_REQUESTED" || (q.data.documents ?? []).some((d) => d.reviewStatus === "REJECTED");

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FolderOpen}
        title="Application"
        subtitle={`${q.data.category.name} · ${q.data.status.replaceAll("_", " ")}`}
        actions={
          canContinue ? (
            <Button asChild>
              <Link to="/portal/apply" search={{}}>
                {needsAction ? "Update application" : "Continue application"}
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ApplyProgressTracker steps={STATUS_STEPS} current={current} />

        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">Current status</h2>
              <StatusChip
                tone={
                  q.data.status === "APPROVED"
                    ? "success"
                    : q.data.status === "REJECTED"
                      ? "danger"
                      : q.data.status === "INFO_REQUESTED"
                        ? "warning"
                        : "sky"
                }
              >
                {q.data.status.replaceAll("_", " ")}
              </StatusChip>
            </div>
            {q.data.assignedNumber && (
              <p className="mt-3 text-sm">
                Membership number: <strong>{q.data.assignedNumber}</strong>
              </p>
            )}
            {q.data.adminNote && (
              <p className="mt-3 rounded-xl bg-muted/50 px-3 py-2 text-sm whitespace-pre-wrap">{q.data.adminNote}</p>
            )}
            {needsAction && (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
                Action needed: replace rejected documents below, or update your information via Update application.
              </p>
            )}
            {q.data.missingDocuments?.length > 0 && (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
                Missing: {q.data.missingDocuments.join(", ")}
              </p>
            )}
          </section>

          {(q.data.documents?.length ?? 0) > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-sm font-semibold">Documents</h2>
              <div className="mt-4 space-y-4">
                {q.data.documents!.map((d) => {
                  const status = d.reviewStatus ?? "PENDING";
                  const canReplace =
                    status === "REJECTED" ||
                    (q.data!.status === "INFO_REQUESTED" && status !== "APPROVED") ||
                    ["DRAFT", "PAYMENT_PENDING"].includes(q.data!.status);
                  return (
                    <div key={`${d.type}-${d.url}`} className="rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
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
                        {canReplace && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              loading={uploadingType === d.type}
                              loadingText="Uploading…"
                              onClick={() => fileRefs.current[d.type]?.click()}
                            >
                              <Upload className="h-4 w-4" />
                              {status === "REJECTED" ? "Re-upload" : "Replace"}
                            </Button>
                            <input
                              ref={(el) => {
                                fileRefs.current[d.type] = el;
                              }}
                              type="file"
                              accept="image/jpeg,image/png,application/pdf,.docx"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void reupload(d.type, f);
                                e.target.value = "";
                              }}
                            />
                          </>
                        )}
                      </div>
                      {status === "REJECTED" && d.reviewNote && (
                        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive whitespace-pre-wrap">
                          {d.reviewNote}
                        </p>
                      )}
                      <div className="mt-3">
                        <AssetPreview url={d.url} label={d.type.replaceAll("_", " ")} mime={d.mime} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(q.data.payments?.length ?? 0) > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-sm font-semibold">Related payments</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {q.data.payments!.map((p) => (
                  <li key={p.paystackReference} className="flex justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <span className="font-mono text-xs">{p.paystackReference}</span>
                    <StatusChip tone={p.status === "SUCCESSFUL" ? "success" : "warning"}>{p.status}</StatusChip>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
