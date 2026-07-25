import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rising bar chart = sales growth */}
        <rect x="3" y="14" width="4.2" height="7" rx="1.4" fill="currentColor" opacity="0.55" />
        <rect x="9.9" y="9" width="4.2" height="12" rx="1.4" fill="currentColor" opacity="0.8" />
        <rect x="16.8" y="3" width="4.2" height="18" rx="1.4" fill="currentColor" />
      </svg>
    </span>
  );
}

export function LogoWordmark({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo />
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[15px] font-semibold tracking-tight">
            Bishal Sales
          </div>
          <div className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            CRM
          </div>
        </div>
      )}
    </div>
  );
}
