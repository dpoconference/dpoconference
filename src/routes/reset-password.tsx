import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s.token === "string" ? s.token : "" }),
  head: () => ({ meta: [{ title: "Reset password | Data Protection Officers Conference" }] }),
  component: RedirectToPausedSignIn,
});

function RedirectToPausedSignIn() {
  return <Navigate to="/login" search={{}} replace />;
}
