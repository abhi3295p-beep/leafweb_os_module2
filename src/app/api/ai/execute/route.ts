import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { createAiExecutionRecord, authorizeAiTool } from "@/lib/real-ai";

const aiInputSchema = z.object({
  employeeId: z.string().min(1),
  tool: z.string().min(1),
  scope: z.enum(["global", "client", "project"]).default("client"),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  status: z.enum(["RUNNING", "SUCCESS", "FAILED"]).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = aiInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid AI execution payload" }, { status: 400 });
    }

    const { employeeId, tool, scope, clientId, projectId, status } = parsed.data;
    const isAuthorized = authorizeAiTool(user, scope, tool, clientId ?? null);
    if (!isAuthorized) {
      return NextResponse.json({ error: "AI tool authorization failed" }, { status: 403 });
    }

    const execution = await createAiExecutionRecord(user, {
      employeeId,
      tool,
      scope,
      clientId,
      projectId,
      status,
    });

    return NextResponse.json({ item: execution }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
