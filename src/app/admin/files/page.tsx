import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const files = [
  { name: "Brand-guidelines.pdf", owner: "Client A", scope: "Project" },
  { name: "Scope-v2.docx", owner: "Client B", scope: "Shared" },
  { name: "Content-bank.zip", owner: "Operations", scope: "Internal" },
];

export default function FilesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">Files</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {files.map((file) => (
          <Card key={file.name}>
            <CardTitle>{file.name}</CardTitle>
            <CardDescription>
              <span className="block text-leaf">{file.scope}</span>
              <span className="block text-mist">Owner: {file.owner}</span>
            </CardDescription>
          </Card>
        ))}
      </div>
    </main>
  );
}
