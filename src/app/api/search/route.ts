import { NextRequest, NextResponse } from "next/server";

import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { searchProtectedRecords } from "@/lib/real-search";

export async function GET(request: NextRequest) {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const resource = (searchParams.get("resource") ?? "lead") as "lead" | "client" | "project" | "order" | "invoice" | "payment" | "file" | "ai_execution";

  try {
    const items = await searchProtectedRecords(user, resource, query);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 503 });
  }
}
