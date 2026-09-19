"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, PanelLeft, Search, Settings } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle, ThemeSwitcher } from "@/components/theme/theme-switcher";
import { DataSourceBadge } from "./data-source-badge";
import { NotificationBell } from "./notification-bell";
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
import { useCurrentUser } from "@/hooks/use-current-user";

type UserInfo = {
  displayName: string;
  email: string;
};

/** Resolve the current user's display info. */
async function resolveUserInfo(): Promise<UserInfo | null> {
  if (!isSupabaseConfigured || !supabase) {
    const demoUser = sessionStorage.getItem("demo_user");
    if (!demoUser) return null;
    return {
      displayName:
        sessionStorage.getItem("demo_display_name") ?? CURRENT_USER.name,
      email: CURRENT_USER.email,
    };
  }

  // Check for a real Supabase session first
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    return {
      displayName: profile?.display_name ?? user.email ?? "User",
      email: user.email ?? "",
    };
  }

  // No Supabase session — fall back to demo session (user logged in with
  // correct username/password but Supabase auth failed due to email mismatch).
  const demoUser = sessionStorage.getItem("demo_user");
  if (!demoUser) return null;

  // Look up the real email from the profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("username", demoUser)
    .single();

  return {
    displayName:
      profile?.display_name ??
      sessionStorage.getItem("demo_display_name") ??
      CURRENT_USER.name,
    email: `${demoUser}@gmail.com`,
  };
}

export function Topbar({
  onOpenSearch,
  onOpenMobileNav,
  onToggleSidebar,
  sidebarCollapsed,
  onOpenCompany,
}: {
  onOpenCompany: (companyId: string) => void;
  onOpenSearch: () => void;
  onOpenMobileNav: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const current = ALL_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  const [isMac, setIsMac] = React.useState(true);
  const { user: userInfo } = useCurrentUser();

  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform ?? ""));
  }, []);

  const handleSignOut = React.useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem("demo_user");
    sessionStorage.removeItem("demo_user_id");
    sessionStorage.removeItem("demo_display_name");
    sessionStorage.removeItem("demo_user_role");
    router.push("/login");
  }, [router]);

  const name = userInfo?.displayName ?? CURRENT_USER.name;
  const email = userInfo?.email ?? CURRENT_USER.email;

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

      {/* Contextual page label on mobile */}
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
          {isMac ? "" : "Ctrl"} K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-0.5 lg:ml-2">
        <DataSourceBadge />

        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onOpenSearch}
          aria-label="Search"
        >
          <Search />
        </Button>

        <NotificationBell onOpenCompany={onOpenCompany} />

        <ThemeSwitcher />
        <ModeToggle />

        <Button variant="ghost" size="icon-sm" asChild aria-label="Settings">
          <Link href="/settings" title="Settings">
            <Settings />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 rounded-full outline-none ring-offset-2 ring-offset-background transition-transform duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account menu"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-accent/15 text-accent">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <DropdownMenuLabel className="normal-case tracking-normal">
              <div className="text-sm font-semibold text-foreground">
                {name}
              </div>
              <div className="truncate text-xs font-normal text-muted-foreground">
                {email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Profile settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
