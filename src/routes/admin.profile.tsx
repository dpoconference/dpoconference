import { createFileRoute } from "@tanstack/react-router";
import { ProfileEditor } from "@/components/app/ProfileEditor";

export const Route = createFileRoute("/admin/profile")({
  component: () => <ProfileEditor suite="admin" />,
});
