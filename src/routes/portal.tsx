import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CreditCard,
  FileText,
  GraduationCap,
  Handshake,
  Home,
  IdCard,
  RefreshCw,
  ScrollText,
  LifeBuoy,
  MessageSquare,
  Shield,
  ShieldAlert,
  Ticket,
  UserRound,
  Users,
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
    { to: "/portal/application", label: "Application", icon: FileText, group: "Membership" },
    { to: "/portal/card", label: "Digital card", icon: IdCard, group: "Membership" },
    { to: "/portal/renew", label: "Renew", icon: RefreshCw, group: "Membership" },
    { to: "/portal/payments", label: "Payments", icon: Wallet, group: "Membership" },
    { to: "/portal/events", label: "My events", icon: Ticket, group: "Professional", mobile: true },
    {
      to: "/portal/library",
      label: "Library",
      icon: BookOpen,
      group: "Professional",
      mobile: true,
    },
    {
      to: "/portal/courses",
      label: "Courses",
      icon: GraduationCap,
      group: "Professional",
      mobile: true,
    },
    { to: "/portal/training", label: "Training", icon: GraduationCap, group: "Professional" },
    { to: "/portal/learning", label: "My learning", icon: GraduationCap, group: "Professional" },
    { to: "/portal/cpd", label: "CPD", icon: ScrollText, group: "Professional" },
    { to: "/portal/certificates", label: "Certificates", icon: CreditCard, group: "Professional" },
    {
      to: "/portal/threats",
      label: "Threat intel",
      icon: ShieldAlert,
      group: "Network",
      mobile: true,
    },
    { to: "/portal/mentorship", label: "Mentorship", icon: Handshake, group: "Network" },
    { to: "/portal/careers", label: "Careers", icon: Briefcase, group: "Network" },
    { to: "/portal/communities", label: "Communities", icon: Users, group: "Network" },
    {
      to: "/portal/messages",
      label: "Messages",
      icon: MessageSquare,
      group: "Network",
      mobile: true,
    },
    {
      to: "/portal/chat",
      label: "Group chat",
      icon: MessageSquare,
      group: "Network",
      mobile: true,
    },
    {
      to: "/portal/notifications",
      label: "Notifications",
      icon: Bell,
      group: "Network",
      mobile: true,
    },
    { to: "/portal/corporate", label: "Corporate", icon: Building2, group: "Network" },
    { to: "/portal/employer/jobs", label: "Vacancies", icon: Briefcase, group: "Network" },
    { to: "/portal/privacy", label: "Privacy", icon: Shield, group: "Network" },
    { to: "/portal/support", label: "Support", icon: LifeBuoy, group: "Network" },
  ];

  return (
    <AppShell
      title="Member portal"
      subtitle="Member workspace"
      suite="portal"
      searchPlaceholder="Search your workspace…"
      items={items}
    >
      <Outlet />
    </AppShell>
  );
}
