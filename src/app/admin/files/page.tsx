import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { canUserAccess, requireAuthenticatedUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "../../../../db";

export default async function FilesPage() {
  const user = await requireAuthenticatedUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-200">Authentication required</p>
          <h1 className="mt-4 font-display text-4xl text-foam">Sign in to continue</h1>
        </div>
      </main>
    );
  }

  if (!(await canUserAccess(user, PERMISSIONS.FILE_READ))) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-200">Access denied</p>
          <h1 className="mt-4 font-display text-4xl text-foam">File access required</h1>
        </div>
      </main>
    );
  }

  const where = user.clientId ? { clientId: user.clientId } : {};
  const files = await prisma.fileObject.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { id: true, originalName: true, visibility: true, mimeType: true },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">Files</h1>
      {files.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-line bg-panel p-8 text-mist">No files found for this scope.</div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {files.map((file) => (
            <Card key={file.id}>
              <CardTitle>{file.originalName}</CardTitle>
              <CardDescription>
                <span className="block text-leaf">{file.visibility}</span>
                <span className="block text-mist">{file.mimeType}</span>
              </CardDescription>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
