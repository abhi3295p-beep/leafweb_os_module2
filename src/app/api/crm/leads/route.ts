import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { listLeadsForUser, createLeadRecord } from "@/lib/real-crm";

const leadInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  message: z.string().min(1),
  serviceId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
});

export async function GET() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const leads = await listLeadsForUser(user);
    return NextResponse.json({ items: leads });
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
    const parsed = leadInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid lead payload" }, { status: 400 });
    }

    const lead = await createLeadRecord(user, parsed.data);
    return NextResponse.json({ item: lead }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
