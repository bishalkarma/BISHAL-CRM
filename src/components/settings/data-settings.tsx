"use client";

import * as React from "react";
import { Database, Download, Upload } from "lucide-react";
import { CSV_HEADERS } from "@/lib/csv-import";
import { useData } from "@/components/providers/data-provider";
import { ImportDialog } from "@/components/companies/import-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Import and export live in Settings — they change data across the system. */
export function DataSettings() {
  const { companies, addCompanies } = useData();
  const [importOpen, setImportOpen] = React.useState(false);

  const exportCompanies = () => {
    const escape = (v: string) =>
      /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

    const rows = companies.map((c) =>
      [
        c.name,
        c.cluster ?? "",
        c.emirate,
        c.area,
        c.business,
        c.type,
        c.contactName,
        c.contactRole,
        c.email ?? "",
        c.phone,
        c.owner,
        c.leadSource,
        c.remarks,
      ].map(escape),
    );

    const csv = [CSV_HEADERS.map(escape), ...rows]
      .map((r) => r.join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bishal-crm-companies-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4 text-accent" />
            Data
          </CardTitle>
          <CardDescription>
            Bring your existing records in, or take a full copy out. Exports use
            the same column layout as the import template, so a file exported
            here can be edited and imported straight back.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-start gap-3 rounded-xl border border-border p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[var(--shadow-soft)]"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
              <Upload className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">Import companies</span>
              <span className="block text-xs text-muted-foreground">
                Download the sample, fill it in, upload. Every row is validated
                before anything is saved.
              </span>
            </span>
          </button>

          <button
            onClick={exportCompanies}
            className="flex items-start gap-3 rounded-xl border border-border p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[var(--shadow-soft)]"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <Download className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">Export companies</span>
              <span className="block text-xs text-muted-foreground">
                {companies.length} records as CSV, ready for Excel.
              </span>
            </span>
          </button>
        </CardContent>
      </Card>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        existingNames={companies.map((c) => c.name)}
        onImport={addCompanies}
      />
    </>
  );
}
