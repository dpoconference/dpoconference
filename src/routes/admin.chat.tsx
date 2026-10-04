import { createFileRoute } from "@tanstack/react-router";
import { GlobalChat } from "@/components/app/GlobalChat";

export const Route = createFileRoute("/admin/chat")({
  component: GlobalChat,
});