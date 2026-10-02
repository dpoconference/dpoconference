import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password | Data Protection Officers Conference" }] }),
  component: RedirectToPausedSignIn,
});

function RedirectToPausedSignIn() {
  return <Navigate to="/login" search={{}} replace />;
}
