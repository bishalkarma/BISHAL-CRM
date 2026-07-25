import type { Metadata } from "next";
import { Users } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  return (
    <ComingSoon
      title="Contacts"
      description="Executive chefs, F&B managers, purchasing heads and owners — with roles, influence and full interaction history."
      icon={Users}
      part="Part 3"
      features={[
        "Role-aware contacts (Chef, Purchaser, Owner)",
        "Decision-maker and influencer mapping",
        "WhatsApp, call and email logging",
        "Business card scan to contact",
        "Birthday and follow-up reminders",
        "Duplicate detection and merge",
      ]}
    />
  );
}
