import { cn } from "@/lib/cn";

export type TimelineItem = {
  id: string;
  title: string;
  description?: string;
  at: string;
};

export function Timeline({
  items,
  className,
}: {
  items: TimelineItem[];
  className?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ol className={cn("relative space-y-6 border-l border-line pl-6", className)}>
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[29px] mt-1.5 h-3 w-3 rounded-full bg-leaf" />
          <p className="text-sm text-gold">{item.at}</p>
          <p className="mt-1 font-medium text-foam">{item.title}</p>
          {item.description ? (
            <p className="mt-1 text-sm text-mist">{item.description}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
