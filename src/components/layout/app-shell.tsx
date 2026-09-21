"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { TodayPopup } from "./today-popup";
import { PipelinePopup } from "./pipeline-popup";
import { NewDealDialog } from "@/components/deals/new-deal-dialog";
import { NewCompanyDialog } from "@/components/companies/new-company-dialog";
import { NewContactDialog } from "@/components/contacts/new-contact-dialog";
import { LogActivityDialog } from "@/components/activities/log-activity-dialog";
import { CompanyDrawer } from "@/components/companies/company-drawer";
import { useCompanies } from "@/components/companies/use-companies";
import { useData } from "@/components/providers/data-provider";
import { MobileTabBar } from "./mobile-nav";
import { FloatingActionButton } from "./fab";
import { CommandPalette } from "./command-palette";
import { SaveErrorBanner } from "./save-error-banner";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { NotificationToast } from "./notification-toast";
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
  /** Set by the notification bell; cleared when the pop-up closes. */
  const [bellCompanyId, setBellCompanyId] = React.useState<string | null>(null);
  const { companies, transitions, moveStage, dismissSuggestion, addCompany } =
    useCompanies();
  const { addContact, addDeal } = useData();
  const bellCompany =
    companies.find((c) => c.id === bellCompanyId) ?? null;
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [activePopup, setActivePopup] = React.useState<"today" | "pipeline" | null>(null);

  /* FAB dialog state */
  const [newDealOpen, setNewDealOpen] = React.useState(false);
  const [newCompanyOpen, setNewCompanyOpen] = React.useState(false);
  const [newContactOpen, setNewContactOpen] = React.useState(false);
  const [logActivityOpen, setLogActivityOpen] = React.useState(false);

  const handleFabAction = React.useCallback((action: string) => {
    if (action === "deal") setNewDealOpen(true);
    else if (action === "company") setNewCompanyOpen(true);
    else if (action === "contact") setNewContactOpen(true);
    else if (action === "activity") setLogActivityOpen(true);
  }, []);

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
            collapsed ? "w-[72px]" : "w-[280px]",
          )}
        >
          <Sidebar collapsed={collapsed} onToggleCollapse={toggleSidebar} onOpenPopup={setActivePopup} />
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
            onOpenCompany={setBellCompanyId}
          />
          <main className="flex min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-24 lg:pb-8">{children}</main>
        </div>

        {/*
          Owned by the shell rather than a page, so a task opened from the
          bell appears over whatever you were doing. Closing it leaves you
          exactly where you were, with your scroll position intact.
        */}
        <CompanyDrawer
          company={bellCompany}
          transitions={transitions}
          open={Boolean(bellCompany)}
          onOpenChange={(next) => !next && setBellCompanyId(null)}
          onMoveStage={moveStage}
          onDismissSuggestion={dismissSuggestion}
        />

        <SaveErrorBanner />
        <MobileTabBar />
        <FloatingActionButton onAction={handleFabAction} />

        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          onShowShortcuts={() => setShortcutsOpen(true)}
        />
        <ShortcutsDialog
          open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
        />

        {/* Detail popups — overlay the main content */}
        {activePopup === "today" && (
          <TodayPopup onClose={() => setActivePopup(null)} />
        )}
        {activePopup === "pipeline" && (
          <PipelinePopup onClose={() => setActivePopup(null)} />
        )}

        {/* FAB dialogs */}
        <NewDealDialog
          open={newDealOpen}
          onOpenChange={setNewDealOpen}
          onCreate={(deal) => {
            addDeal(deal);
            setNewDealOpen(false);
          }}
          onCreateCompany={() => {}}
        />
        <NewCompanyDialog
          open={newCompanyOpen}
          onOpenChange={setNewCompanyOpen}
          onCreate={(company) => {
            addCompany(company);
            setNewCompanyOpen(false);
          }}
          existingNames={companies.map((c) => c.name)}
        />
        <NewContactDialog
          open={newContactOpen}
          onOpenChange={setNewContactOpen}
          onCreate={(contact) => {
            addContact(contact);
            setNewContactOpen(false);
          }}
        />
        {/* LogActivityDialog is self-contained — it manages its own addActivity call. */}
        <LogActivityDialog
          open={logActivityOpen}
          onOpenChange={setLogActivityOpen}
        />
        
        {/* Notification Toast - Shows unread notifications on login */}
        <NotificationToast />
      </div>
    </TooltipProvider>
  );
}
