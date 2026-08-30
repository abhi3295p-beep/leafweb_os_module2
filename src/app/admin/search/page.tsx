export default function SearchPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-display text-4xl text-foam">Search + Filtering</h1>
      <div className="mt-8 rounded-3xl border border-line bg-panel p-8">
        <label className="block text-sm text-mist">
          Search leads, clients, projects, orders, invoices and AI executions
          <input
            defaultValue=""
            className="mt-2 w-full rounded-2xl border border-line bg-ink px-4 py-3 text-foam"
            placeholder="Search..."
          />
        </label>
      </div>
    </main>
  );
}
