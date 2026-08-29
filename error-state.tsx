export function ErrorState({
  title = "Something went wrong",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 px-6 py-10 text-center">
      <p className="font-display text-lg text-foam">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-rose-200">{description}</p>
    </div>
  );
}
