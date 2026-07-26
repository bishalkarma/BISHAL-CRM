"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileTabBar } from "./mobile-nav";
import { FloatingActionButton } from "./fab";
import { CommandPalette } from "./command-palette";
import { SaveErrorBanner } from "./save-error-banner";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "bishal-crm-sidebar-collapsed";

/** Two-key "G then X" navigation sequences. */
const GOTO_MAP: Record<string, string> = {
  d: "/dashboard",
  p: "/pipeline",
  c: "/companies",
  o: "/contacts",
  a: "/activities",
  q: "/quotations",
  r: "/orders",
  i: "/products",
  e: "/reports",
  s: "/settings",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  // Restore sidebar preference
  React.useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === "true");
  }, []);

  const toggleSidebar = React.useCallback(() => {
    setCollapsed((prev) => {
      window.localStorage.setItem(SIDEBAR_KEY, String(!prev));
      return !prev;
    });
  }, []);

  // ---- Global keyboard shortcuts -------------------------------------
  const gPressed = React.useRef(false);
  const gTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) => {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        node.isContentEditable
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // ⌘K — command palette (works even while typing)
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      // ⌘B — toggle sidebar
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }
      // ⌘J — toggle dark mode
      if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        return;
      }

      if (mod || e.altKey || isTypingTarget(e.target)) return;

      // "G then X" navigation
      if (gPressed.current && GOTO_MAP[e.key.toLowerCase()]) {
        e.preventDefault();
        gPressed.current = false;
        router.push(GOTO_MAP[e.key.toLowerCase()]);
        return;
      }
      if (e.key.toLowerCase() === "g") {
        gPressed.current = true;
        if (gTimer.current) clearTimeout(gTimer.current);
        gTimer.current = setTimeout(() => (gPressed.current = false), 1200);
        return;
      }

      // "/" — quick search
      if (e.key === "/") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      // "?" — shortcuts
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      // "n" — new deal
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/pipeline");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, setTheme, resolvedTheme, toggleSidebar]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-dvh bg-background">
        {/* Desktop sidebar */}
        <div
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:block",
            collapsed ? "w-[72px]" : "w-[264px]",
          )}
        >
          <Sidebar collapsed={collapsed} onToggleCollapse={toggleSidebar} />
        </div>

        {/* Mobile drawer */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="p-0" hideClose>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onOpenSearch={() => setPaletteOpen(true)}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onToggleSidebar={toggleSidebar}
            sidebarCollapsed={collapsed}
          />
          <main className="flex-1 pb-24 lg:pb-8">{children}</main>
        </div>

        <SaveErrorBanner />
        <MobileTabBar />
        <FloatingActionButton />

        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          onShowShortcuts={() => setShortcutsOpen(true)}
        />
        <ShortcutsDialog
          open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
        />
      </div>
    </TooltipProvider>
  );
}
