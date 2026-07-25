import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Activities" };

export default function ActivitiesPage() {
  return (
    <ComingSoon
      title="Activities"
      description="Plan your day in the field: visits, calls, tastings and sample drops — with route planning for outlet visits."
      icon={CalendarCheck}
      part="Part 4"
      features={[
        "Calendar, list and map views",
        "Check-in with GPS on outlet visits",
        "Sample tracking and tasting notes",
        "Recurring visit cycles per account",
        "Task priorities and overdue alerts",
        "Calendar sync (Google / Outlook)",
      ]}
    />
  );
}
