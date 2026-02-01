import { cn } from "@/lib/cn";

type CheckmarkBadgeProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const iconSizeClasses = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
};

export default function CheckmarkBadge({
  size = "sm",
  className,
}: CheckmarkBadgeProps) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-emerald-600",
        sizeClasses[size],
        className
      )}
    >
      <svg
        className={cn("text-white", iconSizeClasses[size])}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}
