import { cn } from "@/lib/utils";

// Renders a reusable loading placeholder block.
// Pages and cards use it to reserve space while data is loading.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
