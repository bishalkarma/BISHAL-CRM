"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, PanelLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle, ThemeSwitcher } from "@/components/theme/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ALL_NAV_ITEMS } from "@/lib/navigation";
import { CURRENT_USER } from "@/lib/demo-data";
import { cn, initials } from "@/lib/utils";

export function Topbar({
  onOpenSearch,
  onOpenMobileNav,
  onToggleSidebar,
  sidebarCollapsed,
}: {
  onOpenSearch: () => void;
  onOpenMobileNav: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}) {
  const pathname = usePathname();
  const current = ALL_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  const [isMac, setIsMac] = React.useState(true);
  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform ?? ""));
  }, []);

  return (
    <header className="glass sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-5">
      {/* Mobile: open nav drawer */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu />
      </Button>

      {/* Desktop: expand collapsed sidebar */}
      {sidebarCollapsed && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden lg:inline-flex"
          onClick={onToggleSidebar}
          aria-label="Expand sidebar"
        >
          <PanelLeft />
        </Button>
      )}

      {/* Contextual page label on mobile. Not an <h1> — each page owns its
          own heading, so this stays a plain label to keep one h1 per view. */}
      <div className="truncate text-[15px] font-semibold tracking-tight sm:text-base lg:hidden">
        {current?.label ?? "Bishal Sales CRM"}
      </div>

      {/* Quick search */}
      <button
        onClick={onOpenSearch}
        className={cn(
          "group ml-auto hidden h-9 items-center gap-2.5 rounded-lg border border-border bg-secondary/60 px-3 text-sm text-muted-foreground transition-all duration-200 hover:border-accent/40 hover:bg-secondary lg:flex lg:w-[300px] xl:w-[380px]",
        )}
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search anything…</span>
        <kbd className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-0.5 lg:ml-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onOpenSearch}
          aria-label="Search"
        >
          <Search />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label="Notifications"
        >
          <Bell />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive" />
        </Button>

        <ThemeSwitcher />
        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 rounded-full outline-none ring-offset-2 ring-offset-background transition-transform duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account menu"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-accent/15 text-accent">
                  {initials(CURRENT_USER.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <DropdownMenuLabel className="normal-case tracking-normal">
              <div className="text-sm font-semibold text-foreground">
                {CURRENT_USER.name}
              </div>
              <div className="truncate text-xs font-normal text-muted-foreground">
                {CURRENT_USER.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile settings</DropdownMenuItem>
            <DropdownMenuItem>Team &amp; permissions</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
