export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <p className="font-display text-lg text-foam">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-mist">{description}</p>
    </div>
  );
}
