import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const payments = [
  { label: "Razorpay", amount: "₹40,000", status: "Succeeded" },
  { label: "Stripe", amount: "₹15,000", status: "Processing" },
  { label: "Manual", amount: "₹20,000", status: "Pending" },
];

export default function PaymentsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">Payments</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {payments.map((payment) => (
          <Card key={payment.label}>
            <CardTitle>{payment.label}</CardTitle>
            <CardDescription>
              <span className="block text-leaf">{payment.status}</span>
              <span className="block text-mist">Amount: {payment.amount}</span>
            </CardDescription>
          </Card>
        ))}
      </div>
    </main>
  );
}
