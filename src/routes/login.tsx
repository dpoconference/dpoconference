import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { parseAuthContinueSearch } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  validateSearch: parseAuthContinueSearch,
  head: () => ({
    meta: [
      { title: "Member Sign-in Paused | Data Protection Officers Conference" },
      { name: "description", content: "Member sign-in is temporarily unavailable." },
    ],
  }),
  component: LoginPaused,
});

function LoginPaused() {
  return (
    <SiteLayout>
      <main className="grid min-h-[55vh] place-items-center px-6 py-20">
        <div className="max-w-lg text-center">
          <p className="text-sm font-semibold uppercase text-[color:var(--brand-green)]">Member access</p>
          <h1 className="mt-3 text-3xl font-bold text-[color:var(--brand-deep)]">Sign-in is temporarily paused</h1>
          <p className="mt-3 text-[color:var(--muted-foreground)]">The member sign-in flow is unavailable for now.</p>
          <Link to="/" className="mt-6 inline-flex rounded-md px-5 py-3 text-sm font-semibold text-white gradient-brand">
            Return to the homepage
          </Link>
        </div>
      </main>
    </SiteLayout>
  );
}
