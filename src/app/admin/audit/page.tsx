import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const events = [
  { action: "Login", actor: "super_admin@leafweb.local" },
  { action: "Permission denied", actor: "client@leafweb.local" },
  { action: "Payment verified", actor: "stripe-webhook" },
];

export default function AuditPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">Audit Log</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {events.map((event) => (
          <Card key={`${event.action}-${event.actor}`}>
            <CardTitle>{event.action}</CardTitle>
            <CardDescription>
              <span className="block text-leaf">{event.actor}</span>
              <span className="block text-mist">No secret values logged</span>
            </CardDescription>
          </Card>
        ))}
      </div>
    </main>
  );
}
