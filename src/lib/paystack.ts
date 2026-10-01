import PaystackPop from "@paystack/inline-js";

type PayWithPaystackOpts = {
  accessCode: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
  onError?: (message: string) => void;
};

/** Opens Paystack Inline popup for a server-initialized transaction (access_code). */
export function payWithPaystack(opts: PayWithPaystackOpts) {
  const popup = new PaystackPop();
  popup.resumeTransaction(opts.accessCode, {
    onSuccess: (response) => opts.onSuccess(response.reference),
    onCancel: () => opts.onClose(),
    onError: (error) => {
      opts.onError?.(error.message || "Payment could not be started.");
      opts.onClose();
    },
  });
}

/** Promise wrapper used by checkout helpers. Resolves null if the user closes the popup. */
export function openPaystackCheckout(accessCode: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    payWithPaystack({
      accessCode,
      onSuccess: (reference) => resolve(reference),
      onClose: () => resolve(null),
      onError: (message) => reject(new Error(message)),
    });
  });
}
