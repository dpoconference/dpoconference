import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  user: { id: string; firstName: string; lastName: string; email: string };
  asset: { id: string; title: string };
};

type Course = { id: string; title: string; isCourse: boolean; isPublished: boolean };

export const Route = createFileRoute("/admin/certificates")({
  component: Page,
});

function Page() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("cms.manage");
  const [email, setEmail] = useState("");
  const [assetId, setAssetId] = useState("");
  const [loading, setLoading] = useState(false);
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
  const eligibleCourses = (courses.data ?? []).filter((course) => course.isCourse && course.isPublished);

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You need cms.manage permission to manage course certificates.
      </div>
    );
  }
  if (certificates.isPending || courses.isPending) return <PageSkeleton />;

  async function issue(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPost("/admin/course-certificates", { email: email.trim().toLowerCase(), assetId });
      notify.success("Course certificate issued or already active.");
      setEmail("");
      await certificates.refetch();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Could not issue certificate.");
    } finally {
      setLoading(false);
    }
  }

  async function revoke(certificate: CourseCertificate) {
    if (!window.confirm(`Revoke ${certificate.certificateNumber} for ${certificate.user.email}?`)) return;
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
        title="Course certificates"
        subtitle="Review, issue, and revoke learner course certificates. Issuance requires completed course progress."
      />
      <form onSubmit={(e) => void issue(e)} className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-[1fr_1fr_auto]">
        <Input
          type="email"
          required
          placeholder="Learner email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
        >
          <option value="">Select published course</option>
          {eligibleCourses.map((course) => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
        <Button type="submit" loading={loading} disabled={!eligibleCourses.length}>
          Issue certificate
        </Button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card p-5">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-muted-foreground">
              <th className="p-2">Learner</th>
              <th className="p-2">Course</th>
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
                  <span className="block text-xs text-muted-foreground">{certificate.user.email}</span>
                </td>
                <td className="p-2">{certificate.asset.title}</td>
                <td className="p-2 font-mono text-xs">{certificate.certificateNumber}</td>
                <td className="p-2">{new Date(certificate.issuedAt).toLocaleDateString()}</td>
                <td className="p-2 text-right">
                  <Button size="sm" variant="outline" loading={loading} onClick={() => void revoke(certificate)}>
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
    </div>
  );
}
