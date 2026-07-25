import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CompaniesView } from "@/components/companies/companies-view";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader
        title="Companies"
        description="Customer relationships tracked through the SPANCOP cycle."
        actions={
          <Button size="sm">
            <Plus />
            New Company
          </Button>
        }
      />
      <CompaniesView />
    </div>
  );
}
