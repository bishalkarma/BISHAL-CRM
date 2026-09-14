"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PopupPanel({
  title,
  accent,
  children,
  onClose,
  className,
}: {
  title: string;
  accent?: "blue" | "accent" | "success" | "warning";
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const accentColor =
    accent === "blue"
      ? "bg-blue-500"
      : accent === "success"
        ? "bg-success"
        : accent === "warning"
          ? "bg-warning"
          : "bg-accent";

  return (
    <>
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel - centered */}
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-5xl min-h-[420px] max-h-[70vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl",
          className,
        )}
      >
        <div className="flex items-start gap-2.5 border-b border-border p-4">
          <div className={cn("mt-1.5 h-5 w-1 shrink-0 rounded-full", accentColor)} />
          <h3 className="flex-1 text-sm font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </>
  );
}
