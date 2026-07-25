import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <ComingSoon
      title="Reports & Analytics"
      description="Answer the questions that actually matter: what's growing, what's slipping, and where the next order is coming from."
      icon={BarChart3}
      part="Part 5"
      features={[
        "Sales performance by rep and territory",
        "Customer churn and reorder gap analysis",
        "Product mix and margin reporting",
        "Forecast accuracy vs actuals",
        "Custom report builder",
        "Scheduled email digests",
      ]}
    />
  );
}
