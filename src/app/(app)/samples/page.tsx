import { Suspense } from "react";
import type { Metadata } from "next";
import { SamplesView } from "@/components/samples/samples-view";

export const metadata: Metadata = { title: "Samples Register" };

export default function SamplesPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 sm:py-6">
      <Suspense fallback={<SamplesSkeleton />}>
        <SamplesView />
      </Suspense>
    </div>
  );
}

function SamplesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-14 animate-pulse rounded-xl bg-secondary/60" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-2xl bg-secondary/60"
          />
        ))}
      </div>
      <div className="h-10 animate-pulse rounded-xl bg-secondary/60" />
      <div className="h-72 animate-pulse rounded-2xl bg-secondary/60" />
    </div>
  );
}
