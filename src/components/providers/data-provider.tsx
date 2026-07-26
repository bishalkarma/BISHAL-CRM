"use client";

import * as React from "react";
import { COMPANIES, STAGE_TRANSITIONS, type Company } from "@/lib/companies";
import { CONTACTS, type Contact } from "@/lib/contacts";
import { DEALS, type Deal } from "@/lib/deals";
import type { SpancopStage, StageTransition } from "@/lib/spancop";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
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
 * Stage 2 (this file): loads everything from Supabase on mount, then keeps it
 * in memory. Writes are still local — they will be persisted in stage 3, so
 * behaviour is unchanged until then and there is nothing new to break.
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
    (contact: Contact) => setContacts((c) => [contact, ...c]),
    [],
  );

  /** A company is never created without a contact. */
  const addCompany = React.useCallback((company: Company) => {
    const contact = contactFromCompany(company);
    setCompanies((current) => [company, ...current]);
    setContacts((current) => [contact, ...current]);
    setTransitions((current) => [
      {
        id: `T-${company.id}`,
        companyId: company.id,
        from: null,
        to: company.spancop,
        trigger: "seed",
        reason: "Company created",
        at: company.createdAt,
        by: company.owner,
      },
      ...current,
    ]);
    return contact;
  }, []);

  const addCompanies = React.useCallback((list: Company[]) => {
    const newContacts = list.map(contactFromCompany);
    setCompanies((current) => [...list, ...current]);
    setContacts((current) => [...newContacts, ...current]);
    setTransitions((current) => [
      ...list.map((company) => ({
        id: `T-${company.id}`,
        companyId: company.id,
        from: null,
        to: company.spancop,
        trigger: "seed" as const,
        reason: "Imported",
        at: company.createdAt,
        by: company.owner,
      })),
      ...current,
    ]);
  }, []);

  const updateCompany = React.useCallback(
    (id: string, patch: Partial<Company>) =>
      setCompanies((current) =>
        current.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      ),
    [],
  );

  const addDeal = React.useCallback((deal: Deal) => {
    setDeals((current) => [deal, ...current]);
    // Keep the owning company's open-deal list in step.
    setCompanies((current) =>
      current.map((c) =>
        c.id === deal.companyId
          ? { ...c, openDealIds: [...c.openDealIds, deal.id] }
          : c,
      ),
    );
  }, []);

  const updateDeal = React.useCallback(
    (id: string, patch: Partial<Deal>) =>
      setDeals((current) =>
        current.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      ),
    [],
  );

  const moveStage = React.useCallback(
    (
      companyId: string,
      to: SpancopStage,
      reason: string,
      trigger: StageTransition["trigger"],
    ) => {
      setCompanies((current) => {
        const company = current.find((c) => c.id === companyId);
        if (company) {
          setTransitions((t) => [
            {
              id: `T-${Date.now()}-${companyId}`,
              companyId,
              from: company.spancop,
              to,
              trigger,
              reason,
              at: new Date().toISOString(),
              by: "Bishal Karma",
            },
            ...t,
          ]);
        }
        return current.map((c) =>
          c.id === companyId
            ? { ...c, spancop: to, spancopSince: new Date().toISOString() }
            : c,
        );
      });
    },
    [],
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
