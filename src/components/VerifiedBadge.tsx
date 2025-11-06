import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const VerifiedBadge = ({ size = "md", className }: VerifiedBadgeProps) => {
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-secondary text-secondary-foreground font-medium",
        sizes[size],
        className
      )}
    >
      <ShieldCheck className={iconSizes[size]} />
      <span>Verified</span>
    </div>
  );
};

export default VerifiedBadge;
