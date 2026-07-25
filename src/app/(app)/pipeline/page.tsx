import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Pipeline" };

export default function PipelinePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader
        title="Pipeline"
        description="Drag deals between stages. Totals and forecasts update instantly."
        actions={
          <Button size="sm">
            <Plus />
            New Deal
          </Button>
        }
      />
      <PipelineBoard />
    </div>
  );
}
