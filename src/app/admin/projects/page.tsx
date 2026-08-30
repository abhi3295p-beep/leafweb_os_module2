import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const projects = [
  { name: "Growth site revamp", status: "Development", progress: "74%" },
  { name: "Client portal", status: "Planning", progress: "31%" },
  { name: "Automation suite", status: "QA", progress: "88%" },
];

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">Projects</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.name}>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>
              <span className="block text-leaf">{project.status}</span>
              <span className="block text-mist">Progress: {project.progress}</span>
            </CardDescription>
          </Card>
        ))}
      </div>
    </main>
  );
}
