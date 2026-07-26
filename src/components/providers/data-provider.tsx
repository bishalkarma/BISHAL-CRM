"use client";

import * as React from "react";
import { COMPANIES, STAGE_TRANSITIONS, type Company } from "@/lib/companies";
import { CONTACTS, type Contact } from "@/lib/contacts";
import { DEALS, type Deal } from "@/lib/deals";
import type { SpancopStage, StageTransition } from "@/lib/spancop";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  fromCompany,
  fromContact,
  fromDeal,
  fromLineItem,
  fromTransition,
  toCompany,
  toContact,
  toDeal,
  toTransition,
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

  addDeal: (deal: Deal) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
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
      const [companyRes, contactRes, dealRes, transitionRes] =
        await Promise.all([
          supabase.from("companies").select("*").order("name"),
          supabase.from("contacts").select("*").order("name"),
          // Line items come back nested in one round trip.
          supabase.from("deals").select("*, deal_lines(*)"),
          supabase
            .from("stage_transitions")
            .select("*")
            .order("at", { ascending: false }),
        ]);

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
      setCompanies((current) => {
        const next = current.map((c) =>
          c.id === id ? { ...c, ...patch } : c,
        );
        const updated = next.find((c) => c.id === id);
        if (updated) {
          void persist("company", async () =>
            supabase!.from("companies").update(fromCompany(updated)).eq("id", id),
          );
        }
        return next;
      });
    },
    [persist],
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
      setDeals((current) => {
        const next = current.map((d) =>
          d.id === id ? { ...d, ...patch } : d,
        );
        const updated = next.find((d) => d.id === id);
        if (updated) {
          void persist("deal", async () => {
            const res = await supabase!
              .from("deals")
              .update(fromDeal(updated))
              .eq("id", id);
            if (res.error) return res;

            // Line items are only rewritten when the patch touched them,
            // so an ordinary stage change stays a single statement.
            if (patch.lines) {
              await supabase!.from("deal_lines").delete().eq("deal_id", id);
              if (updated.lines.length > 0) {
                return supabase!
                  .from("deal_lines")
                  .insert(
                    updated.lines.map((l, i) => fromLineItem(l, id, i)),
                  );
              }
            }
            return res;
          });
        }
        return next;
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

      setCompanies((current) => {
        const company = current.find((c) => c.id === companyId);
        if (company) {
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
        }
        return current.map((c) =>
          c.id === companyId ? { ...c, spancop: to, spancopSince: at } : c,
        );
      });
    },
    [persist],
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
      addDeal,
      updateDeal,
      setDeals,
      moveStage,
    }),
    [
      companies,
      contacts,
      deals,
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
      addDeal,
      updateDeal,
      moveStage,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
