"use client";

import * as React from "react";
import { ArrowLeft, Building2, CheckCircle2, PartyPopper } from "lucide-react";
import type { Company } from "@/lib/companies";
import { useData } from "@/components/providers/data-provider";
import { DEAL_CATEGORIES, dealValue, type LineItem,
  EMPTY_FULFILMENT,
} from "@/lib/deal-model";
import type { Deal, DealPriority } from "@/lib/deals";
import { DEAL_OWNERS } from "@/lib/deals";
import { LineItemsEditor } from "./line-items-editor";
import { CompanyPicker } from "./company-picker";
import { ClusterCombobox } from "@/components/companies/cluster-combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const emptyLine = (): LineItem => ({
  id: `L-new-${Date.now()}`,
  product: "",
  brand: "",
  quantity: 1,
  unit: "Pcs",
  unitPrice: 0,
  status: "quoted",
});

export function NewDealDialog({
  open,
  onOpenChange,
  onCreate,
  onCreateCompany,
  preselectedCompany,
  justCreatedCompany,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (deal: Deal) => void;
  onCreateCompany: (prefillName: string) => void;
  /** Set when returning from the create-customer detour. */
  preselectedCompany?: Company | null;
  justCreatedCompany?: boolean;
}) {
  const { contactsFor, primaryFor } = useData();
  const [company, setCompany] = React.useState<Company | null>(null);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [categories, setCategories] = React.useState<string[]>([
    ...DEAL_CATEGORIES,
  ]);
  const [enquiryFromId, setEnquiryFromId] = React.useState("");
  const [reqDate, setReqDate] = React.useState("");
  const [owner, setOwner] = React.useState<string>(DEAL_OWNERS[0]);
  const [priority, setPriority] = React.useState<DealPriority>("medium");
  const [lines, setLines] = React.useState<LineItem[]>([emptyLine()]);
  const [touched, setTouched] = React.useState(false);

  // Coming back from creating a customer: jump straight to step 2.
  React.useEffect(() => {
    if (preselectedCompany) {
      setCompany(preselectedCompany);
      setEnquiryFromId(primaryFor(preselectedCompany.id)?.id ?? "");
    }
  }, [preselectedCompany, primaryFor]);

  const contacts = company ? contactsFor(company.id) : [];

  const chooseCompany = (c: Company) => {
    setCompany(c);
    setEnquiryFromId(primaryFor(c.id)?.id ?? "");
  };

  const reset = () => {
    setCompany(null);
    setTitle("");
    setCategory("");
    setEnquiryFromId("");
    setReqDate("");
    setPriority("medium");
    setLines([emptyLine()]);
    setTouched(false);
  };

  const validLines = lines.filter((l) => l.product.trim() && l.quantity > 0);
  const valid = Boolean(
    company &&
      title.trim() &&
      category &&
      enquiryFromId &&
      validLines.length > 0,
  );

  const submit = () => {
    setTouched(true);
    if (!valid || !company) return;
    const now = new Date().toISOString();
    const cleaned = validLines;
    onCreate({
      id: `D-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      category,
      company: company.name,
      companyId: company.id,
      accountType: "Hotel",
      enquiryFromId,
      currentContactId: enquiryFromId,
      contactTrail: [
        { contactId: enquiryFromId, at: now, note: "Gave us the enquiry" },
      ],
      lines: cleaned,
      value: dealValue(cleaned),
      currency: "AED",
      stage: "lead",
      probability: null,
      owner,
      city: company.area,
      expectedCloseDate: reqDate || now,
      lastActivityAt: now,
      createdAt: now,
      priority,
      tags: [],
      onHold: false,
      reqDate: reqDate || null,
      nextAction: "",
      task: "",
      taskDueDate: null,
      taskDone: false,
      remarks: "",
      sample: null,
      periods: [{ openedAt: now, closedAt: null }],
      fulfilment: { ...EMPTY_FULFILMENT },
    });
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
          <DialogTitle>
            {company ? "New Deal" : "New Deal — choose the customer"}
          </DialogTitle>
          <DialogDescription>
            {company
              ? "Add the products on this enquiry. Deal value is the sum of the lines."
              : "Every deal belongs to a customer."}
          </DialogDescription>
        </DialogHeader>

        {!company ? (
          <CompanyPicker
            onSelect={chooseCompany}
            onCreateCompany={onCreateCompany}
          />
        ) : (
          <div className="space-y-4">
            {/* Success banner after the create-customer detour */}
            {justCreatedCompany && (
              <div className="flex items-center gap-2.5 rounded-xl border border-success/40 bg-success/[0.08] p-3">
                <PartyPopper className="size-4 shrink-0 text-success" />
                <p className="text-sm font-medium">
                  Great — now create the deal
                </p>
                <CheckCircle2 className="ml-auto size-4 shrink-0 text-success" />
              </div>
            )}

            {/* Chosen customer */}
            <div className="flex items-center gap-2.5 rounded-xl bg-secondary/60 p-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-xs font-semibold text-accent">
                {company.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {company.name}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {company.area}, {company.emirate}
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                <Building2 />
                {company.business}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCompany(null)}
              >
                <ArrowLeft />
                Change
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label required>Enquiry title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Housekeeping amenities restock"
                  className={cn(
                    touched && !title.trim() && "border-destructive",
                  )}
                />
              </div>

              <div className="sm:col-span-2">
                <Label required>Category</Label>
                <ClusterCombobox
                  value={category}
                  options={categories}
                  onChange={(v) => {
                    if (!categories.includes(v)) setCategories((c) => [...c, v]);
                    setCategory(v);
                  }}
                />
                {touched && !category && (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    Category is required — it drives dashboard analysis.
                  </p>
                )}
              </div>

              <div>
                <Label required>Enquiry from</Label>
                <select
                  value={enquiryFromId}
                  onChange={(e) => setEnquiryFromId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-accent"
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.role}
                      {c.isPrimary ? " (primary)" : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Locked once saved — records who initiated the query.
                </p>
              </div>

              <div>
                <Label>Required by</Label>
                <Input
                  type="date"
                  value={reqDate.slice(0, 10)}
                  onChange={(e) =>
                    setReqDate(
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : "",
                    )
                  }
                />
              </div>

              <div>
                <Label>Owner</Label>
                <select
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-accent"
                >
                  {DEAL_OWNERS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Priority</Label>
                <div className="flex gap-1.5">
                  {(["high", "medium", "low"] as DealPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex-1 rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors",
                        priority === p
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Line items
              </div>
              <LineItemsEditor lines={lines} onChange={setLines} />
              {touched && validLines.length === 0 && (
                <p className="mt-1.5 text-xs font-medium text-destructive">
                  Add at least one product with a quantity.
                </p>
              )}
            </div>
          </div>
        )}

        {company && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Create deal</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-1 block text-sm font-medium">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}
