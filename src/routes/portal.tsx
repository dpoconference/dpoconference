import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import {
  Award,
  Bell,
  BookOpen,
  GraduationCap,
  Home,
  ScrollText,
  LifeBuoy,
  MessageSquare,
  Shield,
  Ticket,
  UserRound,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import type { NavItem } from "@/components/app/nav-types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/portal")({
  component: PortalLayout,
});

function PortalLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <PageSkeleton />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" search={{ redirect: "/portal" }} />;

  const items: NavItem[] = [
    { to: "/portal", label: "Dashboard", icon: Home, group: "Workspace", mobile: true },
    { to: "/portal/profile", label: "Profile", icon: UserRound, group: "Workspace", mobile: true },
    { to: "/portal/events", label: "My events", icon: Ticket, group: "Conference", mobile: true },
    {
      to: "/portal/library",
      label: "Library",
      icon: BookOpen,
      group: "Learning",
      mobile: true,
    },
    {
      to: "/portal/courses",
      label: "Courses",
      icon: GraduationCap,
      group: "Learning",
      mobile: true,
    },
    { to: "/portal/training", label: "Training", icon: GraduationCap, group: "Learning" },
    { to: "/portal/learning", label: "My learning", icon: GraduationCap, group: "Learning" },
    { to: "/portal/cpd", label: "CPD", icon: ScrollText, group: "Learning" },
    { to: "/portal/chat", label: "Group chat", icon: MessageSquare, group: "Learning" },
    { to: "/portal/certificates", label: "Certificates", icon: Award, group: "Learning" },
    { to: "/portal/payments", label: "Payments", icon: Wallet, group: "Conference" },
    {
      to: "/portal/notifications",
      label: "Notifications",
      icon: Bell,
      group: "Workspace",
      mobile: true,
    },
    { to: "/portal/privacy", label: "Privacy", icon: Shield, group: "Workspace" },
    { to: "/portal/support", label: "Support", icon: LifeBuoy, group: "Workspace" },
  ];

  return (
    <AppShell
      title="Learning portal"
      subtitle="Conference and learner workspace"
      suite="portal"
      searchPlaceholder="Search your workspace…"
      items={items}
    >
      <Outlet />
    </AppShell>
  );
}
