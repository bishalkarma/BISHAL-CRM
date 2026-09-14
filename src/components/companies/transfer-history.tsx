"use client";

import * as React from "react";
import { ArrowRightLeft, Clock } from "lucide-react";
import { relativeTime } from "@/lib/utils";

type TransferHistoryEntry = {
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
};

export function TransferHistory({ customerId }: TransferHistoryProps) {
  const [transfers, setTransfers] = React.useState<TransferHistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchTransfers();
  }, [customerId]);

  const fetchTransfers = async () => {
    try {
      const res = await fetch(`/api/transfer-history?customer_id=${customerId}`);
      if (!res.ok) return;
      const data = await res.json();
      setTransfers(data.transfers || []);
    } catch (err) {
      console.error("Failed to fetch transfer history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
    return null;
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
