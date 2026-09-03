import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { createOrderRecord } from "@/lib/real-order-invoice";

const orderInputSchema = z.object({
  clientId: z.string().min(1),
  serviceId: z.string().min(1),
  packageId: z.string().optional().nullable(),
  description: z.string().min(1),
  budget: z.number().optional().nullable(),
  deadline: z.string().optional().nullable(),
  features: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const orders = await (await import("../../../../db")).prisma.order.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items: orders });
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
    const parsed = orderInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
    }

    const order = await createOrderRecord(user, parsed.data);
    return NextResponse.json({ item: order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
