import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { MembershipApplyWizard } from "@/components/membership/MembershipApplyWizard";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/membership_/apply")({
  validateSearch: (s: Record<string, unknown>): { category?: string } =>
    typeof s.category === "string" ? { category: s.category } : {},
  head: () => ({ meta: [{ title: "Apply for Membership | Data Protection Officers Conference" }] }),
  component: ApplyPage,
});

function ApplyPage() {
  const { user, loading } = useAuth();
  const { category: preselect } = Route.useSearch();

  if (loading) {
    return (
      <SiteLayout>
        <PageHero title="Apply for Data Protection Officers Conference Membership" />
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Skeleton className="h-96" />
        </div>
      </SiteLayout>
    );
  }

  if (user) {
    return <Navigate to="/portal/apply" search={preselect ? { category: preselect } : {}} />;
  }

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Membership / Apply"
        title="Apply for Data Protection Officers Conference Membership"
        subtitle="Join a professional community committed to excellence in privacy, data protection and digital governance."
      />
      <section className="mx-auto max-w-3xl px-6 py-12">
        <MembershipApplyWizard preselect={preselect} />
      </section>
    </SiteLayout>
  );
}
