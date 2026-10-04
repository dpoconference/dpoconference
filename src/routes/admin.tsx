import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  Briefcase,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  Handshake,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Mic2,
  MessageSquare,
  Newspaper,
  Receipt,
  ScanLine,
  ScrollText,
  Ticket,
  UserRound,
  Users,
  UsersRound,
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
    { to: "/admin/applications", label: "Applications", icon: ClipboardList, group: "Growth", mobile: true },
    ...(hasPermission("membership.review")
      ? [{ to: "/admin/members", label: "Members", icon: UsersRound, group: "Growth", mobile: true } satisfies NavItem]
      : []),
    ...(hasPermission("fees.manage")
      ? [{ to: "/admin/fees", label: "Fees", icon: Receipt, group: "Growth" } satisfies NavItem]
      : []),
    { to: "/admin/payments", label: "Payments", icon: Wallet, group: "Growth", mobile: true },
    { to: "/admin/events", label: "Events", icon: Ticket, group: "Delivery", mobile: true },
    ...(hasPermission("events.manage")
      ? [{ to: "/admin/check-in", label: "Check-in", icon: ScanLine, group: "Delivery", mobile: true } satisfies NavItem]
      : []),
    { to: "/admin/cpd", label: "CPD", icon: GraduationCap, group: "Delivery" },
    ...(hasPermission("cms.manage")
      ? [
          { to: "/admin/cms", label: "Content", icon: Newspaper, group: "Delivery" } satisfies NavItem,
          { to: "/admin/learning", label: "Learning", icon: BookOpen, group: "Delivery" } satisfies NavItem,
          { to: "/admin/jobs", label: "Jobs", icon: Briefcase, group: "Delivery" } satisfies NavItem,
          { to: "/admin/communities", label: "Communities", icon: UsersRound, group: "Delivery" } satisfies NavItem,
          { to: "/admin/awards", label: "Awards", icon: Award, group: "Delivery" } satisfies NavItem,
          { to: "/admin/speakers", label: "Speakers", icon: Mic2, group: "Delivery" } satisfies NavItem,
          { to: "/admin/legal", label: "Legal", icon: ScrollText, group: "Delivery" } satisfies NavItem,
          { to: "/admin/faq", label: "FAQ", icon: HelpCircle, group: "Delivery" } satisfies NavItem,
        ]
      : []),
    ...(hasPermission("membership.review")
      ? [{ to: "/admin/mentorship", label: "Mentorship", icon: Handshake, group: "Delivery" } satisfies NavItem]
      : []),
    { to: "/admin/contacts", label: "Inbox", icon: Inbox, group: "Delivery" },
    { to: "/admin/chat", label: "Group chat", icon: MessageSquare, group: "Delivery", mobile: true },
    ...(hasPermission("users.manage")
      ? [{ to: "/admin/users", label: "Staff", icon: Users, group: "Governance" } satisfies NavItem]
      : []),
    { to: "/admin/reports", label: "Reports", icon: FileSpreadsheet, group: "Governance", mobile: true },
    ...(hasPermission("audit.view")
      ? [{ to: "/admin/audit", label: "Audit", icon: ScrollText, group: "Governance" } satisfies NavItem]
      : []),
  ];

  return (
    <AppShell
      title="Administration"
      subtitle="Admin Control Suite"
      suite="admin"
      searchPlaceholder="Search learners…"
      items={items}
    >
      <Outlet />
    </AppShell>
  );
}
