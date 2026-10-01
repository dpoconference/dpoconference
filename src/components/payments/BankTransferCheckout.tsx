import { useState } from "react";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { notify } from "@/lib/toast";

export type BankTransferSession = {
  paymentId: string;
  reference: string;
  amountNgn: number;
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    instructions: string;
  };
  receiptRequired: boolean;
  allowedReceiptMime: string[];
  uploadToken: string;
};

type Props = {
  session: BankTransferSession;
  onSubmitted?: () => void;
};

export function BankTransferCheckout({ session, onSubmitted }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!file) {
      notify.error("Choose a clear receipt image (JPEG/PNG preferred).");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("uploadToken", session.uploadToken);
      await apiPost(`/payments/${session.paymentId}/receipt`, body);
      setDone(true);
      notify.success("Receipt submitted. Awaiting Secretariat confirmation.");
      onSubmitted?.();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Could not upload receipt.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="text-base font-semibold text-[color:var(--brand-deep)]">Submitted for verification</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Reference <span className="font-mono font-semibold text-foreground">{session.reference}</span>. You will receive an
          email once the Secretariat confirms your transfer. Conference access and invites are issued after confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h3 className="text-base font-semibold text-[color:var(--brand-deep)]">Bank transfer</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Transfer exactly {formatNaira(session.amountNgn)} and use the reference as narration, then upload your receipt.
        </p>
      </div>

      <dl className="grid gap-2 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bank</dt>
          <dd className="font-medium">{session.bank.bankName}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account name</dt>
          <dd className="font-medium">{session.bank.accountName}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account number</dt>
          <dd className="font-mono font-semibold tracking-wide">{session.bank.accountNumber}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</dt>
          <dd className="font-semibold">{formatNaira(session.amountNgn)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment reference</dt>
          <dd className="font-mono text-sm font-semibold">{session.reference}</dd>
        </div>
      </dl>

      <p className="text-sm text-muted-foreground">{session.bank.instructions}</p>

      <label className="block text-xs font-semibold">
        Receipt (image preferred)
        <input
          type="file"
          accept={session.allowedReceiptMime.join(",")}
          className="mt-1 block w-full text-sm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <Button loading={busy} onClick={() => void submit()} className="w-full sm:w-auto">
        Submit for verification
      </Button>
    </div>
  );
}
