import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QrCode, ScanLine } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { StatusChip } from "@/components/app/StatusChip";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/check-in")({
  component: Page,
});

type Conference = { id: string; title: string; isFree?: boolean };

type RegRow = {
  id: string;
  registrationNumber: string;
  status: string;
  attendanceStatus?: string | null;
  checkedInAt?: string | null;
  email?: string | null;
  details?: Record<string, unknown> | null;
};

type CheckInResult = {
  outcome: "ADMITTED" | "ALREADY" | "UNPAID" | "WRONG_CONFERENCE" | string;
  message?: string;
  registrationNumber?: string;
  attendee?: Record<string, unknown>;
  conferenceTitle?: string;
};

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<{ rawValue?: string }[]>;
};

function detailName(details?: Record<string, unknown> | null) {
  if (!details) return "—";
  const first = String(details.firstName ?? details.givenName ?? "").trim();
  const last = String(details.lastName ?? details.familyName ?? "").trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return String(details.name ?? details.fullName ?? "—");
}

function detailEmail(row: RegRow) {
  if (row.email) return row.email;
  const d = row.details;
  if (!d) return "—";
  return String(d.email ?? "—");
}

function outcomeTone(outcome: string): "success" | "warning" | "danger" | "neutral" {
  if (outcome === "ADMITTED") return "success";
  if (outcome === "ALREADY") return "warning";
  return "danger";
}

function outcomeWell(outcome: string) {
  if (outcome === "ADMITTED") return "border-[color:var(--brand-emerald)] bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]";
  if (outcome === "ALREADY") return "border-amber-400 bg-amber-50 text-amber-950";
  return "border-red-400 bg-red-50 text-red-950";
}

function Page() {
  const { hasPermission } = useAuth();
  const can = hasPermission("events.manage");
  const [conferenceId, setConferenceId] = useState("");
  const [search, setSearch] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [qrPayload, setQrPayload] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState("");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const conferences = useQuery({
    queryKey: ["admin-conferences-checkin"],
    queryFn: () => apiGet<Conference[]>("/admin/events/conferences"),
    enabled: can,
  });

  const regs = useQuery({
    queryKey: ["admin-checkin-regs", conferenceId],
    queryFn: () =>
      apiGet<RegRow[]>(
        `/admin/events/conferences/registrations?conferenceId=${encodeURIComponent(conferenceId)}`,
      ),
    enabled: can && Boolean(conferenceId),
  });

  const selected = conferences.data?.find((c) => c.id === conferenceId);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = regs.data ?? [];
    if (!needle) return rows;
    return rows.filter((r) => {
      const hay = `${detailName(r.details)} ${detailEmail(r)} ${r.registrationNumber} ${r.status}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [regs.data, search]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function admit(body: { conferenceId: string; registrationNumber?: string; qrPayload?: string }) {
    setLoading(true);
    try {
      const data = await apiPost<CheckInResult>("/admin/events/check-in", body);
      setResult(data);
      if (data.outcome === "ADMITTED") notify.success(data.message ?? "Admitted.");
      else if (data.outcome === "ALREADY") notify.warning(data.message ?? "Already admitted.");
      else notify.error(data.message ?? data.outcome);
      await regs.refetch();
    } catch (err) {
      setResult({
        outcome: "invalid",
        message: err instanceof Error ? err.message : "Check-in failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  function stopScan() {
    setScanning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function startScan() {
    setScanNote("");
    const Detector = (window as unknown as { BarcodeDetector?: new (opts?: { formats: string[] }) => BarcodeDetectorLike })
      .BarcodeDetector;
    if (!Detector) {
      setScanNote("Camera QR scan needs BarcodeDetector. Paste the QR payload instead.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanNote("Camera access is not available in this browser. Paste the QR payload instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      const detector = new Detector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(() => void tick());
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          const raw = codes.find((c) => c.rawValue)?.rawValue?.trim();
          if (raw) {
            setQrPayload(raw);
            stopScan();
            if (conferenceId) {
              void admit({ conferenceId, qrPayload: raw });
            } else {
              notify.info("QR captured. Select a conference, then Admit.");
            }
            return;
          }
        } catch {
          /* keep scanning */
        }
        rafRef.current = requestAnimationFrame(() => void tick());
      };
      rafRef.current = requestAnimationFrame(() => void tick());
    } catch {
      setScanNote("Could not open the camera. Paste the QR payload instead.");
      stopScan();
    }
  }

  if (!can) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        You need events.manage permission for door check-in.
      </div>
    );
  }

  if (conferences.isPending) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ScanLine}
        title="Check-in"
        subtitle={
          selected
            ? `Admit people to ${selected.title}. Payment must be successful unless free.`
            : "Select a conference, then admit by registration ID or QR."
        }
      />

      <label className="block max-w-md text-xs font-semibold">
        Conference
        <select
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={conferenceId}
          onChange={(e) => {
            setConferenceId(e.target.value);
            setResult(null);
          }}
        >
          <option value="">Select conference</option>
          {(conferences.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
              {c.isFree ? " (free)" : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Search name, email, or registration ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!conferenceId}
          />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-semibold">Name</th>
                  <th className="px-2 py-2 font-semibold">Email</th>
                  <th className="px-2 py-2 font-semibold">Reg ID</th>
                  <th className="px-2 py-2 font-semibold">Paid</th>
                  <th className="px-2 py-2 font-semibold">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {!conferenceId ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-8 text-center text-muted-foreground">
                      Choose a conference to load registrations.
                    </td>
                  </tr>
                ) : regs.isPending ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-8 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-8 text-center text-muted-foreground">
                      No registrations found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-[color:var(--brand-tint)]/40"
                      onClick={() => setRegNumber(r.registrationNumber)}
                    >
                      <td className="px-2 py-2">{detailName(r.details)}</td>
                      <td className="px-2 py-2 text-xs">{detailEmail(r)}</td>
                      <td className="px-2 py-2 font-mono text-xs">{r.registrationNumber}</td>
                      <td className="px-2 py-2">
                        <StatusChip tone={r.status === "PAID" || r.status === "CONFIRMED" ? "success" : "warning"}>
                          {r.status}
                        </StatusChip>
                      </td>
                      <td className="px-2 py-2 text-xs">{r.attendanceStatus ?? (r.checkedInAt ? "ATTENDED" : "—")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Admit</h2>
          </div>
          <label className="block text-xs font-semibold">
            Registration ID
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              placeholder="DPO-…"
            />
          </label>
          <Button
            className="w-full"
            loading={loading}
            disabled={!conferenceId || !regNumber.trim()}
            onClick={() => void admit({ conferenceId, registrationNumber: regNumber.trim() })}
          >
            Admit
          </Button>

          <label className="block text-xs font-semibold">
            QR payload
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border px-3 py-2 font-mono text-xs"
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              placeholder="Paste DPOCONF|… QR text here"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              loading={loading}
              disabled={!conferenceId || !qrPayload.trim()}
              onClick={() => void admit({ conferenceId, qrPayload: qrPayload.trim() })}
            >
              Admit from QR text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (scanning ? stopScan() : void startScan())}
            >
              {scanning ? "Stop camera" : "Scan QR"}
            </Button>
          </div>
          {scanNote && <p className="text-xs text-muted-foreground">{scanNote}</p>}
          <video
            ref={videoRef}
            className={`w-full rounded-md border border-border bg-black ${scanning ? "block aspect-video" : "hidden"}`}
            muted
            playsInline
          />

          {result && (
            <div className={`rounded-xl border p-4 ${outcomeWell(result.outcome)}`}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip tone={outcomeTone(result.outcome)}>{result.outcome}</StatusChip>
                {result.registrationNumber && (
                  <span className="font-mono text-xs">{result.registrationNumber}</span>
                )}
              </div>
              <p className="mt-2 text-sm">{result.message}</p>
              {result.attendee && (
                <p className="mt-1 text-xs opacity-80">
                  {detailName(result.attendee)} · {String(result.attendee.email ?? "")}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
