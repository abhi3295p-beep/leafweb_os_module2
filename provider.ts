export type PaymentIntentInput = {
  amount: number;
  currency: string;
  invoiceId: string;
  idempotencyKey: string;
};

export type PaymentIntentResult = {
  provider: "stripe" | "razorpay";
  externalId: string;
  clientSecret?: string;
};

/**
 * PaymentProvider is an integration boundary.
 * Phase 1 does not process live payments.
 */
export interface PaymentProvider {
  createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  verifyWebhook(payload: string, signature: string): Promise<boolean>;
}

export class UnimplementedPaymentProvider implements PaymentProvider {
  constructor(private readonly name: "stripe" | "razorpay") {}

  createIntent(): Promise<PaymentIntentResult> {
    return Promise.reject(
      new Error(`${this.name} payments are not enabled in Phase 1.`),
    );
  }

  verifyWebhook(): Promise<boolean> {
    return Promise.reject(
      new Error(`${this.name} webhooks are not enabled in Phase 1.`),
    );
  }
}
