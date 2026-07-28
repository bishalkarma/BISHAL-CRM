import { Suspense } from "react";
import type { Metadata } from "next";
import { ActivitiesView } from "@/components/activities/activities-view";

export const metadata: Metadata = { title: "Activities" };

export default function ActivitiesPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 sm:py-6">
      {/*
        The view now reads from the URL so the bell can open Open tasks
        directly. useSearchParams opts the tree out of prerendering, so it
        needs a boundary — without one the whole page falls back to a blank
        client render.
      */}
      <Suspense fallback={<ActivitiesSkeleton />}>
        <ActivitiesView />
      </Suspense>
    </div>
  );
}

function ActivitiesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-14 animate-pulse rounded-xl bg-secondary/60" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[74px] animate-pulse rounded-2xl bg-secondary/60"
          />
        ))}
      </div>
      <div className="h-9 animate-pulse rounded-lg bg-secondary/60" />
      <div className="h-64 animate-pulse rounded-2xl bg-secondary/60" />
    </div>
  );
}
