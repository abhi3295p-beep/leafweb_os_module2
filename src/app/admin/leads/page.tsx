import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const leads = [
  { name: "Northwind Labs", status: "Qualified", owner: "A. Cook" },
  { name: "Prism Studio", status: "Proposal", owner: "M. Singh" },
  { name: "Blue Harbor", status: "Follow-up", owner: "R. Shah" },
];

export default function LeadsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">Leads</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {leads.map((lead) => (
          <Card key={lead.name}>
            <CardTitle>{lead.name}</CardTitle>
            <CardDescription>
              <span className="block text-leaf">{lead.status}</span>
              <span className="block text-mist">Owner: {lead.owner}</span>
            </CardDescription>
          </Card>
        ))}
      </div>
    </main>
  );
}
