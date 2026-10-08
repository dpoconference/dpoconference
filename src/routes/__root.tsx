import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  redirect,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { CookieBanner } from "@/components/site/CookieBanner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: ({ location }) => {
    const archivedRoutes = [
      /^\/(?:membership|members|verify-member|benefits|communities|mentorship|careers|partnerships|threat-intelligence|jobs)(?:\/|$)/,
      /^\/(?:portal|admin)\/(?:application|applications|apply|members|fees|mentorship|careers|communities|jobs|awards)(?:\/|$)/,
      /^\/portal\/(?:card|messages|corporate|employer|renew|threats)(?:\/|$)/,
    ];
    if (archivedRoutes.some((pattern) => pattern.test(location.pathname))) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Data Protection Officers Conference | Conferences and Learning" },
      {
        name: "description",
        content:
          "Discover professional conferences, seminars and continuing-learning courses for data protection and privacy professionals.",
      },
      { name: "author", content: "Data Protection Officers Conference" },
      {
        property: "og:title",
        content: "Data Protection Officers Conference | Conferences and Learning",
      },
      {
        property: "og:description",
        content:
          "Discover professional conferences, seminars and continuing-learning courses for data protection and privacy professionals.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://webthinkers.com/" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Data Protection Officers Conference | Conferences and Learning",
      },
      {
        name: "twitter:description",
        content:
          "Discover professional conferences, seminars and continuing-learning courses for data protection and privacy professionals.",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <HeadContent />
          <Outlet />
          <Toaster position="top-center" richColors closeButton />
          <CookieBanner />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
