import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Quotations" };

export default function QuotationsPage() {
  return (
    <ComingSoon
      title="Quotations"
      description="Build branded, VAT-compliant quotations from your price list in seconds and track them until they convert."
      icon={FileText}
      part="Part 4"
      features={[
        "Line items pulled from the product catalogue",
        "Tiered pricing and customer-specific rates",
        "VAT, discounts and validity periods",
        "Branded PDF export and email send",
        "Open / viewed / accepted tracking",
        "One-click convert to sales order",
      ]}
    />
  );
}
