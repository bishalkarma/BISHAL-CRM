import type { Metadata } from "next";
import { Target } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Pipeline" };

export default function PipelinePage() {
  return (
    <ComingSoon
      title="Deal Pipeline"
      description="A drag-and-drop Kanban board built for B2B trading cycles — from first enquiry through sampling, quotation and negotiation to a signed supply contract."
      icon={Target}
      part="Part 2"
      features={[
        "Drag-and-drop Kanban with custom stages",
        "Deal value, probability and weighted forecast",
        "Multi-currency deals (AED, USD, SAR)",
        "Rotting-deal alerts and stage SLAs",
        "Split by owner, segment or territory",
        "Bulk actions and inline editing",
      ]}
    />
  );
}
