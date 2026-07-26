import type { Metadata } from "next";
import { ActivitiesView } from "@/components/activities/activities-view";

export const metadata: Metadata = { title: "Activities" };

export default function ActivitiesPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 sm:py-6">
      <ActivitiesView />
    </div>
  );
}
