import { createFileRoute } from "@tanstack/react-router";
import { ProfileEditor } from "@/components/app/ProfileEditor";

export const Route = createFileRoute("/portal/profile")({
  component: () => <ProfileEditor suite="portal" />,
});
