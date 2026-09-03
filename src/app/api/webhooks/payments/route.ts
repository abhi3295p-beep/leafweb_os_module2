import { NextRequest, NextResponse } from "next/server";

import { auditEvent } from "@/lib/audit";
import { verifyWebhookSignature, type PaymentProvider } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const provider = (request.headers.get("x-provider") ?? "stripe") as PaymentProvider;
  const signature = request.headers.get("x-signature");
  const payload = await request.text();

  const verification = verifyWebhookSignature(provider, payload, signature);

  if (!verification.isValid) {
    await auditEvent("payment_event", null, {
      resourceType: "payment",
      metadata: {
        provider,
        status: "rejected",
        verification,
      },
    });

    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  await auditEvent("payment_event", null, {
    resourceType: "payment",
    metadata: {
      provider,
      status: "verified",
      verification,
    },
  });

  return NextResponse.json({ ok: true, status: "verified" });
}
