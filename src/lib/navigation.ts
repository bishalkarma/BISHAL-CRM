import {
  BarChart3,
  Building2,
  CalendarCheck,
  LayoutDashboard,
  Settings,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  shortcut?: string;
  badge?: string;
  /** Shown in the mobile bottom tab bar. */
  mobile?: boolean;
  soon?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Sell",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        shortcut: "G D",
        mobile: true,
      },
      {
        label: "Deals Pipeline",
        href: "/pipeline",
        icon: Target,
        shortcut: "G P",
        mobile: true,
      },
      {
        label: "Companies",
        href: "/companies",
        icon: Building2,
        shortcut: "G C",
        mobile: true,
      },
      {
        label: "Contacts",
        href: "/contacts",
        icon: Users,
        shortcut: "G O",
      },
      {
        label: "Activities",
        href: "/activities",
        icon: CalendarCheck,
        shortcut: "G A",
        mobile: true,
      },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        shortcut: "G E",
      },
      { label: "Settings", href: "/settings", icon: Settings, shortcut: "G S" },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export const MOBILE_NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS.filter(
  (item) => item.mobile,
).slice(0, 4);
