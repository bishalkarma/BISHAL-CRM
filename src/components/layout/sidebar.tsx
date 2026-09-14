"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Sparkles } from "lucide-react";
import { NAV_SECTIONS } from "@/lib/navigation";
import { LogoWordmark } from "./logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  className,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar",
        className,
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border px-4",
          collapsed ? "justify-center px-0" : "justify-between",
        )}
      >
        <Link href="/dashboard" onClick={onNavigate} className="min-w-0">
          <LogoWordmark collapsed={collapsed} />
        </Link>
        {!collapsed && onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            className="hidden lg:inline-flex"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft />
          </Button>
        )}
      </div>

      {/* Primary action */}
      <div className={cn("px-3 py-3", collapsed && "px-2")}>
        <Button
          className={cn("w-full", collapsed && "px-0")}
          size={collapsed ? "icon" : "default"}
          aria-label="Create new record"
        >
          <Plus />
          {!collapsed && <span>New Deal</span>}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 sm:space-y-5 overflow-y-auto px-2 sm:px-3 pb-4 scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                const link = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-200",
                      collapsed && "justify-center px-0",
                      active
                        ? "text-accent"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-accent/10"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 34,
                        }}
                      />
                    )}
                    <Icon className="relative size-[18px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="relative flex-1 truncate">
                          {item.label}
                        </span>
                        {item.soon && (
                          <Badge
                            variant="outline"
                            className="relative px-1.5 py-0 text-[10px]"
                          >
                            Soon
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* AI assistant teaser */}
      {!collapsed && (
        <div className="p-3">
          <div className="rounded-xl border border-accent/25 bg-accent/[0.07] p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="size-4 text-accent" />
              AI Assistant
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Auto-summaries, next-best actions and follow-up drafts.
            </p>
            <Badge variant="accent" className="mt-2">
              Coming in Part 5
            </Badge>
          </div>
        </div>
      )}
    </aside>
  );
}
