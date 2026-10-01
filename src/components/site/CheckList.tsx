import { CheckCircle2 } from "lucide-react";

export function CheckList({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-relaxed text-[color:var(--foreground)]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-emerald)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
