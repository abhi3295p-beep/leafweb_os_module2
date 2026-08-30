import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const projects = [
  { name: "Growth website refresh", status: "In progress" },
  { name: "Client portal", status: "Planning" },
  { name: "Automation suite", status: "Ready for setup" },
];

export default function ProjectsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-16">
        <h1 className="font-display text-5xl text-foam">Work</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.name}>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>{project.status}</CardDescription>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
