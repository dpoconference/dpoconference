import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

export const Route = createFileRoute("/cookie-settings")({
  head: () => ({
    meta: [
      { title: "Cookie settings | Data Protection Officers Conference" },
      { name: "description", content: "Choose whether Data Protection Officers Conference may use analytics and marketing cookies." },
    ],
  }),
  component: Page,
});

function Page() {
  const [analytics, setAnalytics] = useState(() => {
    try {
      return localStorage.getItem("ndpo_cookies") === "all";
    } catch {
      return false;
    }
  });

  return (
    <SiteLayout>
      <PageHero
        breadcrumb="Home / Legal"
        eyebrow="Legal & governance"
        title="Cookie settings"
        subtitle="Necessary cookies stay on so the site, login and payments can work. Analytics and marketing stay off until you accept them."
      />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-2xl border border-[color:var(--border)] bg-white p-6  sm:p-8 space-y-5">
          <p className="text-sm leading-7 text-[color:var(--muted-foreground)]">
            Read the{" "}
            <Link to="/legal/$slug" params={{ slug: "cookie-notice" }} className="font-semibold text-[color:var(--brand-green)] hover:underline">
              Cookie Notice
            </Link>{" "}
            and{" "}
            <Link to="/legal/$slug" params={{ slug: "privacy-notice" }} className="font-semibold text-[color:var(--brand-green)] hover:underline">
              Privacy Notice
            </Link>{" "}
            for the full explanation.
          </p>
          <label className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] p-4">
            <input type="checkbox" checked disabled className="mt-1" />
            <span>
              <span className="block font-semibold text-[color:var(--brand-deep)]">Necessary</span>
              <span className="mt-1 block text-sm text-[color:var(--muted-foreground)]">
                Security, login, cookie-consent memory and Paystack checkout. Always on.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] p-4">
            <input
              type="checkbox"
              className="mt-1"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
            />
            <span>
              <span className="block font-semibold text-[color:var(--brand-deep)]">Analytics and marketing</span>
              <span className="mt-1 block text-sm text-[color:var(--muted-foreground)]">
                Off until you accept. Data Protection Officers Conference does not currently set extra marketing cookies; this preference is stored
                if those tools are added later.
              </span>
            </span>
          </label>
          <Button
            className="gradient-brand text-white"
            onClick={() => {
              localStorage.setItem("ndpo_cookies", analytics ? "all" : "necessary");
              notify.success("Cookie preference saved.");
            }}
          >
            Save preferences
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
