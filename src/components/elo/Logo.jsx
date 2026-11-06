import { cn } from "@/lib/utils";

export default function Logo({ className, showWordmark = true, size = 34 }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="elo-mark" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(var(--primary))" />
            <stop offset="1" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <circle cx="15" cy="20" r="10" stroke="url(#elo-mark)" strokeWidth="2.4" />
        <circle cx="25" cy="20" r="10" stroke="hsl(var(--accent))" strokeWidth="2.4" opacity="0.75" />
      </svg>
      {showWordmark && (
        <span className="font-heading text-[1.6rem] font-semibold leading-none tracking-tight text-foreground">
          elo
        </span>
      )}
    </div>
  );
}