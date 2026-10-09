import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { apiGet } from "@/lib/api";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/payments/callback")({
  validateSearch: (s: Record<string, unknown>) => ({
    reference: typeof s.reference === "string" ? s.reference : typeof s.trxref === "string" ? s.trxref : "",
    purpose: typeof s.purpose === "string" ? s.purpose : "",
    linkedId: typeof s.linkedId === "string" ? s.linkedId : "",
  }),
  component: Page,
});

function Page() {
  const { reference, purpose, linkedId } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<"confirming" | "success" | "error">("confirming");

  useEffect(() => {
    if (!reference) return;
    apiGet(`/payments/${reference}/verify`)
      .then(() => {
        setStatus("success");
        notify.success("Payment confirmed.");
      })
      .catch(() => {
        setStatus("error");
        notify.error("We could not confirm this payment.");
      });
  }, [reference]);

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-6 py-24 text-center">
        {status === "confirming" ? (
          <>
            <h1 className="text-2xl font-extrabold">Confirming payment…</h1>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">Please wait.</p>
          </>
        ) : status === "error" ? (
          <>
            <h1 className="text-2xl font-extrabold">Payment needs verification</h1>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              We could not confirm this payment yet. Do not pay again while the transaction is being
              checked. Contact support with reference{" "}
              <span className="font-mono font-semibold">{reference || "not available"}</span>.
            </p>
            <Button className="mt-5" variant="outline" onClick={() => window.location.reload()}>
              Check payment again
            </Button>
          </>
        ) : purpose === "COURSE" ? (
          <>
            <h1 className="text-2xl font-extrabold">Course payment confirmed</h1>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              {user
                ? "Your enrollment is ready. Continue to your course."
                : "We’ve prepared your learner account. Check your email for a one-time link to set your password and access the course."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {linkedId ? (
                <Button asChild>
                  <Link to="/courses/$id" params={{ id: linkedId }}>
                    {user ? "Open course" : "View course"}
                  </Link>
                </Button>
              ) : null}
              {user ? (
                <Button asChild variant="outline">
                  <Link to="/portal/courses">My courses</Link>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link to="/courses">Browse courses</Link>
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold">Payment confirmed</h1>
            <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
              Your payment was verified successfully.
            </p>
            <Button
              className="mt-5"
              onClick={() => void navigate({ to: user ? "/portal/events" : "/" })}
            >
              Continue
            </Button>
          </>
        )}
      </section>
    </SiteLayout>
  );
}
