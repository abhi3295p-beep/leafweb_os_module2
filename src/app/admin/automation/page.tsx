import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const automations = [
  { name: "Lead follow-up", trigger: "Lead qualified" },
  { name: "Invoice reminder", trigger: "Due date approaching" },
  { name: "Project notification", trigger: "Milestone update" },
];

export default function AutomationPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">Automation</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {automations.map((automation) => (
          <Card key={automation.name}>
            <CardTitle>{automation.name}</CardTitle>
            <CardDescription>
              <span className="block text-leaf">{automation.trigger}</span>
              <span className="block text-mist">Retry + idempotency protections enabled</span>
            </CardDescription>
          </Card>
        ))}
      </div>
    </main>
  );
}
