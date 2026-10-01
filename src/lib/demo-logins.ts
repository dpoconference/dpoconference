export type DemoLogin = {
  id: string;
  label: string;
  email: string;
  password: string;
  role: string;
  suite: "admin" | "portal";
};

export const DEMO_LOGINS: DemoLogin[] = [
  {
    id: "super-admin",
    label: "Super Admin",
    email: "admin@ndpo.com",
    password: "#Admin1234",
    role: "SUPER_ADMIN",
    suite: "admin",
  },
  {
    id: "admin",
    label: "Admin",
    email: "admin.demo@dpoconference.com",
    password: "DemoAdmin@2026!",
    role: "ADMIN",
    suite: "admin",
  },
  {
    id: "staff",
    label: "Staff",
    email: "staff.demo@dpoconference.com",
    password: "DemoStaff@2026!",
    role: "STAFF",
    suite: "admin",
  },
  {
    id: "member",
    label: "Member",
    email: "member.demo@dpoconference.com",
    password: "DemoUser@2026!",
    role: "MEMBER",
    suite: "portal",
  },
  {
    id: "applicant",
    label: "Applicant",
    email: "applicant.demo@dpoconference.com",
    password: "DemoUser@2026!",
    role: "APPLICANT",
    suite: "portal",
  },
  {
    id: "corporate-admin",
    label: "Corporate",
    email: "corporate.demo@dpoconference.com",
    password: "DemoUser@2026!",
    role: "CORPORATE_ADMIN",
    suite: "portal",
  },
  {
    id: "corporate-staff",
    label: "Corp. staff",
    email: "corpstaff.demo@dpoconference.com",
    password: "DemoUser@2026!",
    role: "CORPORATE_STAFF",
    suite: "portal",
  },
  {
    id: "employer",
    label: "Employer",
    email: "employer.demo@dpoconference.com",
    password: "DemoUser@2026!",
    role: "EMPLOYER",
    suite: "portal",
  },
  {
    id: "guest",
    label: "Guest",
    email: "guest.demo@dpoconference.com",
    password: "DemoUser@2026!",
    role: "GUEST",
    suite: "portal",
  },
];
