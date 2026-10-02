import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { apiPost, getAccessToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";

export const Route = createFileRoute("/portal/privacy")({
  component: Page,
});

const BASE = import.meta.env.VITE_API_URL ?? "https://backend-dpoconference.onrender.com/api/v1";

function Page() {
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Privacy & data"
        subtitle="Download a copy of your Data Protection Officers Conference data or request account deletion under the NDPA."
      />
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h3 className="font-semibold">Export my data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Downloads a JSON file with your profile, membership, applications, payments, tickets and related records.
          </p>
          <Button
            className="mt-3"
            loading={loadingExport}
            onClick={async () => {
              setLoadingExport(true);
              try {
                const headers = new Headers();
                const token = getAccessToken();
                if (token) headers.set("Authorization", `Bearer ${token}`);
                const res = await fetch(`${BASE}/auth/me/export`, { headers, credentials: "include" });
                if (!res.ok) throw new Error("Export failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "ndpo-data-export.json";
                a.click();
                URL.revokeObjectURL(url);
                notify.success("Data export downloaded.");
              } catch {
                notify.error("Could not export your data.");
              } finally {
                setLoadingExport(false);
              }
            }}
          >
            Download JSON export
          </Button>
        </div>
        <div className="border-t pt-4">
          <h3 className="font-semibold">Request account deletion</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Submits a deletion request to the Secretariat. This does not erase your account immediately — staff will verify and process it.
          </p>
          <Button
            className="mt-3"
            variant="destructive"
            loading={loadingDelete}
            onClick={async () => {
              if (!window.confirm("Submit an account deletion request to the Secretariat?")) return;
              setLoadingDelete(true);
              try {
                await apiPost<{ message: string }>("/auth/me/delete-request", {});
                notify.success("Deletion request submitted.");
              } finally {
                setLoadingDelete(false);
              }
            }}
          >
            Request deletion
          </Button>
        </div>
      </div>
    </div>
  );
}
