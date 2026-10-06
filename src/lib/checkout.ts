import { apiGet, apiPost, payThenVerify, ApiRequestError } from "@/lib/api";
import type { BankTransferSession } from "@/components/payments/BankTransferCheckout";
import {
  resolveDefaultMethod,
  type PaymentMethodChoice,
  type PublicPaymentsConfig,
} from "@/components/payments/PaymentMethodStep";

export type CheckoutInput = {
  purpose: "MEMBERSHIP_APPLICATION" | "MEMBERSHIP_RENEWAL" | "CONFERENCE" | "SEMINAR" | "COURSE";
  linkedId?: string;
  email?: string;
  /** Preferred method when both are enabled. Ignored when only one method is available. */
  method?: PaymentMethodChoice;
};

export type CheckoutResult =
  | { mode: "none"; verified: true; cancelled: false }
  | {
      mode: "paystack";
      verified: boolean;
      cancelled: boolean;
      reference: string;
      amountNgn: number;
    }
  | { mode: "bank"; verified: false; cancelled: false; session: BankTransferSession };

let cachedConfig: { at: number; data: PublicPaymentsConfig } | null = null;

export async function loadPaymentsConfig(force = false): Promise<PublicPaymentsConfig> {
  const now = Date.now();
  if (!force && cachedConfig && now - cachedConfig.at < 60_000) return cachedConfig.data;
  const data = await apiGet<PublicPaymentsConfig>("/public/payments/config");
  cachedConfig = { at: now, data };
  return data;
}

export async function startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const config = await loadPaymentsConfig();
  if (!config.paystackEnabled && !config.bankTransferEnabled) {
    throw new ApiRequestError(
      503,
      "PAYMENTS_DISABLED",
      "Online payments are temporarily unavailable.",
    );
  }

  let method = input.method ?? resolveDefaultMethod(config);
  if (method === "PAYSTACK" && !config.paystackEnabled) method = "BANK_TRANSFER";
  if (method === "BANK_TRANSFER" && !config.bankTransferEnabled) method = "PAYSTACK";

  if (method === "BANK_TRANSFER") {
    const session = await apiPost<BankTransferSession>("/payments/bank-transfer/initiate", {
      purpose: input.purpose,
      linkedId: input.linkedId,
      email: input.email,
    });
    return { mode: "bank", verified: false, cancelled: false, session };
  }

  const pay = await payThenVerify({
    purpose: input.purpose,
    linkedId: input.linkedId,
    email: input.email,
  });
  return {
    mode: "paystack",
    verified: pay.verified,
    cancelled: pay.cancelled,
    reference: pay.reference,
    amountNgn: pay.amountNgn,
  };
}
