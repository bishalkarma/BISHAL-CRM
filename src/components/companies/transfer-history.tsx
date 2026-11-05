"use client";

import * as React from "react";
import { ArrowRightLeft, Clock } from "lucide-react";
import { relativeTime } from "@/lib/utils";

export type TransferHistoryEntry = {
  id: string;
  customer_id: string;
  from_owner_id: string;
  to_owner_id: string;
  transferred_by: string;
  transferred_at: string;
  reason?: string;
  from_owner_name?: string;
  to_owner_name?: string;
};

type TransferHistoryProps = {
  customerId: string;
  entries?: TransferHistoryEntry[];
  loading?: boolean;
  showEmpty?: boolean;
  compact?: boolean;
};

export function TransferHistory({
  customerId,
  entries,
  loading: controlledLoading,
  showEmpty = false,
  compact = false,
}: TransferHistoryProps) {
  const [internalTransfers, setInternalTransfers] = React.useState<
    TransferHistoryEntry[]
  >([]);
  const [internalLoading, setInternalLoading] = React.useState(
    entries === undefined,
  );

  React.useEffect(() => {
    if (entries !== undefined) return;
    let cancelled = false;
    setInternalLoading(true);

    const fetchTransfers = async () => {
      try {
        const res = await fetch(
          `/api/transfer-history?customer_id=${encodeURIComponent(customerId)}`,
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) {
          setInternalTransfers(data.transfers || []);
        }
      } catch (err) {
        console.error("Failed to fetch transfer history:", err);
      } finally {
        if (!cancelled) {
          setInternalLoading(false);
        }
      }
    };

    fetchTransfers();
    return () => {
      cancelled = true;
    };
  }, [customerId, entries]);

  const transfers = entries ?? internalTransfers;
  const loading =
    controlledLoading !== undefined ? controlledLoading : internalLoading;

  if (loading) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
          <Clock className="size-3.5 animate-spin" />
          Loading transfer history...
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 animate-spin" />
          Loading transfer history...
        </div>
      </div>
    );
  }

  if (transfers.length === 0) {
    if (!showEmpty) return null;
    return (
      <div>
        <div className="flex items-center gap-1.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          <ArrowRightLeft className="size-3.5" />
          Owner transfer history
        </div>
        <p className="text-xs text-muted-foreground">
          No ownership transfers recorded yet.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div>
        <div className="flex items-center gap-1.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          <ArrowRightLeft className="size-3.5" />
          Owner transfer history · {transfers.length}
        </div>
        <div className="space-y-2">
          {transfers.map((transfer) => (
            <div
              key={transfer.id}
              className="rounded-lg border border-border bg-secondary/40 p-2.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {transfer.from_owner_name || "Previous Owner"} →{" "}
                  {transfer.to_owner_name || "New Owner"}
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {relativeTime(transfer.transferred_at)}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                By {transfer.transferred_by || "Admin"}
                {transfer.reason ? ` · ${transfer.reason}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <ArrowRightLeft className="h-4 w-4" />
        Transfer History
      </h3>
      <div className="space-y-2">
        {transfers.map((transfer) => (
          <div
            key={transfer.id}
            className="rounded-md border border-border bg-secondary/50 p-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {relativeTime(transfer.transferred_at)}
              </span>
              <span className="text-muted-foreground">
                by {transfer.transferred_by || "Admin"}
              </span>
            </div>
            <div className="mt-1 text-muted-foreground">
              Transferred from {transfer.from_owner_name || "Previous Owner"} to{" "}
              {transfer.to_owner_name || "New Owner"}
            </div>
            {transfer.reason && (
              <div className="mt-1 italic text-muted-foreground">
                Reason: {transfer.reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
