import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const invoices = [
  { number: "INV-1042", total: "₹85,000", status: "Sent" },
  { number: "INV-1046", total: "₹1,20,000", status: "Partially paid" },
  { number: "INV-1049", total: "₹1,60,000", status: "Overdue" },
];

export default function InvoicesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">Invoices</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {invoices.map((invoice) => (
          <Card key={invoice.number}>
            <CardTitle>{invoice.number}</CardTitle>
            <CardDescription>
              <span className="block text-leaf">{invoice.status}</span>
              <span className="block text-mist">Total: {invoice.total}</span>
            </CardDescription>
          </Card>
        ))}
      </div>
    </main>
  );
}
