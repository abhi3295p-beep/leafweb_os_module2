import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { createInvoiceRecord } from "@/lib/real-order-invoice";

const invoiceInputSchema = z.object({
  clientId: z.string().min(1),
  orderId: z.string().min(1),
  subtotal: z.number().positive(),
  tax: z.number().optional().default(0),
  dueAt: z.string().optional().nullable(),
});

export async function GET() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const invoices = await (await import("../../../../db")).prisma.invoice.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items: invoices });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = invoiceInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid invoice payload" }, { status: 400 });
    }

    const invoice = await createInvoiceRecord(user, parsed.data);
    return NextResponse.json({ item: invoice }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
