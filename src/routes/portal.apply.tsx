import { createFileRoute } from "@tanstack/react-router";
import { MembershipApplyWizard } from "@/components/membership/MembershipApplyWizard";

export const Route = createFileRoute("/portal/apply")({
  validateSearch: (s: Record<string, unknown>): { category?: string } =>
    typeof s.category === "string" ? { category: s.category } : {},
  component: Page,
});

function Page() {
  const { category } = Route.useSearch();
  return <MembershipApplyWizard embedded preselect={category} />;
}
