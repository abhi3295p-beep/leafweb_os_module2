import { NextRequest, NextResponse } from "next/server";

import { isAllowedMimeType, simpleStorageKey, validateUpload } from "@/lib/files";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = validateUpload(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid upload metadata" }, { status: 400 });
    }

    const { name, mimeType, sizeBytes } = result.data;
    if (!isAllowedMimeType(mimeType)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    if (sizeBytes <= 0 || sizeBytes > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds allowed size" }, { status: 413 });
    }

    const key = simpleStorageKey(name, "server-user");

    return NextResponse.json({ ok: true, storageKey: key, mimeType, sizeBytes }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
