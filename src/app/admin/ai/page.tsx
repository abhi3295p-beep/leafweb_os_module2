import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const aiEmployees = [
  { name: "Lead Generation AI", scope: "Client", status: "Ready" },
  { name: "Sales AI", scope: "Client", status: "Monitoring" },
  { name: "Project Manager AI", scope: "Project", status: "Active" },
];

export default function AiPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">AI Employees</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {aiEmployees.map((employee) => (
          <Card key={employee.name}>
            <CardTitle>{employee.name}</CardTitle>
            <CardDescription>
              <span className="block text-leaf">{employee.status}</span>
              <span className="block text-mist">Scope: {employee.scope}</span>
            </CardDescription>
          </Card>
        ))}
      </div>
    </main>
  );
}
