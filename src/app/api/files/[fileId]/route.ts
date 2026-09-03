import { NextRequest, NextResponse } from "next/server";

import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { downloadFileForUser } from "@/lib/real-files";

export async function GET(_: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  const user = await getCurrentAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { fileId } = await context.params;
    const file = await downloadFileForUser(user, fileId);
    return NextResponse.json({ item: file });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
