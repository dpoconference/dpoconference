import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  HelpCircle,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Mic2,
  MessageSquare,
  Newspaper,
  ScanLine,
  ScrollText,
  Ticket,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import type { NavItem } from "@/components/app/nav-types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, hasPermission } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <PageSkeleton />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" search={{ redirect: "/admin" }} />;
  if (!hasPermission("admin.access")) return <Navigate to="/portal" />;

  const items: NavItem[] = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, group: "Overview", mobile: true },
    { to: "/admin/profile", label: "Profile", icon: UserRound, group: "Overview", mobile: true },
    {
      to: "/admin/events",
      label: "Conference & events",
      icon: Ticket,
      group: "Conference",
      mobile: true,
    },
    { to: "/admin/payments", label: "Payments", icon: Wallet, group: "Conference", mobile: true },
    ...(hasPermission("events.manage")
      ? [
          {
            to: "/admin/seminar-groups",
            label: "Seminar group onboarding",
            icon: Users,
            group: "Conference",
          } satisfies NavItem,
        ]
      : []),
    ...(hasPermission("events.manage")
      ? [
          {
            to: "/admin/check-in",
            label: "Check-in",
            icon: ScanLine,
            group: "Conference",
            mobile: true,
          } satisfies NavItem,
        ]
      : []),
    { to: "/admin/cpd", label: "CPD", icon: GraduationCap, group: "Learning" },
    ...(hasPermission("cms.manage")
      ? [
          {
            to: "/admin/learning",
            label: "Learning and courses",
            icon: BookOpen,
            group: "Learning",
          } satisfies NavItem,
          {
            to: "/admin/certificates",
            label: "Certificates",
            icon: Award,
            group: "Learning",
          } satisfies NavItem,
          {
            to: "/admin/cms",
            label: "Website content",
            icon: Newspaper,
            group: "Website",
          } satisfies NavItem,
          {
            to: "/admin/speakers",
            label: "Speakers",
            icon: Mic2,
            group: "Website",
          } satisfies NavItem,
          {
            to: "/admin/legal",
            label: "Legal",
            icon: ScrollText,
            group: "Website",
          } satisfies NavItem,
          { to: "/admin/faq", label: "FAQ", icon: HelpCircle, group: "Website" } satisfies NavItem,
        ]
      : []),
    { to: "/admin/contacts", label: "Inbox", icon: Inbox, group: "Website" },
    { to: "/admin/chat", label: "Group chat", icon: MessageSquare, group: "Website", mobile: true },
    ...(hasPermission("users.manage")
      ? [
          {
            to: "/admin/learners",
            label: "Learners",
            icon: GraduationCap,
            group: "Learning",
          } satisfies NavItem,
          {
            to: "/admin/users",
            label: "Staff",
            icon: Users,
            group: "Governance",
          } satisfies NavItem,
        ]
      : []),
    ...(hasPermission("audit.view")
      ? [
          {
            to: "/admin/audit",
            label: "Audit",
            icon: ScrollText,
            group: "Governance",
          } satisfies NavItem,
        ]
      : []),
  ];

  return (
    <AppShell
      title="Conference administration"
      subtitle="Conference and learning operations"
      suite="admin"
      searchPlaceholder="Search learners…"
      items={items}
    >
      <Outlet />
    </AppShell>
  );
}
