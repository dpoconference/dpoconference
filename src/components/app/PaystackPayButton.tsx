import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openPaystackCheckout } from "@/lib/paystack";

/** React wrapper around Paystack Inline (official popup UI). */
export function PaystackPayButton({
  accessCode,
  label = "Pay with Paystack",
  loading: externalLoading,
  disabled,
  className,
  onSuccess,
  onCancel,
  onError,
}: {
  accessCode: string;
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onSuccess: (reference: string) => void | Promise<void>;
  onCancel?: () => void;
  onError?: (message: string) => void;
}) {
  return (
    <Button
      type="button"
      className={className ?? "gradient-brand text-white"}
      loading={externalLoading}
      loadingText="Opening Paystack…"
      disabled={disabled || !accessCode}
      onClick={async () => {
        try {
          const reference = await openPaystackCheckout(accessCode);
          if (!reference) {
            onCancel?.();
            return;
          }
          await onSuccess(reference);
        } catch (err) {
          onError?.(err instanceof Error ? err.message : "Payment could not be started.");
        }
      }}
    >
      {externalLoading ? <Loader2 className="animate-spin" /> : null}
      {label}
    </Button>
  );
}
