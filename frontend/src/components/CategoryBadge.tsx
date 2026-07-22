import { cn, CATEGORY_COLORS } from "@/lib/utils";

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export default function CategoryBadge({
  category,
  className,
}: CategoryBadgeProps) {
  const colorClass = CATEGORY_COLORS[category] || "bg-gray-500/20 text-gray-400";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        colorClass,
        className
      )}
    >
      {category}
    </span>
  );
}
