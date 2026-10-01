import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support | DPO Conference" }] }),
  component: Page,
});

function Page() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && user) {
    return <Navigate to="/portal/support" />;
  }

  return (
    <SiteLayout>
      <PageHero
        title="Member Support Centre"
        subtitle="Need help with your membership, payment, training, CPD, conference registration or portal access?"
      />
      <section className="mx-auto max-w-3xl space-y-8 px-6 py-12">
        <div className="mx-auto max-w-xl space-y-3 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-[color:var(--brand-deep)]">Sign in to open a ticket</h2>
          <p className="text-sm text-muted-foreground">
            Support tickets live in your member workspace so you can track replies and status without leaving the dashboard.
          </p>
          <Button
            className="w-full gradient-brand text-white"
            onClick={() => void navigate({ to: "/login", search: { redirect: "/portal/support" } })}
          >
            Sign in to support
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
