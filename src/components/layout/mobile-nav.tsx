"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MOBILE_NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** iOS-style bottom tab bar — the primary navigation on phones. */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="glass safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border lg:hidden">
      <ul className="flex items-stretch">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors duration-200",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tabbar-active"
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="size-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
