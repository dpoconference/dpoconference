import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, GraduationCap } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/platform")({
  component: PlatformPage,
});

function PlatformPage() {
  const status = useQuery({
    queryKey: ["learner-login-status"],
    queryFn: () => apiGet<{ enabled: boolean }>("/auth/learner-login-status"),
    retry: false,
  });
  const { user } = useAuth();
  const destination = user?.permissions.includes("admin.access") ? "/admin" : "/portal";

  return (
    <SiteLayout>
      <main className="mx-auto max-w-4xl px-6 py-20">
        <div className="rounded-3xl border border-[color:var(--border)] bg-white p-8 shadow-sm md:p-12">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--brand-tint)] text-[color:var(--brand-green)]">
            {status.data?.enabled ? (
              <BookOpen className="h-7 w-7" />
            ) : (
              <GraduationCap className="h-7 w-7" />
            )}
          </div>
          {status.isPending ? (
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Checking platform availability…
            </p>
          ) : status.isError ? (
            <>
              <h1 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">
                Platform unavailable
              </h1>
              <p className="mt-3 text-[color:var(--muted-foreground)]">
                We couldn’t check the learner platform status. Please try again shortly.
              </p>
              <Button className="mt-6" onClick={() => void status.refetch()}>
                Try again
              </Button>
            </>
          ) : status.data.enabled ? (
            <>
              <h1 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">
                Continue your learning
              </h1>
              <p className="mt-3 text-[color:var(--muted-foreground)]">
                Sign in to access your conference learning, courses, group chat and CPD record.
              </p>
              <Button asChild className="mt-6">
                <Link to={user ? destination : "/login"}>
                  {user ? "Open learner portal" : "Log in"} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold text-[color:var(--brand-deep)]">
                Learning platform coming soon
              </h1>
              <p className="mt-3 text-[color:var(--muted-foreground)]">
                The learner platform is temporarily closed. Check back soon for courses, event
                learning and CPD access.
              </p>
            </>
          )}
        </div>
      </main>
    </SiteLayout>
  );
}
