import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, BadgeCheck, Search } from "lucide-react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CourseCertificate = {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  title: string | null;
  user: { id: string; firstName: string; lastName: string; email: string };
  asset: { id: string; title: string } | null;
};

type Course = { id: string; title: string; isCourse: boolean; isPublished: boolean };

export const Route = createFileRoute("/admin/certificates")({
  component: Page,
});

function Page() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("cms.manage");
  const [email, setEmail] = useState("");
  const [certificateTitle, setCertificateTitle] = useState("");
  const [assetId, setAssetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"manage" | "generate" | "verify">("manage");
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationNumber, setVerificationNumber] = useState("");
  const certificates = useQuery({
    queryKey: ["admin-course-certificates"],
    queryFn: () => apiGet<CourseCertificate[]>("/admin/course-certificates"),
    enabled: canManage,
  });
  const courses = useQuery({
    queryKey: ["admin-certificate-courses"],
    queryFn: () => apiGet<Course[]>("/admin/learning-assets"),
    enabled: canManage,
  });
  const courseOptions = (courses.data ?? []).filter((course) => course.isCourse);
  const verifiedCertificate = useMemo(() => {
    const value = verificationNumber.trim().toLowerCase();
    if (!value) return undefined;
    return (certificates.data ?? []).find(
      (certificate) => certificate.certificateNumber.toLowerCase() === value,
    );
  }, [certificates.data, verificationNumber]);

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You need cms.manage permission to manage course certificates.
      </div>
    );
  }
  if (certificates.isPending) return <PageSkeleton />;

  async function issue(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await apiPost<{ certificateNumber: string }>("/admin/course-certificates", {
        email: email.trim().toLowerCase(),
        title: certificateTitle.trim(),
        ...(assetId ? { assetId } : {}),
      });
      notify.success(`Certificate ${result.certificateNumber} issued.`);
      setEmail("");
      setCertificateTitle("");
      setAssetId("");
      await certificates.refetch();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Could not issue certificate.");
    } finally {
      setLoading(false);
    }
  }

  async function revoke(certificate: CourseCertificate) {
    if (!window.confirm(`Revoke ${certificate.certificateNumber} for ${certificate.user.email}?`))
      return;
    setLoading(true);
    try {
      await apiDelete(`/admin/course-certificates/${certificate.id}`);
      notify.success("Certificate revoked. The action is recorded in the audit history.");
      await certificates.refetch();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Could not revoke certificate.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Award}
        title={
          view === "verify"
            ? "Certificate verification"
            : view === "generate"
              ? "Generate certificate"
              : "Manage certificates"
        }
        subtitle={
          view === "verify"
            ? "Check whether a DPO Conference LMS certificate is currently active."
            : view === "generate"
              ? "Issue an audited certificate to an individual at any time, with or without a course."
              : "Review issued certificates and revoke them when necessary."
        }
      />
      <nav
        aria-label="Certificate administration"
        className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2"
      >
        <Button
          type="button"
          size="sm"
          variant={view === "verify" ? "default" : "ghost"}
          onClick={() => setView("verify")}
        >
          <Search className="h-4 w-4" /> Verification
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === "manage" ? "default" : "ghost"}
          onClick={() => setView("manage")}
        >
          <Award className="h-4 w-4" /> Manage certificates
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === "generate" ? "default" : "ghost"}
          onClick={() => setView("generate")}
        >
          <BadgeCheck className="h-4 w-4" /> Generate
        </Button>
      </nav>
      {certificates.isError || (view === "generate" && courses.isError) ? (
        <div className="rounded-2xl border border-destructive/30 bg-card p-5 text-sm text-destructive">
          Certificate data could not be loaded. Refresh and try again.
        </div>
      ) : null}
      {view === "generate" ? (
        <form
          onSubmit={(e) => void issue(e)}
          className="space-y-4 rounded-2xl border border-border bg-card p-5"
        >
          <div>
            <h2 className="font-semibold">Generate an individual certificate</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No course enrolment, completion, or published course is required. The recipient must
              have an account so the certificate appears in their portal.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              Recipient email
              <Input
                type="email"
                required
                placeholder="learner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Certificate title
              <Input
                required
                minLength={3}
                maxLength={255}
                placeholder="e.g. Certificate of Achievement"
                value={certificateTitle}
                onChange={(e) => setCertificateTitle(e.target.value)}
              />
            </label>
          </div>
          <label className="block space-y-1 text-sm font-medium">
            Related course (optional)
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
            >
              <option value="">No course — issue standalone certificate</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                  {course.isPublished ? "" : " (draft)"}
                </option>
              ))}
            </select>
            {courses.isError ? (
              <span className="block text-xs font-normal text-muted-foreground">
                Course list unavailable; you can still issue a standalone certificate.
              </span>
            ) : null}
          </label>
          <Button type="submit" loading={loading}>
            Issue certificate
          </Button>
        </form>
      ) : null}
      {view === "verify" ? (
        <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BadgeCheck className="h-4 w-4" /> DPO LMS certificate verification
            </span>
            <h2 className="mt-4 text-2xl font-bold">Verify certificate authenticity</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Search active certificates by their certificate number.
            </p>
          </div>
          <div className="mx-auto flex max-w-3xl flex-wrap gap-3">
            <Input
              className="min-w-[min(100%,20rem)] flex-1 font-mono"
              placeholder="Enter certificate number"
              value={verificationInput}
              onChange={(event) => setVerificationInput(event.target.value)}
            />
            <Button
              type="button"
              onClick={() => setVerificationNumber(verificationInput.trim())}
              disabled={!verificationInput.trim() || certificates.isError}
            >
              <Search className="h-4 w-4" /> Verify
            </Button>
          </div>
          {verificationNumber.trim() && !certificates.isError ? (
            verifiedCertificate ? (
              <div className="mx-auto max-w-3xl rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Certificate is valid and active
                </p>
                <p className="mt-2 text-sm">
                  {verifiedCertificate.user.firstName} {verifiedCertificate.user.lastName} ·{" "}
                  {verifiedCertificate.user.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {verifiedCertificate.title ??
                    verifiedCertificate.asset?.title ??
                    "Certificate of Achievement"}
                </p>
                <p className="mt-2 font-mono text-xs">{verifiedCertificate.certificateNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Issued {new Date(verifiedCertificate.issuedAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="mx-auto max-w-3xl rounded-xl border border-border p-4 text-sm text-muted-foreground">
                No active course certificate matches that number. It may be invalid or revoked.
              </p>
            )
          ) : null}
        </section>
      ) : null}
      {view === "manage" ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card p-5">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-muted-foreground">
                <th className="p-2">Learner</th>
                <th className="p-2">Certificate title</th>
                <th className="p-2">Certificate number</th>
                <th className="p-2">Issued</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {(certificates.data ?? []).map((certificate) => (
                <tr key={certificate.id} className="border-t">
                  <td className="p-2">
                    {certificate.user.firstName} {certificate.user.lastName}
                    <span className="block text-xs text-muted-foreground">
                      {certificate.user.email}
                    </span>
                  </td>
                  <td className="p-2">
                    {certificate.title ?? certificate.asset?.title ?? "Certificate of Achievement"}
                    {certificate.asset && certificate.title !== certificate.asset.title ? (
                      <span className="block text-xs text-muted-foreground">
                        Related course: {certificate.asset.title}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-2 font-mono text-xs">{certificate.certificateNumber}</td>
                  <td className="p-2">{new Date(certificate.issuedAt).toLocaleDateString()}</td>
                  <td className="p-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loading}
                      onClick={() => void revoke(certificate)}
                    >
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!certificates.data?.length ? (
            <p className="py-5 text-sm text-muted-foreground">No active course certificates yet.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
