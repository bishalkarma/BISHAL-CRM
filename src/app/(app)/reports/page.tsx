import type { Metadata } from "next";
import { SalesPerformance } from "@/components/reports/sales-performance";
import { PipelineHealth } from "@/components/reports/pipeline-health";
import { CustomerRevenue } from "@/components/reports/customer-revenue";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div className="space-y-6 p-6">
      <SalesPerformance />
      <PipelineHealth />
      <CustomerRevenue />
    </div>
  );
}
