import crypto from "node:crypto";

export type PaymentProvider = "stripe" | "razorpay" | "manual";

export type PaymentWebhookVerification = {
  provider: PaymentProvider;
  isValid: boolean;
  reason?: string;
};

export function verifyWebhookSignature(
  provider: PaymentProvider,
  payload: string,
  signature: string | null,
): PaymentWebhookVerification {
  const secret = process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`];

  if (!secret || !signature) {
    return { provider, isValid: false, reason: "Missing webhook secret or signature" };
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
  const isValid = expectedBuffer.length === receivedBuffer.length
    ? crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    : false;

  return { provider, isValid: isValid || false, reason: isValid ? undefined : "Signature mismatch" };
}

export function createIdempotencyKey(invoiceId: string, providerRef: string) {
  return `${invoiceId}:${providerRef}`;
}

export function getProviderReference(provider: PaymentProvider, providerRef: string) {
  return { provider, providerRef };
}
