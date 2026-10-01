import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/admin/users")({
  component: Page,
});

function Page() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "STAFF" as "ADMIN" | "STAFF",
  });
  const [created, setCreated] = useState<{ email: string; role: string } | null>(null);

  if (!hasPermission("users.manage")) {
    return <p className="text-sm text-muted-foreground">Only Super Admin / Admin can create staff users.</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Staff users" subtitle="Create ADMIN or STAFF accounts for the Secretariat." />
      <form
        className="space-y-3 rounded-2xl border border-border bg-card p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            const data = await apiPost<{ email: string; role: string }>("/admin/users", form);
            notify.success("User created.");
            setCreated(data);
            setForm({ email: "", firstName: "", lastName: "", password: "", role: "STAFF" });
          } finally {
            setLoading(false);
          }
        }}
      >
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded-md border px-3 py-2 text-sm"
            required
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <input
            className="rounded-md border px-3 py-2 text-sm"
            required
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
        <input
          className="w-full rounded-md border px-3 py-2 text-sm"
          required
          type="password"
          minLength={10}
          placeholder="Temporary password (min 10)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "STAFF" })}
        >
          <option value="STAFF">STAFF</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <Button type="submit" loading={loading} className="w-full">
          Create user
        </Button>
      </form>
      {created && (
        <p className="text-sm text-muted-foreground">
          Created {created.email} as {created.role}. Share the temporary password securely.
        </p>
      )}
    </div>
  );
}
