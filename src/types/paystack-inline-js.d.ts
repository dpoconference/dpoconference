declare module "@paystack/inline-js" {
  export type PaystackSuccessResponse = {
    id?: number;
    reference: string;
    message?: string;
  };

  export type PaystackResumeCallbacks = {
    onSuccess?: (response: PaystackSuccessResponse) => void;
    onCancel?: () => void;
    onError?: (error: { message: string }) => void;
    onLoad?: (response: unknown) => void;
  };

  export default class PaystackPop {
    resumeTransaction(accessCode: string, callbacks?: PaystackResumeCallbacks): unknown;
    newTransaction(options: Record<string, unknown>): unknown;
  }
}
