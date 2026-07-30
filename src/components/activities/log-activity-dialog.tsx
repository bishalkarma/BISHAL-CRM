"use client";

import * as React from "react";
import {
  Banknote,
  Bell,
  CheckCircle2,
  ChevronRight,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Users,
  X,
} from "lucide-react";
import {
  ACTIVITY_MAP,
  ACTIVITY_TYPES,
  type Activity,
  type ActivityType,
} from "@/lib/activities";
import { DEAL_OWNERS } from "@/lib/deals";
import { useData } from "@/components/providers/data-provider";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin,
  Phone,
  Mail,
  Users,
  Package,
  MessageSquare,
  MessageCircle,
  Banknote,
};

/** Contacts collapse past this many, matching the Contacts page. */
const VISIBLE_CONTACTS = 3;

export function LogActivityDialog({
  open,
  onOpenChange,
  presetCompanyId,
  presetDealId,
  completing,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Set when opened from a company or deal drawer. */
  presetCompanyId?: string;
  presetDealId?: string;
  /**
   * The open task being closed out. Completing a task never just ticks a box:
   * it opens this form pre-filled so what actually happened gets recorded,
   * and a further follow-up can be set — the loop continues until the user
   * decides no next step is needed.
   */
  completing?: Activity | null;
  /**
   * An existing entry being corrected.
   *
   * Edits are silent by design: no journal note, no "edited" badge. The entry
   * simply becomes what the user says it is, and the stored counters are
   * recomputed so a changed date cannot leave a customer at the wrong stage.
   */
  editing?: Activity | null;
}) {
  const { companies, contactsFor, primaryFor, deals, addActivity, updateActivity } =
    useData();

  const [type, setType] = React.useState<ActivityType>("call");
  const [companyId, setCompanyId] = React.useState("");
  const [contactId, setContactId] = React.useState("");
  const [dealId, setDealId] = React.useState("");
  const [report, setReport] = React.useState("");
  const [occurredAt, setOccurredAt] = React.useState("");
  const [owner, setOwner] = React.useState<string>(DEAL_OWNERS[0]);
  const [showAllContacts, setShowAllContacts] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  // Follow-up stays hidden until asked for — see the inline-reveal decision.
  const [showTask, setShowTask] = React.useState(false);
  const [task, setTask] = React.useState("");
  const [taskDueAt, setTaskDueAt] = React.useState("");
  const [remind, setRemind] = React.useState(true);

  const reset = React.useCallback(() => {
    setType(editing?.type ?? completing?.type ?? "call");
    setCompanyId(
      editing?.companyId ?? completing?.companyId ?? presetCompanyId ?? "",
    );
    setContactId(editing?.contactId ?? completing?.contactId ?? "");
    setDealId(editing?.dealId ?? completing?.dealId ?? presetDealId ?? "");
    setReport(editing?.report ?? "");
    setOccurredAt(
      (editing?.occurredAt ?? new Date().toISOString()).slice(0, 10),
    );
    setShowAllContacts(false);
    setTouched(false);
    setShowTask(Boolean(editing?.task));
    setTask(editing?.task ?? "");
    setTaskDueAt(editing?.taskDueAt?.slice(0, 10) ?? "");
    setRemind(editing?.remind ?? true);
  }, [presetCompanyId, presetDealId, completing, editing]);

  React.useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  // Default the contact to the company primary, but never the deal.
  React.useEffect(() => {
    if (companyId && !completing && !editing) {
      setContactId(primaryFor(companyId)?.id ?? "");
    }
  }, [companyId, primaryFor, completing, editing]);

  const company = companies.find((c) => c.id === companyId) ?? null;
  const contacts = companyId ? contactsFor(companyId) : [];
  const visibleContacts = showAllContacts
    ? contacts
    : contacts.slice(0, VISIBLE_CONTACTS);
  const hiddenCount = Math.max(contacts.length - VISIBLE_CONTACTS, 0);

  const companyDeals = React.useMemo(
    () =>
      deals.filter(
        (d) => d.companyId === companyId && d.stage !== "won" && d.stage !== "lost",
      ),
    [deals, companyId],
  );

  const definition = ACTIVITY_MAP[type];
  const valid = Boolean(companyId && contactId && report.trim());

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    const now = new Date().toISOString();
    const trimmedTask = showTask ? task.trim() : "";

    /*
      Editing writes over the entry in place. Which customer and deal it
      belongs to are deliberately not changed here — moving an entry between
      customers would rewrite two histories at once.
    */
    if (editing) {
      updateActivity(editing.id, {
        type,
        contactId: contactId || null,
        report: report.trim(),
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : editing.occurredAt,
        task: trimmedTask || null,
        taskDueAt:
          trimmedTask && taskDueAt ? new Date(taskDueAt).toISOString() : null,
        remind: Boolean(trimmedTask) && remind,
      });
      onOpenChange(false);
      return;
    }

    addActivity({
      id: `AC-${Date.now().toString().slice(-8)}`,
      companyId,
      contactId: contactId || null,
      // Deliberate only: never inferred from the company's open deals.
      dealId: dealId || null,
      type,
      report: report.trim(),
      occurredAt: occurredAt
        ? new Date(occurredAt).toISOString()
        : now,
      task: trimmedTask || null,
      taskDueAt: trimmedTask && taskDueAt ? new Date(taskDueAt).toISOString() : null,
      taskDone: false,
      remind: Boolean(trimmedTask) && remind,
      owner,
      createdAt: now,
    } satisfies Activity);

    // Closing the loop: the task is done because the work was recorded.
    if (completing) updateActivity(completing.id, { taskDone: true });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit activity" : completing ? "Complete task" : "Log activity"}
          </DialogTitle>
          <DialogDescription>
            Record what happened, and optionally what needs to happen next.
          </DialogDescription>
        </DialogHeader>

        {completing && (
          <div className="flex items-start gap-2.5 rounded-xl border border-accent/40 bg-accent/[0.06] p-3">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
            <div className="min-w-0 flex-1 text-sm">
              <div className="break-words font-medium">{completing.task}</div>
              <div className="text-xs text-muted-foreground">
                Write what happened. Add another follow-up if the work
                continues.
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Type — the whole form adapts to this */}
          <div>
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {ACTIVITY_TYPES.map((item) => {
                const Icon = ICONS[item.icon] ?? Phone;
                const active = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                      active
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label required>Customer</Label>
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setDealId("");
                }}
                disabled={Boolean(presetCompanyId)}
                className={cn(
                  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-accent disabled:opacity-60",
                  touched && !companyId && "border-destructive",
                )}
              >
                <option value="">Select customer</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {company && (
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  {company.area}, {company.emirate} · {company.business}{" "}
                  {company.type}
                </p>
              )}
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>
          </div>

          {/* Contacts — collapse past three */}
          {companyId && (
            <div>
              <Label required>Contact person</Label>
              {contacts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                  This customer has no contacts yet.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                  {visibleContacts.map((contact) => {
                    const active = contactId === contact.id;
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => setContactId(contact.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 border-b border-border px-2.5 py-2 text-left last:border-0 transition-colors",
                          active ? "bg-accent/10" : "hover:bg-secondary",
                        )}
                      >
                        <Avatar className="size-6 shrink-0">
                          <AvatarFallback className="bg-secondary text-[9px]">
                            {initials(contact.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {contact.name}
                          <span className="text-muted-foreground">
                            {" "}
                            · {contact.role}
                          </span>
                        </span>
                        {contact.isPrimary && (
                          <Badge variant="accent" className="shrink-0 px-1.5 py-0">
                            primary
                          </Badge>
                        )}
                        {active && (
                          <span className="size-1.5 shrink-0 rounded-full bg-accent" />
                        )}
                      </button>
                    );
                  })}
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAllContacts((v) => !v)}
                      className="flex w-full items-center justify-center gap-1.5 border-t border-border py-1.5 text-xs font-medium text-accent hover:bg-secondary/50"
                    >
                      <ChevronRight
                        className={cn(
                          "size-3.5 transition-transform",
                          showAllContacts && "rotate-90",
                        )}
                      />
                      {showAllContacts
                        ? "Show fewer"
                        : `Show ${hiddenCount} more contact${hiddenCount === 1 ? "" : "s"}`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Deal link — never preselected */}
          {companyId && (
            <div>
              <Label hint="(optional)">Link to deal</Label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                disabled={Boolean(presetDealId)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-accent disabled:opacity-60"
              >
                <option value="">Not linked</option>
                {companyDeals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.id} · {deal.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Nothing preselected. Link only if this conversation was about a
                deal.
              </p>
            </div>
          )}

          {/* Report — label follows the type */}
          <div>
            <Label required>{definition.reportLabel}</Label>
            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              rows={3}
              placeholder="What was discussed, agreed, or observed…"
              className={cn(
                "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25",
                touched && !report.trim() && "border-destructive",
              )}
            />
          </div>

          {/* Follow-up — inline reveal, not a popup */}
          {!showTask ? (
            <button
              type="button"
              onClick={() => setShowTask(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm font-medium text-accent transition-colors hover:border-accent/50 hover:bg-accent/[0.05]"
            >
              <Plus className="size-4" />
              Add follow-up task
            </button>
          ) : (
            <div className="rounded-xl border border-accent/40 bg-accent/[0.04] p-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  What happens next
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowTask(false);
                    setTask("");
                    setTaskDueAt("");
                  }}
                  aria-label="Remove follow-up"
                  className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <Label>Next task</Label>
                  <Input
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                    placeholder="Send quotation"
                  />
                </div>
                <div>
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={taskDueAt}
                    onChange={(e) => setTaskDueAt(e.target.value)}
                  />
                </div>
              </div>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remind}
                  onChange={(e) => setRemind(e.target.checked)}
                  className="size-3.5 accent-[hsl(var(--accent))]"
                />
                <Bell className="size-3" />
                Remind me — bell and dashboard
              </label>
            </div>
          )}

          <div>
            <Label>Logged by</Label>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>
            {completing ? "Complete and log" : "Save activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Label({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="mb-1 flex items-baseline gap-1.5 text-sm font-medium">
      {children}
      {required && <span className="text-destructive">*</span>}
      {hint && (
        <span className="text-xs font-normal text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}
