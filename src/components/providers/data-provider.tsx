"use client";

import * as React from "react";
import { COMPANIES, type Company } from "@/lib/companies";
import { CONTACTS, type Contact } from "@/lib/contacts";
import { DEALS, type Deal } from "@/lib/deals";
import {
  STAGE_TRANSITIONS,
} from "@/lib/companies";
import type { SpancopStage, StageTransition } from "@/lib/spancop";

/**
 * Single source of truth for companies, contacts, deals and stage history.
 *
 * Previously the Companies page held its own `useState` copy while the deal
 * flow mutated the raw module array, so a record created in one place was
 * invisible in the other. Everything now reads and writes through here.
 *
 * The shape mirrors what the Supabase client will expose later, so swapping
 * the backend won't touch any component.
 */

type DataContextValue = {
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  transitions: StageTransition[];

  /** Creating a company also creates its first contact, flagged primary. */
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = React.useState<Company[]>(COMPANIES);
  const [contacts, setContacts] = React.useState<Contact[]>(CONTACTS);
  const [deals, setDeals] = React.useState<Deal[]>(DEALS);
  const [transitions, setTransitions] =
    React.useState<StageTransition[]>(STAGE_TRANSITIONS);

  const addContact = React.useCallback(
    (contact: Contact) => setContacts((c) => [contact, ...c]),
    [],
  );

  /**
   * A company is never created without a contact — that omission was what
   * left the "Enquiry from" picker empty and hid new people from Contacts.
   */
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

  const addDeal = React.useCallback(
    (deal: Deal) => setDeals((current) => [deal, ...current]),
    [],
  );

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
