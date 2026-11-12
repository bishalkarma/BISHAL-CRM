"use client";

import * as React from "react";
import {
  CalendarClock,
  Check,
  Package,
  PackageCheck,
  RotateCcw,
} from "lucide-react";
import { UNITS, type LineItem, type SampleReturnStatus, type Unit } from "@/lib/deal-model";
import {
  SAMPLE_FOLLOWUP_DAYS,
  dateInputToIso,
  defaultSampleFollowUpDateInput,
  defaultSampleQtyForLine,
  effectiveSampleReturnStatus,
  formatSampleDate,
  sampleDaysWithCustomer,
  toDateInputValue,
  type CustomerSample,
  type SampleLedgerEntry,
} from "@/lib/samples";
import type { Deal } from "@/lib/deals";
import { useData } from "@/components/providers/data-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* ================================================================== */
/* Shared Custody Days Pill                                           */
/* ================================================================== */

export function SampleDaysBadge({
  entry,
  compact = false,
}: {
  entry: Pick<SampleLedgerEntry, "daysWithCustomer" | "returnStatus" | "tone">;
  compact?: boolean;
}) {
  if (entry.returnStatus === "returned") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-success/35 bg-success/12 font-semibold tabular-nums text-success",
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]",
        )}
      >
        <Check className="size-3" />
        Held {entry.daysWithCustomer} {entry.daysWithCustomer === 1 ? "day" : "days"}
      </span>
    );
  }

  if (entry.returnStatus === "consumable") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-border bg-secondary/70 font-medium text-muted-foreground",
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]",
        )}
      >
        Consumable / Kept
      </span>
    );
  }

  const d = entry.daysWithCustomer;
  const label =
    d === 0
      ? "Given today"
      : compact
        ? `${d}d out${entry.tone === "out-overdue" ? " !" : ""}`
        : `${d} ${d === 1 ? "day" : "days"} out${entry.tone === "out-overdue" ? " !" : ""}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold tabular-nums",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]",
        entry.tone === "out-overdue"
          ? "border-destructive/50 bg-destructive/15 text-destructive"
          : entry.tone === "out-followup"
            ? "border-warning/50 bg-warning/15 text-warning"
            : "border-accent/40 bg-accent/12 text-accent",
      )}
    >
      {label}
    </span>
  );
}

/* ================================================================== */
/* Popup 1: Give / Edit Sample Handover Dialog                        */
/* ================================================================== */

export type GiveSampleDialogTarget =
  | {
      mode: "deal-line";
      deal: Deal;
      line: LineItem;
    }
  | {
      mode: "company";
      companyId: string;
    }
  | {
      mode: "global";
      defaultCompanyId?: string;
    }
  | {
      mode: "edit";
      entry: SampleLedgerEntry;
    };

export function GiveSampleDialog({
  target,
  onOpenChange,
}: {
  target: GiveSampleDialogTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    companies,
    contacts,
    deals,
    updateDeal,
    addCustomerSample,
    updateCustomerSample,
    addActivity,
  } = useData();

  const [companySearch, setCompanySearch] = React.useState("");
  const [companyId, setCompanyId] = React.useState("");
  const [linkMode, setLinkMode] = React.useState<"standalone" | "deal">(
    "standalone",
  );
  const [selectedDealId, setSelectedDealId] = React.useState("");
  const [selectedLineId, setSelectedLineId] = React.useState("");

  const [product, setProduct] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [sampleQty, setSampleQty] = React.useState("1");
  const [unit, setUnit] = React.useState<Unit>("Pcs");
  const [sentDate, setSentDate] = React.useState(() => toDateInputValue());
  const [recipient, setRecipient] = React.useState("");
  const [contactId, setContactId] = React.useState<string | null>(null);
  const [returnStatus, setReturnStatus] =
    React.useState<SampleReturnStatus>("out");
  const [handoverNote, setHandoverNote] = React.useState("");
  const [createFollowUp, setCreateFollowUp] = React.useState(true);
  const [followUpDate, setFollowUpDate] = React.useState(() =>
    defaultSampleFollowUpDateInput(toDateInputValue()),
  );
  const [formError, setFormError] = React.useState<string | null>(null);

  // Initialize form whenever dialog opens on a new target
  React.useEffect(() => {
    if (!target) return;
    setFormError(null);
    setCompanySearch("");

    const todayStr = toDateInputValue();

    if (target.mode === "deal-line") {
      const { deal, line } = target;
      const existing = line.sample;
      const company = companies.find((c) => c.id === deal.companyId);
      const dealContact =
        contacts.find((c) => c.id === deal.currentContactId) ??
        contacts.find((c) => c.id === deal.enquiryFromId) ??
        contacts.find((c) => c.companyId === deal.companyId && c.isPrimary);
      const defaultRecipient = dealContact
        ? `${dealContact.name}${dealContact.role ? ` · ${dealContact.role}` : ""}`
        : company?.contactName
          ? `${company.contactName}${company.contactRole ? ` · ${company.contactRole}` : ""}`
          : "";

      const initSent = existing?.sentAt
        ? toDateInputValue(existing.sentAt)
        : todayStr;
      setCompanyId(deal.companyId);
      setLinkMode("deal");
      setSelectedDealId(deal.id);
      setSelectedLineId(line.id);
      setProduct(line.product);
      setBrand(line.brand);
      setSampleQty(String(defaultSampleQtyForLine(line)));
      setUnit(line.unit);
      setSentDate(initSent);
      setRecipient(existing?.recipient ?? defaultRecipient);
      setContactId(dealContact?.id ?? null);
      setReturnStatus(
        effectiveSampleReturnStatus(
          existing?.returnStatus,
          existing?.returnedAt,
        ) === "consumable"
          ? "consumable"
          : "out",
      );
      setHandoverNote(existing?.handoverNote ?? "");
      setCreateFollowUp(!existing?.followUpActivityId);
      setFollowUpDate(defaultSampleFollowUpDateInput(initSent));
      return;
    }

    if (target.mode === "edit") {
      const { entry } = target;
      const initSent = toDateInputValue(entry.sentAt);
      setCompanyId(entry.companyId);
      setLinkMode(entry.source === "deal" ? "deal" : "standalone");
      setSelectedDealId(entry.dealId ?? "");
      setSelectedLineId(entry.lineId ?? "");
      setProduct(entry.product);
      setBrand(entry.brand);
      setSampleQty(String(entry.sampleQty));
      setUnit(entry.unit);
      setSentDate(initSent);
      setRecipient(entry.recipientLabel);
      setContactId(entry.contactId);
      setReturnStatus(
        entry.returnStatus === "consumable" ? "consumable" : entry.returnStatus,
      );
      setHandoverNote(entry.handoverNote);
      setCreateFollowUp(false);
      setFollowUpDate(defaultSampleFollowUpDateInput(initSent));
      return;
    }

    const initCompanyId =
      target.mode === "company"
        ? target.companyId
        : target.defaultCompanyId ?? companies[0]?.id ?? "";
    const company = companies.find((c) => c.id === initCompanyId);
    const primaryContact =
      contacts.find((c) => c.companyId === initCompanyId && c.isPrimary) ??
      contacts.find((c) => c.companyId === initCompanyId);
    const defaultRecipient = primaryContact
      ? `${primaryContact.name}${primaryContact.role ? ` · ${primaryContact.role}` : ""}`
      : company?.contactName
        ? `${company.contactName}${company.contactRole ? ` · ${company.contactRole}` : ""}`
        : "";

    setCompanyId(initCompanyId);
    setLinkMode("standalone");
    setSelectedDealId("");
    setSelectedLineId("");
    setProduct("");
    setBrand("");
    setSampleQty("1");
    setUnit("Pcs");
    setSentDate(todayStr);
    setRecipient(defaultRecipient);
    setContactId(primaryContact?.id ?? null);
    setReturnStatus("out");
    setHandoverNote("");
    setCreateFollowUp(true);
    setFollowUpDate(defaultSampleFollowUpDateInput(todayStr));
  }, [target, companies, contacts]);

  const selectedCompany = React.useMemo(
    () => companies.find((c) => c.id === companyId) ?? null,
    [companies, companyId],
  );

  const companyContacts = React.useMemo(
    () => contacts.filter((c) => c.companyId === companyId),
    [contacts, companyId],
  );

  const companyDeals = React.useMemo(
    () => deals.filter((d) => d.companyId === companyId),
    [deals, companyId],
  );

  const chosenDeal = React.useMemo(
    () => companyDeals.find((d) => d.id === selectedDealId) ?? null,
    [companyDeals, selectedDealId],
  );

  const filteredCompanies = React.useMemo(() => {
    const q = companySearch.trim().toLowerCase();
    if (!q) return companies.slice(0, 60);
    return companies
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.area.toLowerCase().includes(q) ||
          c.contactName.toLowerCase().includes(q),
      )
      .slice(0, 60);
  }, [companies, companySearch]);

  const handleSelectCompany = (nextId: string) => {
    setCompanyId(nextId);
    setSelectedDealId("");
    setSelectedLineId("");
    const comp = companies.find((c) => c.id === nextId);
    const primary =
      contacts.find((c) => c.companyId === nextId && c.isPrimary) ??
      contacts.find((c) => c.companyId === nextId);
    setContactId(primary?.id ?? null);
    setRecipient(
      primary
        ? `${primary.name}${primary.role ? ` · ${primary.role}` : ""}`
        : comp?.contactName
          ? `${comp.contactName}${comp.contactRole ? ` · ${comp.contactRole}` : ""}`
          : "",
    );
  };

  const handleSentDateChange = (nextDate: string) => {
    setSentDate(nextDate);
    if (createFollowUp) {
      setFollowUpDate(defaultSampleFollowUpDateInput(nextDate));
    }
  };

  const handleSave = () => {
    if (!target) return;
    if (!companyId) {
      setFormError("Please select a customer.");
      return;
    }

    const qtyNum = Number(sampleQty);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      setFormError("Sample quantity must be greater than zero.");
      return;
    }

    const sentIso = dateInputToIso(sentDate);
    const nowIso = new Date().toISOString();
    const isConsumable = returnStatus === "consumable";

    // Helper to create optional follow-up activity so pickup is never missed
    const maybeCreateFollowUpActivity = (
      itemName: string,
      itemUnit: Unit,
      dealIdForTask: string | null,
      ownerName: string,
    ): string | null => {
      if (isConsumable || !createFollowUp) return null;
      const actId = `AC-SMP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const dueIso = dateInputToIso(followUpDate);
      const cleanRecipient = recipient.trim();
      const noteText = handoverNote.trim();
      addActivity({
        id: actId,
        companyId,
        contactId,
        dealId: dealIdForTask,
        type: "demo",
        report: `Sample given: ${itemName} (${qtyNum} ${itemUnit})${cleanRecipient ? ` handed to ${cleanRecipient}` : ""}.${noteText ? ` Note: ${noteText}` : ""}`,
        occurredAt: sentIso,
        task: `Follow up & collect sample: ${itemName} (${qtyNum} ${itemUnit})`,
        taskDueAt: dueIso,
        taskDone: false,
        remind: true,
        owner: ownerName || selectedCompany?.owner || "Bishal Karma",
        createdAt: nowIso,
      });
      return actId;
    };

    // Case 1: Editing an existing ledger entry
    if (target.mode === "edit") {
      const { entry } = target;
      if (entry.source === "deal" && entry.dealId && entry.lineId) {
        const deal = deals.find((d) => d.id === entry.dealId);
        if (!deal) return;
        const followUpId =
          maybeCreateFollowUpActivity(
            entry.product,
            entry.unit,
            deal.id,
            deal.owner,
          ) ?? entry.followUpActivityId;
        updateDeal(deal.id, {
          lines: deal.lines.map((l) =>
            l.id === entry.lineId
              ? {
                  ...l,
                  sample: {
                    sentAt: sentIso,
                    feedbackAt: l.sample?.feedbackAt ?? null,
                    feedback: l.sample?.feedback ?? null,
                    sampleQty: qtyNum,
                    returnedAt:
                      returnStatus === "consumable"
                        ? null
                        : l.sample?.returnedAt ?? null,
                    returnStatus:
                      returnStatus === "consumable"
                        ? "consumable"
                        : l.sample?.returnedAt
                          ? "returned"
                          : "out",
                    recipient: recipient.trim() || null,
                    handoverNote: handoverNote.trim() || null,
                    returnNote: l.sample?.returnNote ?? null,
                    followUpActivityId: followUpId,
                  },
                }
              : l,
          ),
        });
      } else if (entry.source === "standalone" && entry.standaloneId) {
        if (!product.trim()) {
          setFormError("Please enter the sample product name.");
          return;
        }
        const followUpId =
          maybeCreateFollowUpActivity(
            product.trim(),
            unit,
            null,
            entry.owner,
          ) ?? entry.followUpActivityId;
        updateCustomerSample(entry.standaloneId, {
          product: product.trim(),
          brand: brand.trim(),
          sampleQty: qtyNum,
          unit,
          sentAt: sentIso,
          contactId,
          recipientName: recipient.trim(),
          returnStatus:
            returnStatus === "consumable"
              ? "consumable"
              : entry.returnedAt
                ? "returned"
                : "out",
          handoverNote: handoverNote.trim(),
          followUpActivityId: followUpId,
        });
      }
      onOpenChange(false);
      return;
    }

    // Case 2: Recording sample on a Deal line item
    if (target.mode === "deal-line" || (linkMode === "deal" && selectedDealId && selectedLineId)) {
      const targetDeal =
        target.mode === "deal-line"
          ? target.deal
          : deals.find((d) => d.id === selectedDealId);
      const targetLine =
        target.mode === "deal-line"
          ? target.line
          : targetDeal?.lines.find((l) => l.id === selectedLineId);

      if (!targetDeal || !targetLine) {
        setFormError("Please select which deal product line was given.");
        return;
      }

      const followUpId =
        maybeCreateFollowUpActivity(
          targetLine.product,
          targetLine.unit,
          targetDeal.id,
          targetDeal.owner,
        ) ?? targetLine.sample?.followUpActivityId ?? null;

      updateDeal(targetDeal.id, {
        lastActivityAt: nowIso,
        lines: targetDeal.lines.map((l) =>
          l.id === targetLine.id
            ? {
                ...l,
                sample: {
                  sentAt: sentIso,
                  feedbackAt: l.sample?.feedbackAt ?? null,
                  feedback: l.sample?.feedback ?? null,
                  sampleQty: qtyNum,
                  returnedAt: null,
                  returnStatus: isConsumable ? "consumable" : "out",
                  recipient: recipient.trim() || null,
                  handoverNote: handoverNote.trim() || null,
                  returnNote: l.sample?.returnNote ?? null,
                  followUpActivityId: followUpId,
                },
              }
            : l,
        ),
      });
      onOpenChange(false);
      return;
    }

    // Case 3: Standalone Customer sample (without a Deal)
    if (!product.trim()) {
      setFormError("Please enter the sample item / product name.");
      return;
    }

    const followUpId = maybeCreateFollowUpActivity(
      product.trim(),
      unit,
      null,
      selectedCompany?.owner ?? "Bishal Karma",
    );

    const newSample: CustomerSample = {
      id: `SM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      companyId,
      contactId,
      product: product.trim(),
      brand: brand.trim(),
      sampleQty: qtyNum,
      unit,
      sentAt: sentIso,
      returnedAt: null,
      returnStatus: isConsumable ? "consumable" : "out",
      verdict: "pending",
      recipientName: recipient.trim(),
      handoverNote: handoverNote.trim(),
      returnNote: "",
      followUpActivityId: followUpId,
      owner: selectedCompany?.owner ?? "Bishal Karma",
      owner_id: selectedCompany?.owner_id ?? null,
      created_by: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    addCustomerSample(newSample);
    onOpenChange(false);
  };

  const isLockedDealLine =
    target?.mode === "deal-line" ||
    (target?.mode === "edit" && target.entry.source === "deal");
  const isEditing = target?.mode === "edit";

  return (
    <Dialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto p-5">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Package className="size-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-base">
                {isEditing ? "Edit Sample Record" : "Record Sample Handover"}
              </DialogTitle>
              <DialogDescription className="truncate text-xs">
                {target?.mode === "deal-line"
                  ? `${target.line.product} · ${target.deal.company}`
                  : selectedCompany
                    ? `${selectedCompany.name} · ${selectedCompany.area}`
                    : "Record when a sample was given, to whom, and schedule pickup follow-up"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5">
          {/* Customer selector when opened globally from Samples Register */}
          {target?.mode === "global" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Customer / Hotel *
              </label>
              <Input
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Type to filter customers..."
                className="h-8 text-xs"
              />
              <select
                value={companyId}
                onChange={(e) => handleSelectCompany(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                <option value="">Select customer...</option>
                {filteredCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.area}, {c.emirate})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Standalone vs Linked Deal toggle when opened from Customer or Samples Register */}
          {(target?.mode === "company" || target?.mode === "global") &&
            companyDeals.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Sample linked to
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLinkMode("standalone")}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors",
                      linkMode === "standalone"
                        ? "border-accent bg-accent/12 text-accent"
                        : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Standalone (without deal)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkMode("deal");
                      const firstDeal = companyDeals[0];
                      if (firstDeal) {
                        setSelectedDealId(firstDeal.id);
                        setSelectedLineId(firstDeal.lines[0]?.id ?? "");
                      }
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors",
                      linkMode === "deal"
                        ? "border-accent bg-accent/12 text-accent"
                        : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Existing Deal ({companyDeals.length})
                  </button>
                </div>

                {linkMode === "deal" && (
                  <div className="grid gap-2 pt-1 sm:grid-cols-2">
                    <select
                      value={selectedDealId}
                      onChange={(e) => {
                        const dId = e.target.value;
                        setSelectedDealId(dId);
                        const d = companyDeals.find((item) => item.id === dId);
                        setSelectedLineId(d?.lines[0]?.id ?? "");
                      }}
                      className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-2.5 text-xs text-foreground"
                    >
                      {companyDeals.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.id} · {d.title}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedLineId}
                      onChange={(e) => {
                        const lId = e.target.value;
                        setSelectedLineId(lId);
                        const ln = chosenDeal?.lines.find((l) => l.id === lId);
                        if (ln) {
                          setSampleQty(String(defaultSampleQtyForLine(ln)));
                          setUnit(ln.unit);
                        }
                      }}
                      className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-2.5 text-xs text-foreground"
                    >
                      {(chosenDeal?.lines ?? []).map((ln) => (
                        <option key={ln.id} value={ln.id}>
                          {ln.product} ({ln.quantity} {ln.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

          {/* Product & Brand fields when recording/editing a Standalone Customer sample */}
          {!isLockedDealLine && linkMode === "standalone" && (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Sample item / product *
                </label>
                <Input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. Electric Kettle 1.0L"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Brand / model
                </label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Aolga / Pasabahce"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          )}

          {/* Row 1: Given Date + Sample Qty */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Given date *
              </label>
              <Input
                type="date"
                value={sentDate}
                onChange={(e) => handleSentDateChange(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Sample qty given *
              </label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  min="0.1"
                  step="any"
                  value={sampleQty}
                  onChange={(e) => setSampleQty(e.target.value)}
                  className="h-9 flex-1 text-sm tabular-nums"
                />
                {!isLockedDealLine && linkMode === "standalone" ? (
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as Unit)}
                    className="h-9 rounded-lg border border-border bg-secondary/40 px-2 text-xs text-foreground"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="inline-flex h-9 items-center rounded-lg border border-border bg-secondary/40 px-2.5 text-xs font-medium text-muted-foreground">
                    {unit}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Handed To + Need to Take Back? */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Handed to (Customer contact)
              </label>
              <Input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Taiwo · Storekeeper"
                className="h-9 text-sm"
              />
              {companyContacts.length > 1 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {companyContacts.slice(0, 3).map((c) => {
                    const label = `${c.name}${c.role ? ` · ${c.role}` : ""}`;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setContactId(c.id);
                          setRecipient(label);
                        }}
                        className="rounded-md border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:border-accent/40 hover:text-foreground"
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Need to take back?
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setReturnStatus("out");
                    if (!isEditing) setCreateFollowUp(true);
                  }}
                  className={cn(
                    "flex h-9 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-semibold transition-colors",
                    returnStatus !== "consumable"
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <RotateCcw className="size-3" />
                  Returnable
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReturnStatus("consumable");
                    setCreateFollowUp(false);
                  }}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-colors",
                    returnStatus === "consumable"
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground",
                  )}
                >
                  Consumable
                </button>
              </div>
            </div>
          </div>

          {/* Handover Note */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Handover note (optional)
            </label>
            <Input
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              placeholder="e.g. Left 1 unit w/ box for housekeeping & GM approval"
              className="h-9 text-sm"
            />
          </div>

          {/* Automatic Follow-up Task Guard (Option A Q3) */}
          {returnStatus !== "consumable" && (
            <div className="rounded-xl border border-accent/35 bg-accent/[0.06] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={createFollowUp}
                    onChange={(e) => setCreateFollowUp(e.target.checked)}
                    className="size-4 rounded border-border accent-blue-500"
                  />
                  <CalendarClock className="size-3.5 text-accent" />
                  <span>Schedule follow-up task so sample isn&apos;t missed</span>
                </label>
                {createFollowUp && (
                  <Input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="h-8 w-[148px] text-xs"
                  />
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Defaults to +{SAMPLE_FOLLOWUP_DAYS} days (Amber alert at{" "}
                {SAMPLE_FOLLOWUP_DAYS}d · Red overdue alert at 14d+). Appears in
                Open Tasks &amp; Customer Follow-up automatically.
              </p>
            </div>
          )}

          {formError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {formError}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            <Check className="size-3.5" />
            {isEditing ? "Save Changes" : "Save Sample Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/* Popup 2: Mark Sample Taken Back Dialog                             */
/* ================================================================== */

export function TakeBackSampleDialog({
  entry,
  onOpenChange,
}: {
  entry: SampleLedgerEntry | null;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    deals,
    updateDeal,
    updateCustomerSample,
    addActivity,
    updateActivity,
  } = useData();

  const [returnedDate, setReturnedDate] = React.useState(() =>
    toDateInputValue(),
  );
  const [returnNote, setReturnNote] = React.useState("");
  const [logToJournal, setLogToJournal] = React.useState(true);

  React.useEffect(() => {
    if (!entry) return;
    setReturnedDate(
      entry.returnedAt ? toDateInputValue(entry.returnedAt) : toDateInputValue(),
    );
    setReturnNote(entry.returnNote ?? "");
    setLogToJournal(true);
  }, [entry]);

  if (!entry) return null;

  const returnedIsoPreview = dateInputToIso(returnedDate);
  const heldDays = sampleDaysWithCustomer(entry.sentAt, returnedIsoPreview);

  const handleConfirmReturn = () => {
    const returnedIso = dateInputToIso(returnedDate);
    const nowIso = new Date().toISOString();
    const noteClean = returnNote.trim();

    if (entry.source === "deal" && entry.dealId && entry.lineId) {
      const deal = deals.find((d) => d.id === entry.dealId);
      if (deal) {
        updateDeal(deal.id, {
          lastActivityAt: nowIso,
          lines: deal.lines.map((l) =>
            l.id === entry.lineId && l.sample
              ? {
                  ...l,
                  sample: {
                    ...l.sample,
                    returnedAt: returnedIso,
                    returnStatus: "returned",
                    returnNote: noteClean || null,
                  },
                }
              : l,
          ),
        });
      }
    } else if (entry.source === "standalone" && entry.standaloneId) {
      updateCustomerSample(entry.standaloneId, {
        returnedAt: returnedIso,
        returnStatus: "returned",
        returnNote: noteClean,
      });
    }

    // Close linked open pickup follow-up task so customer doesn't keep showing an overdue sample reminder
    if (entry.followUpTask && !entry.followUpTask.taskDone) {
      updateActivity(entry.followUpTask.id, { taskDone: true });
    }

    if (logToJournal) {
      addActivity({
        id: `AC-RET-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        companyId: entry.companyId,
        contactId: entry.contactId,
        dealId: entry.dealId,
        type: "demo",
        report: `Sample taken back: ${entry.product} (${entry.sampleQty} ${entry.unit}) collected after ${heldDays} ${heldDays === 1 ? "day" : "days"} with customer.${noteClean ? ` Condition / note: ${noteClean}` : ""}`,
        occurredAt: returnedIso,
        task: null,
        taskDueAt: null,
        taskDone: false,
        remind: false,
        owner: entry.owner || "Bishal Karma",
        createdAt: nowIso,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(entry)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md p-5">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
              <PackageCheck className="size-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-base">
                Record Sample Taken Back
              </DialogTitle>
              <DialogDescription className="truncate text-xs">
                {entry.product} ({entry.sampleQty} {entry.unit}) ·{" "}
                {entry.companyName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5">
          {/* Summary Banner: Given -> Taken back -> Held X days */}
          <div className="space-y-2.5 rounded-xl border border-success/40 bg-success/[0.07] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Given on: </span>
                <strong className="font-semibold text-foreground">
                  {formatSampleDate(entry.sentAt)}
                </strong>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2.5 py-0.5 text-xs font-bold tabular-nums text-success">
                Held: {heldDays} {heldDays === 1 ? "day" : "days"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-foreground">
                Taken back on *
              </label>
              <Input
                type="date"
                value={returnedDate}
                onChange={(e) => setReturnedDate(e.target.value)}
                className="h-8 w-[160px] text-xs font-medium"
              />
            </div>

            <p className="text-[11px] text-muted-foreground">
              Automatically calculates &amp; freezes total days this sample
              stayed with the customer.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Return condition / pickup note (optional)
            </label>
            <Input
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="e.g. Collected back in good condition with box"
              className="h-9 text-sm"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={logToJournal}
              onChange={(e) => setLogToJournal(e.target.checked)}
              className="mt-0.5 size-4 rounded border-border accent-emerald-500"
            />
            <span>
              Also record{" "}
              <strong className="font-semibold">
                &ldquo;Sample collected back&rdquo;
              </strong>{" "}
              in Customer Activities timeline
              {entry.followUpTask && !entry.followUpTask.taskDone
                ? " & mark open pickup task Done"
                : ""}
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-success text-success-foreground hover:bg-success/90"
            onClick={handleConfirmReturn}
          >
            <Check className="size-3.5" />
            Confirm Returned
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/* Quick 1-Tap Follow-Up Scheduler for Unscheduled Samples            */
/* ================================================================== */

export function ScheduleSampleFollowUpDialog({
  entry,
  onOpenChange,
}: {
  entry: SampleLedgerEntry | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { deals, updateDeal, updateCustomerSample, addActivity } = useData();
  const [dueDate, setDueDate] = React.useState(() => toDateInputValue());
  const [taskText, setTaskText] = React.useState("");

  React.useEffect(() => {
    if (!entry) return;
    // If already 7+ days out, default follow-up to tomorrow; otherwise +7d from sentAt
    const defaultDue =
      entry.daysWithCustomer >= SAMPLE_FOLLOWUP_DAYS
        ? toDateInputValue(new Date(Date.now() + 86_400_000).toISOString())
        : defaultSampleFollowUpDateInput(toDateInputValue(entry.sentAt));
    setDueDate(defaultDue);
    setTaskText(
      `Follow up & collect sample: ${entry.product} (${entry.sampleQty} ${entry.unit})`,
    );
  }, [entry]);

  if (!entry) return null;

  const handleSave = () => {
    const cleanTask =
      taskText.trim() ||
      `Follow up & collect sample: ${entry.product} (${entry.sampleQty} ${entry.unit})`;
    const actId = `AC-SMPFU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();

    addActivity({
      id: actId,
      companyId: entry.companyId,
      contactId: entry.contactId,
      dealId: entry.dealId,
      type: "demo",
      report: `Scheduled pickup / feedback follow-up for sample ${entry.product} (${entry.sampleQty} ${entry.unit}, given ${formatSampleDate(entry.sentAt)}).`,
      occurredAt: nowIso,
      task: cleanTask,
      taskDueAt: dateInputToIso(dueDate),
      taskDone: false,
      remind: true,
      owner: entry.owner || "Bishal Karma",
      createdAt: nowIso,
    });

    if (entry.source === "deal" && entry.dealId && entry.lineId) {
      const deal = deals.find((d) => d.id === entry.dealId);
      if (deal) {
        updateDeal(deal.id, {
          lines: deal.lines.map((l) =>
            l.id === entry.lineId && l.sample
              ? {
                  ...l,
                  sample: {
                    ...l.sample,
                    followUpActivityId: actId,
                  },
                }
              : l,
          ),
        });
      }
    } else if (entry.source === "standalone" && entry.standaloneId) {
      updateCustomerSample(entry.standaloneId, {
        followUpActivityId: actId,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(entry)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md p-5">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base">
            Schedule Sample Follow-Up Task
          </DialogTitle>
          <DialogDescription className="text-xs">
            {entry.product} · {entry.companyName} ({entry.daysWithCustomer}d
            with client)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Follow-up task *
            </label>
            <Input
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Follow-up due date *
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave}>
            <CalendarClock className="size-3.5" />
            Save Follow-Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
