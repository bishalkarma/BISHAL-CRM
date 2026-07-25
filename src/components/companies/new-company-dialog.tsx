"use client";

import * as React from "react";
import { Info, MapPin, Loader2 } from "lucide-react";
import {
  BUSINESS_TYPES,
  CLUSTERS,
  CONTACT_ROLES,
  EMIRATES,
  LEAD_SOURCES,
  typeLabelFor,
  typeOptionsFor,
  type BusinessType,
  type Company,
  type CompanyType,
  type ContactRole,
  type Emirate,
  type LeadSource,
} from "@/lib/companies";
import { DEAL_OWNERS } from "@/lib/deals";
import type { GeocodeResult } from "@/lib/geocode";
import { ClusterCombobox } from "./cluster-combobox";
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
  cluster: string;
  emirate: Emirate | "";
  area: string;
  business: BusinessType | "";
  type: CompanyType | "";
  contactName: string;
  contactRole: ContactRole | "";
  email: string;
  phone: string;
  whatsappSameAsPhone: boolean;
  owner: string;
  leadSource: LeadSource | "";
  remarks: string;
  coordinates: { lat: number; lng: number } | null;
};

const EMPTY: FormState = {
  name: "",
  cluster: "",
  emirate: "",
  area: "",
  business: "",
  type: "",
  contactName: "",
  contactRole: "",
  email: "",
  phone: "",
  whatsappSameAsPhone: true,
  owner: DEAL_OWNERS[0],
  leadSource: "",
  remarks: "",
  coordinates: null,
};

export function NewCompanyDialog({
  open,
  onOpenChange,
  onCreate,
  existingNames,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (company: Company) => void;
  existingNames: string[];
}) {
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [touched, setTouched] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Business drives Type. Clear a stale Type when Business changes.
  const changeBusiness = (business: BusinessType) =>
    setForm((f) => ({ ...f, business, type: "" }));

  const typeOptions = typeOptionsFor(form.business || null);
  const typeLabel = typeLabelFor(form.business || null);

  const duplicate =
    form.name.trim().length > 1 &&
    existingNames.some(
      (n) => n.toLowerCase() === form.name.trim().toLowerCase(),
    );

  const emailValid =
    form.email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const valid =
    form.name.trim() &&
    form.emirate &&
    form.area.trim() &&
    form.business &&
    form.type &&
    form.contactName.trim() &&
    form.contactRole &&
    form.phone.trim() &&
    emailValid &&
    !duplicate;

  const reset = () => {
    setForm(EMPTY);
    setTouched(false);
  };

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    const now = new Date().toISOString();
    onCreate({
      id: `C-${Date.now().toString().slice(-6)}`,
      name: form.name.trim(),
      cluster: form.cluster || null,
      emirate: form.emirate as Emirate,
      area: form.area.trim(),
      coordinates: form.coordinates ?? undefined,
      business: form.business as BusinessType,
      type: form.type as CompanyType,
      contactName: form.contactName.trim(),
      contactRole: form.contactRole as ContactRole,
      email: form.email.trim() || null,
      phone: form.phone.trim(),
      whatsappSameAsPhone: form.whatsappSameAsPhone,
      owner: form.owner,
      leadSource: (form.leadSource || "Referral") as LeadSource,
      remarks: form.remarks.trim(),
      // Every new company starts at Suspect by definition.
      spancop: "suspect",
      spancopSince: now,
      leadStatus: "cold",
      nextFollowUp: null,
      activityCount: 0,
      lastActivityAt: null,
      openDealIds: [],
      hasPurchaseOrder: false,
      awaitingPayment: false,
      hasEverOrdered: false,
      lastOrderAt: null,
      lifetimeValue: 0,
      createdAt: now,
    });
    reset();
    onOpenChange(false);
  };

  /**
   * Explicit, user-initiated only. Resolves the pin to a place NAME and
   * writes it straight into the Location field; coordinates are kept
   * silently on the record for map links.
   */
  const pinCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Location isn't available on this device.");
      return;
    }
    setGeoError(null);
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        try {
          const res = await fetch(
            `/api/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}`,
          );
          const data: GeocodeResult = await res.json();

          setForm((f) => ({
            ...f,
            coordinates: coords,
            // The resolved name goes INTO the field, replacing any placeholder.
            area: data.area ?? f.area,
            // Only auto-fill the emirate while it is still empty.
            emirate: f.emirate || (data.emirate ?? ""),
          }));

          if (!data.area) {
            setGeoError(
              "Pinned, but the area name couldn't be resolved — type it in.",
            );
          }
        } catch {
          setForm((f) => ({ ...f, coordinates: coords }));
          setGeoError("Pinned, but the area name couldn't be resolved.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — type the area instead."
            : "Couldn't get your location — type the area instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
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
          <DialogTitle>New Company</DialogTitle>
          <DialogDescription>
            13 fields · SPANCOP starts at Suspect and updates automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Section title="Identity">
            <Field label="Property name" required error={touched && !form.name.trim()}>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Atlantis The Palm"
                aria-invalid={touched && !form.name.trim()}
              />
              {duplicate && (
                <p className="mt-1 text-xs font-medium text-destructive">
                  A company with this name already exists.
                </p>
              )}
            </Field>
            <Field label="Cluster" hint="Search existing or create new">
              <ClusterCombobox
                value={form.cluster}
                options={CLUSTERS}
                onChange={(v) => set("cluster", v)}
              />
            </Field>
          </Section>

          <Section title="Location">
            <Field label="Emirate" required error={touched && !form.emirate}>
              <Select
                value={form.emirate}
                onChange={(v) => set("emirate", v as Emirate)}
                placeholder="Select emirate"
                options={EMIRATES}
              />
            </Field>
            <Field label="Location / Area" required error={touched && !form.area.trim()}>
              <div className="flex gap-1.5">
                <Input
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder={locating ? "Finding your location…" : "Palm Jumeirah"}
                  disabled={locating}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={pinCurrentLocation}
                  disabled={locating}
                  title="Use my current location"
                  aria-label="Use my current location"
                  className={cn(form.coordinates && "border-accent text-accent")}
                >
                  {locating ? <Loader2 className="animate-spin" /> : <MapPin />}
                </Button>
              </div>
              {form.coordinates && !geoError && (
                <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3 text-accent" />
                  <span className="font-mono">
                    {form.coordinates.lat}, {form.coordinates.lng}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${form.coordinates.lat},${form.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline hover:no-underline"
                  >
                    view
                  </a>
                  <button
                    type="button"
                    onClick={() => set("coordinates", null)}
                    className="underline hover:no-underline"
                  >
                    remove
                  </button>
                </p>
              )}
              {geoError && (
                <p className="mt-1 text-xs text-warning">{geoError}</p>
              )}
            </Field>
          </Section>

          <Section title="Classification">
            <Field label="Business" required error={touched && !form.business}>
              <Select
                value={form.business}
                onChange={(v) => changeBusiness(v as BusinessType)}
                placeholder="Select business"
                options={BUSINESS_TYPES}
              />
            </Field>
            <Field
              label="Type"
              required
              error={touched && !form.type}
              hint={form.business ? typeLabel : "Choose a Business first"}
            >
              <Select
                value={form.type}
                onChange={(v) => set("type", v as CompanyType)}
                placeholder={form.business ? "Select type" : "—"}
                options={typeOptions}
                disabled={!form.business}
              />
            </Field>
          </Section>

          <Section title="Primary contact">
            <Field label="Contact person" required error={touched && !form.contactName.trim()}>
              <Input
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                placeholder="Marco Rossi"
              />
            </Field>
            <Field label="Role / title" required error={touched && !form.contactRole}>
              <Select
                value={form.contactRole}
                onChange={(v) => set("contactRole", v as ContactRole)}
                placeholder="Select role"
                options={CONTACT_ROLES}
              />
            </Field>
            <Field label="Email" hint="Optional" error={touched && !emailValid}>
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
            <Field label="Phone" required error={touched && !form.phone.trim()}>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+971 50 123 4567"
              />
              <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.whatsappSameAsPhone}
                  onChange={(e) => set("whatsappSameAsPhone", e.target.checked)}
                  className="size-3.5 accent-[hsl(var(--accent))]"
                />
                Same as WhatsApp
              </label>
            </Field>
          </Section>

          <Section title="Ownership">
            <Field label="Account owner">
              <Select
                value={form.owner}
                onChange={(v) => set("owner", v)}
                placeholder="Select owner"
                options={[...DEAL_OWNERS]}
              />
            </Field>
            <Field label="Lead source">
              <Select
                value={form.leadSource}
                onChange={(v) => set("leadSource", v as LeadSource)}
                placeholder="Select source"
                options={LEAD_SOURCES}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Remarks">
                <textarea
                  value={form.remarks}
                  onChange={(e) => set("remarks", e.target.value)}
                  rows={2}
                  placeholder="Delivery preferences, sourcing policy, anything useful…"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-[var(--shadow-soft)] outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25"
                />
              </Field>
            </div>
          </Section>

          <p className="flex items-start gap-2 rounded-lg bg-secondary/60 p-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-accent" />
            Starts at <strong className="font-medium text-foreground">Suspect</strong>.
            Log an activity to be prompted to move it to Approach.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={touched && !valid}>
            Create company
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
      <div className={cn(error && "[&_input]:border-destructive [&_button]:border-destructive")}>
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
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-[var(--shadow-soft)] outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/25",
        disabled && "cursor-not-allowed opacity-50",
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
