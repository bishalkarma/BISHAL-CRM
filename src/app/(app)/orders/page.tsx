import type { Metadata } from "next";
import { Handshake } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <ComingSoon
      title="Sales Orders"
      description="From confirmed order to delivered and invoiced — with fulfilment status visible to the whole sales team."
      icon={Handshake}
      part="Part 4"
      features={[
        "Order confirmation and delivery notes",
        "Partial and scheduled deliveries",
        "Invoice and payment status",
        "Credit hold warnings",
        "Repeat and standing orders",
        "Accounting export",
      ]}
    />
  );
}
