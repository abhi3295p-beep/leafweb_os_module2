import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const orders = [
  { name: "Web development", amount: "₹85,000", status: "Approved" },
  { name: "E-commerce growth", amount: "₹1,60,000", status: "Submitted" },
  { name: "AI automation", amount: "₹1,20,000", status: "Converted" },
];

export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">Orders</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {orders.map((order) => (
          <Card key={order.name}>
            <CardTitle>{order.name}</CardTitle>
            <CardDescription>
              <span className="block text-leaf">{order.status}</span>
              <span className="block text-mist">Amount: {order.amount}</span>
            </CardDescription>
          </Card>
        ))}
      </div>
    </main>
  );
}
