"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import type { Company } from "@/lib/companies";
import {
  buildImportPreview,
  buildSampleCsv,
  type ImportPreview,
} from "@/lib/csv-import";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ImportDialog({
  open,
  onOpenChange,
  existingNames,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNames: string[];
  onImport: (companies: Company[]) => void;
}) {
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [fileName, setFileName] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const downloadSample = () => {
    const blob = new Blob([buildSampleCsv()], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bishal-crm-companies-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const readFile = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    setPreview(buildImportPreview(text, existingNames));
  };

  const reset = () => {
    setPreview(null);
    setFileName("");
  };

  const confirm = () => {
    if (!preview) return;
    onImport(
      preview.rows
        .map((r) => r.company)
        .filter((c): c is Company => c !== null),
    );
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Import companies</DialogTitle>
          <DialogDescription>
            Use the sample file so the headers and formats match exactly.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1 — always visible */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/40 bg-accent/[0.05] p-3">
          <FileSpreadsheet className="size-5 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">
              Step 1 — download the sample
            </div>
            <div className="text-xs text-muted-foreground">
              13 columns, 5 example rows. Replace the rows with your data.
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={downloadSample}>
            <Download />
            Sample CSV
          </Button>
        </div>

        {!preview ? (
          /* Step 2 — drop zone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void readFile(file);
            }}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors",
              dragging
                ? "border-accent bg-accent/[0.06]"
                : "border-border hover:border-accent/40",
            )}
          >
            <Upload className="size-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">
              Step 2 — drop your CSV here
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              or choose a file from your computer
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void readFile(file);
              }}
            />
          </div>
        ) : preview.headerError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="size-4" />
              Wrong file format
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {preview.headerError}
            </p>
            <Button size="sm" variant="outline" className="mt-3" onClick={reset}>
              Try another file
            </Button>
          </div>
        ) : (
          /* Step 3 — preview before committing */
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium">{fileName}</span>
              <Badge variant="success" className="gap-1">
                <CheckCircle2 />
                {preview.validCount} ready
              </Badge>
              {preview.errorCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle />
                  {preview.errorCount} with errors
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={reset}
              >
                Change file
              </Button>
            </div>

            <ul className="max-h-[320px] space-y-1.5 overflow-y-auto scrollbar-thin">
              {preview.rows.map((row) => (
                <li
                  key={row.rowNumber}
                  className={cn(
                    "rounded-lg border p-2.5 text-sm",
                    row.issues.length
                      ? "border-destructive/40 bg-destructive/[0.05]"
                      : "border-border",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 w-8 shrink-0 text-[10px] font-mono text-muted-foreground">
                      #{row.rowNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {row.raw["Property Name"] || (
                          <span className="text-muted-foreground">
                            (no name)
                          </span>
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {row.raw["Business"]} · {row.raw["Location / Area"]},{" "}
                        {row.raw["Emirate"]}
                      </div>
                      {row.issues.map((issue, i) => (
                        <div
                          key={i}
                          className="mt-1 text-xs font-medium text-destructive"
                        >
                          {issue.field}: {issue.message}
                        </div>
                      ))}
                    </div>
                    {row.issues.length === 0 ? (
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                    ) : (
                      <AlertTriangle className="size-4 shrink-0 text-destructive" />
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {preview.errorCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Rows with errors are skipped. Fix them in the file and re-upload
                to bring them in.
              </p>
            )}
          </div>
        )}

        {preview && !preview.headerError && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={preview.validCount === 0}>
              Import {preview.validCount}{" "}
              {preview.validCount === 1 ? "company" : "companies"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
