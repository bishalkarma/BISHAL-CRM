import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  return (
    <ComingSoon
      title="Companies"
      description="Every hotel, restaurant, café, catering kitchen and distributor you sell to — with outlets, credit terms and buying history in one record."
      icon={Building2}
      part="Part 3"
      features={[
        "Account types: Hotel, Restaurant, Café, Project",
        "Parent groups with multiple outlets",
        "Credit limit, payment terms and trade licence",
        "Assigned sales rep and territory",
        "Order history and reorder patterns",
        "Smart filters and saved views",
      ]}
    />
  );
}
