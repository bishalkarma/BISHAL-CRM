"use client";

import * as React from "react";
import { CONTACT_ROLES, type ContactRole } from "@/lib/companies";
import type { Contact } from "@/lib/contacts";
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
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  role: ContactRole | "";
  email: string;
  phone: string;
  whatsappSameAsPhone: boolean;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  notes: string;
};

const EMPTY: FormState = {
  name: "",
  role: "",
  email: "",
  phone: "",
  whatsappSameAsPhone: true,
  isPrimary: false,
  isDecisionMaker: false,
  notes: "",
};

export function EditContactDialog({
  open,
  onOpenChange,
  contact,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onSave: (id: string, patch: Partial<Contact>) => void;
}) {
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [touched, setTouched] = React.useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* Fill the form from the contact being edited when the dialog opens. */
  React.useEffect(() => {
    if (!open || !contact) return;
    setForm({
      name: contact.name,
      role: contact.role,
      email: contact.email ?? "",
      phone: contact.phone,
      whatsappSameAsPhone: contact.whatsappSameAsPhone,
      isPrimary: contact.isPrimary,
      isDecisionMaker: contact.isDecisionMaker,
      notes: contact.notes,
    });
  }, [open, contact]);

  const emailValid =
    form.email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const valid =
    form.name.trim() &&
    form.role &&
    form.phone.trim() &&
    emailValid;

  const reset = () => {
    setForm(EMPTY);
    setTouched(false);
  };

  const submit = () => {
    setTouched(true);
    if (!valid || !contact) return;

    onSave(contact.id, {
      name: form.name.trim(),
      role: form.role as ContactRole,
      email: form.email.trim() || null,
      phone: form.phone.trim(),
      whatsappSameAsPhone: form.whatsappSameAsPhone,
      isPrimary: form.isPrimary,
      isDecisionMaker: form.isDecisionMaker,
      notes: form.notes.trim(),
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
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>Edit contact</DialogTitle>
          <DialogDescription>
            Update this person&apos;s details. Changes are saved immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Section title="Personal details">
            <Field
              label="Full name"
              required
              error={touched && !form.name.trim()}
            >
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Marco Rossi"
                aria-invalid={touched && !form.name.trim()}
              />
            </Field>
            <Field
              label="Role / title"
              required
              error={touched && !form.role}
            >
              <Select
                value={form.role}
                onChange={(v) => set("role", v as ContactRole)}
                placeholder="Select role"
                options={[...CONTACT_ROLES]}
              />
            </Field>
          </Section>

          <Section title="Communication">
            <Field
              label="Email"
              hint="Optional"
              error={touched && !emailValid}
            >
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@company.ae"
              />
              {touched && !emailValid && (
                <p className="mt-1 text-xs font-medium text-destructive">
                  Enter a valid email or leave it blank.
                </p>
              )}
            </Field>
            <Field
              label="Phone"
              required
              error={touched && !form.phone.trim()}
            >
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+971 50 123 4567"
              />
              <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.whatsappSameAsPhone}
                  onChange={(e) =>
                    set("whatsappSameAsPhone", e.target.checked)
                  }
                  className="size-3.5 accent-[hsl(var(--accent))]"
                />
                Same as WhatsApp
              </label>
            </Field>
          </Section>

          <Section title="Flags">
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/40">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(e) => set("isPrimary", e.target.checked)}
                className="mt-0.5 size-4 accent-[hsl(var(--accent))]"
              />
              <div>
                <div className="text-sm font-medium">Primary contact</div>
                <div className="text-xs text-muted-foreground">
                  Shown first and used as the default for this company.
                </div>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/40">
              <input
                type="checkbox"
                checked={form.isDecisionMaker}
                onChange={(e) => set("isDecisionMaker", e.target.checked)}
                className="mt-0.5 size-4 accent-[hsl(var(--accent))]"
              />
              <div>
                <div className="text-sm font-medium">Decision maker</div>
                <div className="text-xs text-muted-foreground">
                  This person signs off on purchases, not just relays requests.
                </div>
              </div>
            </label>
          </Section>

          <Section title="Notes">
            <div className="sm:col-span-2">
              <Field label="Internal notes" hint="Optional">
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                  placeholder=""
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-[var(--shadow-soft)] outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25"
                />
              </Field>
            </div>
          </Section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={touched && !valid}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Small layout helpers (kept local — same pattern as the company form) ── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {title}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 flex items-baseline gap-1.5 text-sm font-medium">
        {label}
        {required && <span className="text-destructive">*</span>}
        {hint && (
          <span className="text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </label>
      <div
        className={cn(
          error && "[&_input]:border-destructive [&_button]:border-destructive",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-[var(--shadow-soft)] outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25",
        !value && "text-muted-foreground",
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option} className="text-foreground">
          {option}
        </option>
      ))}
    </select>
  );
}
