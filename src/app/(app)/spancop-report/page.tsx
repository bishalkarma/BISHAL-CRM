import type { Metadata } from "next";
import { SpancopReport } from "@/components/dashboard/spancop-report";
import type { PeriodType } from "@/lib/spancop-periods";

export const metadata: Metadata = { title: "SPANCOP report" };

const VALID: PeriodType[] = ["week", "month", "quarter", "year"];

export default async function SpancopReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const initial = VALID.includes(period as PeriodType)
    ? (period as PeriodType)
    : "month";

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 sm:py-6">
      <SpancopReport initialPeriod={initial} />
    </div>
  );
}
