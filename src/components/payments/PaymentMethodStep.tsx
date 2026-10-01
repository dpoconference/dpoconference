export type PaymentMethodChoice = "PAYSTACK" | "BANK_TRANSFER";

export type PublicPaymentsConfig = {
  paystackEnabled: boolean;
  bankTransferEnabled: boolean;
  defaultMethod: PaymentMethodChoice;
};

type Props = {
  config: PublicPaymentsConfig;
  value: PaymentMethodChoice;
  onChange: (next: PaymentMethodChoice) => void;
};

export function PaymentMethodStep({ config, value, onChange }: Props) {
  const options: { id: PaymentMethodChoice; label: string; hint: string }[] = [];
  if (config.paystackEnabled) {
    options.push({ id: "PAYSTACK", label: "Pay with card (Paystack)", hint: "Instant confirmation after successful checkout." });
  }
  if (config.bankTransferEnabled) {
    options.push({
      id: "BANK_TRANSFER",
      label: "Bank transfer",
      hint: "Transfer to the Secretariat account and upload your receipt for verification.",
    });
  }
  if (options.length <= 1) return null;

  return (
    <fieldset className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment method</legend>
      {options.map((opt) => (
        <label key={opt.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent bg-card px-3 py-2 hover:border-primary/30">
          <input
            type="radio"
            name="payment-method"
            className="mt-1"
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
          />
          <span>
            <span className="block text-sm font-semibold">{opt.label}</span>
            <span className="block text-xs text-muted-foreground">{opt.hint}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function resolveDefaultMethod(config: PublicPaymentsConfig): PaymentMethodChoice {
  if (config.defaultMethod === "BANK_TRANSFER" && config.bankTransferEnabled) return "BANK_TRANSFER";
  if (config.paystackEnabled) return "PAYSTACK";
  if (config.bankTransferEnabled) return "BANK_TRANSFER";
  return "PAYSTACK";
}
