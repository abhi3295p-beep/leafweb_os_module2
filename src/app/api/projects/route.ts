import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { createProjectRecord, listProjectsForUser } from "@/lib/real-projects";

const projectInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  clientId: z.string().min(1),
  budget: z.number().optional().nullable(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export async function GET() {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const projects = await listProjectsForUser(user);
    return NextResponse.json({ items: projects });
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
    const parsed = projectInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid project payload" }, { status: 400 });
    }

    const project = await createProjectRecord(user, parsed.data);
    return NextResponse.json({ item: project }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
