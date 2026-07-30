"use client";

import * as React from "react";
import { COMPANIES, STAGE_TRANSITIONS, type Company } from "@/lib/companies";
import { CONTACTS, type Contact } from "@/lib/contacts";
import { DEALS, type Deal } from "@/lib/deals";
import { ACTIVITIES, type Activity } from "@/lib/activities";
import { EMPTY_FULFILMENT, type Fulfilment } from "@/lib/deal-model";
import type { SpancopStage, StageTransition } from "@/lib/spancop";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  fromCompany,
  fromContact,
  fromDeal,
  fromLineItem,
  fromActivity,
  fromTransition,
  toActivity,
  toCompany,
  toContact,
  toDeal,
  toTransition,
  type ActivityRow,
  type CompanyRow,
  type ContactRow,
  type DealRow,
  type TransitionRow,
} from "@/lib/supabase-mappers";

/**
 * Single source of truth for companies, contacts, deals and stage history.
 *
 * Reads on mount, and persists every write back to Supabase.
 *
 * Writes are OPTIMISTIC: local state updates immediately so the UI stays
 * instant, then the row is sent to the database. If that fails the error is
 * surfaced rather than swallowed, because silently losing a saved record is
 * far worse than showing a warning.
 *
 * With no credentials present the provider silently falls back to the bundled
 * demo data, so the app never hard-fails on a missing .env.local.
 */

export type DataSource = "supabase" | "demo";

type DataContextValue = {
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
  transitions: StageTransition[];

  /** True during the initial fetch. */
  loading: boolean;
  /** Where the data on screen came from. */
  source: DataSource;
  /** Set when Supabase was configured but unreachable. */
  error: string | null;
  refresh: () => Promise<void>;

  /** True while a write is in flight. */
  saving: boolean;
  /** Set when the last write failed — surfaced in the UI, never swallowed. */
  saveError: string | null;
  clearSaveError: () => void;

  addCompany: (company: Company) => Contact;
  addCompanies: (companies: Company[]) => void;
  updateCompany: (id: string, patch: Partial<Company>) => void;

  addContact: (contact: Contact) => void;
  contactsFor: (companyId: string) => Contact[];
  primaryFor: (companyId: string) => Contact | null;
  contactById: (id: string | null | undefined) => Contact | null;

  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, patch: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  activitiesFor: (opts: { companyId?: string; dealId?: string }) => Activity[];

  addDeal: (deal: Deal) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  recordPurchaseOrder: (dealId: string, poNumber: string) => void;
  recordDelivery: (
    dealId: string,
    partial: boolean,
    deliveryNote: string | null,
  ) => void;
  recordPayment: (dealId: string, amount: number) => void;
  undoFulfilmentStep: (
    dealId: string,
    step: "po" | "delivery" | "payment",
  ) => void;
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;

  moveStage: (
    companyId: string,
    to: SpancopStage,
    reason: string,
    trigger: StageTransition["trigger"],
  ) => void;
};

const DataContext = React.createContext<DataContextValue | null>(null);

export function useData() {
  const ctx = React.useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

/** Derives a Contact from the single contact captured on the company form. */
export function contactFromCompany(company: Company): Contact {
  return {
    id: `P-${company.id}-1`,
    companyId: company.id,
    name: company.contactName,
    role: company.contactRole,
    email: company.email,
    phone: company.phone,
    whatsappSameAsPhone: company.whatsappSameAsPhone,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "",
    createdAt: company.createdAt,
  };
}

/** Companies carry the ids of their open deals, so recompute after a load. */
function withOpenDeals(companies: Company[], deals: Deal[]): Company[] {
  return companies.map((c) => ({
    ...c,
    openDealIds: deals
      .filter(
        (d) =>
          d.companyId === c.id && d.stage !== "won" && d.stage !== "lost",
      )
      .map((d) => d.id),
  }));
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  /*
    Mirrors of state, read by the write paths.

    Every Supabase write must happen OUTSIDE a setState updater: React 19
    invokes updaters twice under StrictMode, so a write nested inside one runs
    twice — and a DELETE that runs twice against stale state removes rows the
    user never chose. That is exactly how the activities table was emptied.
    These refs let a writer compute from current data without that risk.
  */
  const activitiesRef = React.useRef<Activity[]>([]);
  React.useEffect(() => {
    activitiesRef.current = activities;
  }, [activities]);

  const dealsRef = React.useRef<Deal[]>([]);
  React.useEffect(() => {
    dealsRef.current = deals;
  }, [deals]);

  const companiesRef = React.useRef<Company[]>([]);
  React.useEffect(() => {
    companiesRef.current = companies;
  }, [companies]);
  const [transitions, setTransitions] = React.useState<StageTransition[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [source, setSource] = React.useState<DataSource>("demo");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const clearSaveError = React.useCallback(() => setSaveError(null), []);

  /**
   * Runs a write against Supabase, surfacing any failure.
   * A no-op when running on demo data, so every caller stays identical.
   */
  const persist = React.useCallback(
    async (label: string, run: () => Promise<{ error: unknown } | void>) => {
      if (!isSupabaseConfigured || !supabase) return;
      setSaving(true);
      setSaveError(null);
      try {
        const result = await run();
        const err = result && "error" in result ? result.error : null;
        if (err) throw err;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : `Could not save ${label}`;
        setSaveError(`${label}: ${message}`);
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  /** Fall back to the bundled demo data — used on first run and on failure. */
  const loadDemo = React.useCallback(() => {
    setCompanies(withOpenDeals(COMPANIES, DEALS));
    setContacts(CONTACTS);
    setDeals(DEALS);
    setActivities(ACTIVITIES);
    setTransitions(STAGE_TRANSITIONS);
    setSource("demo");
  }, []);

  const load = React.useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      loadDemo();
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [companyRes, contactRes, dealRes, transitionRes, activityRes] =
        await Promise.all([
          supabase.from("companies").select("*").order("name"),
          supabase.from("contacts").select("*").order("name"),
          // Line items come back nested in one round trip.
          supabase.from("deals").select("*, deal_lines(*)"),
          supabase
            .from("stage_transitions")
            .select("*")
            .order("at", { ascending: false }),
          supabase
            .from("activities")
            .select("*")
            .order("occurred_at", { ascending: false }),
        ]);

      /*
        Activities are deliberately NOT part of this check.

        The activities table is migrated separately (supabase/03-activities.sql).
        Until that runs, `occurred_at` does not exist and this query fails —
        and treating that as fatal threw the whole load away, dropping the app
        back to demo data. Real companies, contacts and deals would silently
        disappear and every task completion would reappear after a refresh.
        Core records load on their own merits; activities degrade alone.
      */
      const failure =
        companyRes.error ?? contactRes.error ?? dealRes.error ?? transitionRes.error;
      if (failure) throw failure;

      const loadedDeals = ((dealRes.data ?? []) as DealRow[]).map(toDeal);
      const loadedCompanies = ((companyRes.data ?? []) as CompanyRow[]).map(
        toCompany,
      );

      setCompanies(withOpenDeals(loadedCompanies, loadedDeals));
      setContacts(((contactRes.data ?? []) as ContactRow[]).map(toContact));
      setDeals(loadedDeals);
      setTransitions(
        ((transitionRes.data ?? []) as TransitionRow[]).map(toTransition),
      );
      if (activityRes.error) {
        // The table has not been migrated yet — say so plainly rather than
        // showing demo activities as if they were the user's own.
        setActivities([]);
        setError(
          "Activities are not saved yet — run supabase/03-activities.sql in the Supabase SQL editor. Everything else is loading normally.",
        );
      } else {
        setActivities(
          ((activityRes.data ?? []) as ActivityRow[]).map(toActivity),
        );
      }
      setSource("supabase");
    } catch (err) {
      // Never leave the user staring at an empty app.
      const message =
        err instanceof Error ? err.message : "Could not reach Supabase";
      setError(message);
      loadDemo();
    } finally {
      setLoading(false);
    }
  }, [loadDemo]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const addContact = React.useCallback(
    (contact: Contact) => {
      setContacts((c) => [contact, ...c]);
      void persist("contact", async () =>
        supabase!.from("contacts").insert(fromContact(contact)),
      );
    },
    [persist],
  );

  /** A company is never created without a contact. */
  const addCompany = React.useCallback((company: Company) => {
    const contact = contactFromCompany(company);
    setCompanies((current) => [company, ...current]);
    setContacts((current) => [contact, ...current]);
    const transition: StageTransition = {
      id: `T-${company.id}`,
      companyId: company.id,
      from: null,
      to: company.spancop,
      trigger: "seed",
      reason: "Company created",
      at: company.createdAt,
      by: company.owner,
    };
    setTransitions((current) => [transition, ...current]);

    // Company first — contact and transition both reference it.
    void persist("company", async () => {
      const res = await supabase!.from("companies").insert(fromCompany(company));
      if (res.error) return res;
      await supabase!.from("contacts").insert(fromContact(contact));
      return supabase!
        .from("stage_transitions")
        .insert(fromTransition(transition));
    });

    return contact;
  }, [persist]);

  const addCompanies = React.useCallback(
    (list: Company[]) => {
      const newContacts = list.map(contactFromCompany);
      const newTransitions: StageTransition[] = list.map((company) => ({
        id: `T-${company.id}`,
        companyId: company.id,
        from: null,
        to: company.spancop,
        trigger: "seed" as const,
        reason: "Imported",
        at: company.createdAt,
        by: company.owner,
      }));

      setCompanies((current) => [...list, ...current]);
      setContacts((current) => [...newContacts, ...current]);
      setTransitions((current) => [...newTransitions, ...current]);

      void persist("import", async () => {
        const res = await supabase!
          .from("companies")
          .insert(list.map(fromCompany));
        if (res.error) return res;
        await supabase!.from("contacts").insert(newContacts.map(fromContact));
        return supabase!
          .from("stage_transitions")
          .insert(newTransitions.map(fromTransition));
      });
    },
    [persist],
  );

  const updateCompany = React.useCallback(
    (id: string, patch: Partial<Company>) => {
      // Computed outside the updater, same rule as every other writer here.
      const existing = companiesRef.current.find((c) => c.id === id);
      if (!existing) return;
      const updated = { ...existing, ...patch };

      setCompanies((current) =>
        current.map((c) => (c.id === id ? updated : c)),
      );

      void persist("company", async () =>
        supabase!.from("companies").update(fromCompany(updated)).eq("id", id),
      );
    },
    [persist],
  );

  /**
   * Logging an activity also nudges the company's activity count, which is
   * what the SPANCOP engine reads to suggest Suspect -> Approach.
   */
  const addActivity = React.useCallback(
    (activity: Activity) => {
      setActivities((current) => [activity, ...current]);
      setCompanies((current) =>
        current.map((c) =>
          c.id === activity.companyId
            ? {
                ...c,
                activityCount: c.activityCount + 1,
                lastActivityAt: activity.occurredAt,
              }
            : c,
        ),
      );

      void persist("activity", async () =>
        supabase!.from("activities").insert(fromActivity(activity)),
      );
    },
    [persist],
  );

  const updateActivity = React.useCallback(
    (id: string, patch: Partial<Activity>) => {
      // Same rule as deleteActivity: compute here, write once, never inside
      // a state updater. An UPDATE repeated is harmless, but a state updater
      // is still the wrong place for it.
      const existing = activitiesRef.current.find((a) => a.id === id);
      if (!existing) return;
      const updated = { ...existing, ...patch };

      setActivities((current) =>
        current.map((a) => (a.id === id ? updated : a)),
      );

      void persist("activity", async () =>
        supabase!.from("activities").update(fromActivity(updated)).eq("id", id),
      );
    },
    [persist],
  );

  /**
   * Removing an entry also decrements the owning company's activity count,
   * which is what SPANCOP reads. Without that the ladder would keep claiming
   * contact that no longer exists anywhere in the journal.
   */
  const deleteActivity = React.useCallback(
    (id: string) => {
      /*
        Everything here runs OUTSIDE the state updaters on purpose.

        The first version did the Supabase delete and a setCompanies call from
        inside setActivities. A state updater must be pure: React 19 invokes it
        twice under StrictMode to surface exactly this kind of mistake, so the
        delete fired twice and the second pass worked from stale state. Rows
        the user never selected were removed. Compute first, then write once.
      */
      const doomed = activitiesRef.current.find((a) => a.id === id);
      if (!doomed) return;

      const remaining = activitiesRef.current.filter((a) => a.id !== id);
      const newestForCompany = remaining
        .filter((a) => a.companyId === doomed.companyId)
        .reduce<string | null>((newest, a) => {
          if (!newest) return a.occurredAt;
          return new Date(a.occurredAt) > new Date(newest)
            ? a.occurredAt
            : newest;
        }, null);

      setActivities(remaining);
      setCompanies((cs) =>
        cs.map((c) =>
          c.id === doomed.companyId
            ? {
                ...c,
                activityCount: Math.max(0, c.activityCount - 1),
                lastActivityAt: newestForCompany,
              }
            : c,
        ),
      );

      void persist("activity", async () =>
        supabase!.from("activities").delete().eq("id", id),
      );
    },
    [persist],
  );

  /** Deal-scoped when a dealId is given, otherwise the whole customer. */
  const activitiesFor = React.useCallback(
    ({ companyId, dealId }: { companyId?: string; dealId?: string }) =>
      activities.filter((a) => {
        if (dealId) return a.dealId === dealId;
        if (companyId) return a.companyId === companyId;
        return true;
      }),
    [activities],
  );

  const addDeal = React.useCallback(
    (deal: Deal) => {
      setDeals((current) => [deal, ...current]);
      // Keep the owning company's open-deal list in step.
      setCompanies((current) =>
        current.map((c) =>
          c.id === deal.companyId
            ? { ...c, openDealIds: [...c.openDealIds, deal.id] }
            : c,
        ),
      );

      void persist("deal", async () => {
        const res = await supabase!.from("deals").insert(fromDeal(deal));
        if (res.error) return res;
        if (deal.lines.length === 0) return res;
        return supabase!
          .from("deal_lines")
          .insert(deal.lines.map((l, i) => fromLineItem(l, deal.id, i)));
      });
    },
    [persist],
  );

  const updateDeal = React.useCallback(
    (id: string, patch: Partial<Deal>) => {
      /*
        Computed here, outside the updater, for the reason described on the
        refs above. This one mattered most: it runs a DELETE on deal_lines,
        and a DELETE repeated against stale state destroys line items.
      */
      const existing = dealsRef.current.find((d) => d.id === id);
      if (!existing) return;
      const updated = { ...existing, ...patch };
      const rewriteLines = patch.lines !== undefined;

      setDeals((current) =>
        current.map((d) => (d.id === id ? updated : d)),
      );

      void persist("deal", async () => {
        const res = await supabase!
          .from("deals")
          .update(fromDeal(updated))
          .eq("id", id);
        if (res.error) return res;

        // Line items are only rewritten when the patch touched them, so an
        // ordinary stage change stays a single statement.
        if (rewriteLines) {
          const cleared = await supabase!
            .from("deal_lines")
            .delete()
            .eq("deal_id", id);
          // Never insert on top of a failed delete — that would duplicate
          // every surviving line.
          if (cleared.error) return cleared;
          if (updated.lines.length > 0) {
            return supabase!
              .from("deal_lines")
              .insert(updated.lines.map((l, i) => fromLineItem(l, id, i)));
          }
        }
        return res;
      });
    },
    [persist],
  );


  const moveStage = React.useCallback(
    (
      companyId: string,
      to: SpancopStage,
      reason: string,
      trigger: StageTransition["trigger"],
    ) => {
      const at = new Date().toISOString();

      /*
        Built outside the updater. The id used to be minted inside one, so a
        double invocation could produce two history rows for a single move —
        or collide on the primary key and fail the whole save.
      */
      const company = companiesRef.current.find((c) => c.id === companyId);
      if (!company) return;
      // Same stage twice is not a movement; recording it would inflate every
      // period report with transitions that never happened.
      if (company.spancop === to) return;

      const transition: StageTransition = {
        id: `T-${Date.now()}-${companyId}`,
        companyId,
        from: company.spancop,
        to,
        trigger,
        reason,
        at,
        by: "Bishal Karma",
      };

      setCompanies((current) =>
        current.map((c) =>
          c.id === companyId ? { ...c, spancop: to, spancopSince: at } : c,
        ),
      );
      setTransitions((t) => [transition, ...t]);

      void persist("stage change", async () => {
        const res = await supabase!
          .from("companies")
          .update({ spancop: to, spancop_since: at })
          .eq("id", companyId);
        if (res.error) return res;
        // History is what powers period reports, so it must land too.
        return supabase!
          .from("stage_transitions")
          .insert(fromTransition(transition));
      });
    },
    [persist],
  );

  /* ---------------------------------------------------------------- */
  /* Order fulfilment — the C · O · P chain                            */
  /* ---------------------------------------------------------------- */

  /**
   * Apply a fulfilment change to a won deal and move the customer with it.
   *
   * One function behind all three buttons and their undo, so the deal write,
   * the SPANCOP move and the journal note can never drift apart. Everything
   * is computed here and written once — no state updater does any of it.
   */
  const applyFulfilment = React.useCallback(
    (
      dealId: string,
      patch: Partial<Fulfilment>,
      note: { report: string; stage: SpancopStage | null; reason: string },
    ) => {
      const deal = dealsRef.current.find((d) => d.id === dealId);
      if (!deal) return;

      const fulfilment = { ...deal.fulfilment, ...patch };
      updateDeal(dealId, { fulfilment });

      /* The dated trail the SPANCOP period filters count. Without this the
         week / month / quarter figures would stay empty however many orders
         were processed. */
      addActivity({
        id: `AC-${Date.now().toString().slice(-8)}`,
        companyId: deal.companyId,
        contactId: deal.currentContactId ?? null,
        dealId: deal.id,
        type: "payment_follow_up",
        report: note.report,
        occurredAt: new Date().toISOString(),
        task: null,
        taskDueAt: null,
        taskDone: false,
        remind: false,
        owner: deal.owner,
        createdAt: new Date().toISOString(),
      });

      if (note.stage) moveStage(deal.companyId, note.stage, note.reason, "automatic");
    },
    [updateDeal, addActivity, moveStage],
  );

  const recordPurchaseOrder = React.useCallback(
    (dealId: string, poNumber: string) => {
      const deal = dealsRef.current.find((d) => d.id === dealId);
      if (!deal) return;
      applyFulfilment(
        dealId,
        { poNumber, poDate: new Date().toISOString() },
        {
          report: `Purchase order ${poNumber} received for ${deal.title}.`,
          stage: "order",
          reason: `PO ${poNumber} received`,
        },
      );
    },
    [applyFulfilment],
  );

  const recordDelivery = React.useCallback(
    (dealId: string, partial: boolean, deliveryNote: string | null) => {
      const deal = dealsRef.current.find((d) => d.id === dealId);
      if (!deal) return;
      applyFulfilment(
        dealId,
        {
          deliveredAt: new Date().toISOString(),
          partialDelivery: partial,
          deliveryNote: partial ? deliveryNote : null,
        },
        {
          report: partial
            ? `Partial delivery made for ${deal.title}.${deliveryNote ? ` Still to come: ${deliveryNote}` : ""}`
            : `Delivery completed for ${deal.title}.`,
          stage: "payment",
          reason: partial ? "Partial delivery made" : "Delivered in full",
        },
      );
    },
    [applyFulfilment],
  );

  /**
   * Record money in.
   *
   * Amounts accumulate, and paying more than the invoice is allowed: the
   * excess is carried as a credit against the customer's next order rather
   * than rejected, which is how advances actually behave in UAE trade.
   * Reaching the invoice value settles the deal and closes the loop.
   */
  const recordPayment = React.useCallback(
    (dealId: string, amount: number) => {
      const deal = dealsRef.current.find((d) => d.id === dealId);
      if (!deal) return;

      const received = deal.fulfilment.amountReceived + amount;
      const settled = received >= deal.value;
      const credit = Math.max(0, received - deal.value);

      applyFulfilment(
        dealId,
        {
          amountReceived: received,
          paidAt: settled ? new Date().toISOString() : null,
        },
        {
          report: settled
            ? `Payment settled for ${deal.title}.${credit > 0 ? ` Received ${credit} more than invoiced — carried as credit.` : ""}`
            : `Part payment received for ${deal.title}. ${deal.value - received} still outstanding.`,
          // Settling returns the customer to Approach: an existing account
          // between deals, which is where the SPANCOP loop restarts.
          stage: settled ? "approach" : "payment",
          reason: settled ? "Payment collected in full" : "Part payment received",
        },
      );
    },
    [applyFulfilment],
  );

  /**
   * Undo one fulfilment step.
   *
   * Clears that step and everything after it, because the later steps make no
   * sense without it — a delivery cannot stand on a purchase order that was
   * never received.
   */
  const undoFulfilmentStep = React.useCallback(
    (dealId: string, step: "po" | "delivery" | "payment") => {
      const deal = dealsRef.current.find((d) => d.id === dealId);
      if (!deal) return;

      const cleared: Partial<Fulfilment> =
        step === "po"
          ? { ...EMPTY_FULFILMENT }
          : step === "delivery"
            ? {
                deliveredAt: null,
                partialDelivery: false,
                deliveryNote: null,
                paidAt: null,
                amountReceived: 0,
              }
            : { paidAt: null, amountReceived: 0 };

      const label =
        step === "po" ? "Purchase order" : step === "delivery" ? "Delivery" : "Payment";

      applyFulfilment(dealId, cleared, {
        report: `${label} record corrected for ${deal.title} — the entry was removed.`,
        stage: step === "po" ? "close" : step === "delivery" ? "order" : "payment",
        reason: `${label} entry undone`,
      });
    },
    [applyFulfilment],
  );


  const contactsFor = React.useCallback(
    (companyId: string) => contacts.filter((c) => c.companyId === companyId),
    [contacts],
  );

  const primaryFor = React.useCallback(
    (companyId: string) => {
      const list = contacts.filter((c) => c.companyId === companyId);
      return list.find((c) => c.isPrimary) ?? list[0] ?? null;
    },
    [contacts],
  );

  const contactByIdFn = React.useCallback(
    (id: string | null | undefined) =>
      id ? (contacts.find((c) => c.id === id) ?? null) : null,
    [contacts],
  );

  const value = React.useMemo<DataContextValue>(
    () => ({
      companies,
      contacts,
      deals,
      activities,
      transitions,
      loading,
      source,
      error,
      refresh: load,
      saving,
      saveError,
      clearSaveError,
      addCompany,
      addCompanies,
      updateCompany,
      addContact,
      contactsFor,
      primaryFor,
      contactById: contactByIdFn,
      addActivity,
      updateActivity,
      deleteActivity,
      activitiesFor,
      addDeal,
      updateDeal,
      recordPurchaseOrder,
      recordDelivery,
      recordPayment,
      undoFulfilmentStep,
      setDeals,
      moveStage,
    }),
    [
      companies,
      contacts,
      deals,
      activities,
      transitions,
      loading,
      source,
      error,
      load,
      saving,
      saveError,
      clearSaveError,
      addCompany,
      addCompanies,
      updateCompany,
      addContact,
      contactsFor,
      primaryFor,
      contactByIdFn,
      addActivity,
      updateActivity,
      deleteActivity,
      activitiesFor,
      addDeal,
      updateDeal,
      recordPurchaseOrder,
      recordDelivery,
      recordPayment,
      undoFulfilmentStep,
      moveStage,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
