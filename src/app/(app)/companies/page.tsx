import type { Metadata } from "next";
import { CompaniesView } from "@/components/companies/companies-view";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-6">
      <CompaniesView />
    </div>
  );
}
