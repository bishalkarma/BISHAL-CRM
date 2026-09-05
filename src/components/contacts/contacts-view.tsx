"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  ChevronRight,
  Crown,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Search,
  Star,
} from "lucide-react";
import type { Contact } from "@/lib/contacts";
import { useData } from "@/components/providers/data-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, initials } from "@/lib/utils";
import { EditContactDialog } from "./edit-contact-dialog";
import { Pagination, paginate } from "@/components/ui/pagination";

/** Companies with more than this many contacts collapse the remainder. */
const VISIBLE_LIMIT = 3;

export function ContactsView() {
  const { companies, contacts: allContacts, deals, loading, updateContact } = useData();
  const [query, setQuery] = React.useState("");
  const [decisionMakersOnly, setDecisionMakersOnly] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null);

  const companyName = React.useCallback(
    (id: string) => companies.find((c) => c.id === id)?.name ?? "—",
    [companies],
  );

  /** How many enquiries this person has originated. */
  const enquiryStats = React.useCallback(
    (contactId: string) => {
      const originated = deals.filter((d) => d.enquiryFromId === contactId);
      return {
        count: originated.length,
        won: originated.filter((d) => d.stage === "won").length,
      };
    },
    [deals],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return allContacts.filter((c) => {
      if (decisionMakersOnly && !c.isDecisionMaker) return false;
      if (!q) return true;
      return `${c.name} ${c.role} ${companyName(c.companyId)} ${c.phone} ${c.email ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, decisionMakersOnly, allContacts, companyName]);

  /** Group by company so multiple contacts read as one relationship. */
  const grouped = React.useMemo(() => {
    const map = new Map<string, Contact[]>();
    filtered.forEach((c) => {
      const list = map.get(c.companyId) ?? [];
      list.push(c);
      map.set(c.companyId, list);
    });
    return [...map.entries()].map(([companyId, contacts]) => ({
      companyId,
      contacts: contacts.sort(
        (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
      ),
    }));
  }, [filtered]);

  // Pagination
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const PAGE_SIZE = pageSize;
  const totalGroups = grouped.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / PAGE_SIZE));
  const pagedGroups = paginate(grouped, page, PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [query, decisionMakersOnly]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contacts"
        description={`${allContacts.length} people across ${companies.length} customers.`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, roles or companies…"
            className="h-9 pl-9"
          />
        </div>
        <Button
          variant={decisionMakersOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setDecisionMakersOnly((v) => !v)}
        >
          <Crown />
          Decision makers
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-border bg-secondary/40 px-4 py-2.5">
                <Skeleton className="size-7 shrink-0 rounded-lg" />
                <Skeleton className="h-3.5 w-40" />
              </div>
              <div className="space-y-3 p-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No contacts match your search.
        </div>
      ) : (
        <div className="space-y-3">
          {pagedGroups.map(({ companyId, contacts }, groupIndex) => (
            <motion.div
              key={companyId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.28,
                delay: Math.min(groupIndex * 0.04, 0.3),
              }}
            >
              <Card className="overflow-hidden">
                <div className="flex items-center gap-2.5 border-b border-border bg-secondary/40 px-4 py-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-xs font-semibold text-accent">
                    {companyName(companyId).charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {companyName(companyId)}
                  </span>
                  <Badge variant="outline" className="gap-1">
                    <Building2 />
                    {contacts.length}
                  </Badge>
                </div>

                <ul className="divide-y divide-border">
                  {(expanded[companyId]
                    ? contacts
                    : contacts.slice(0, VISIBLE_LIMIT)
                  ).map((contact) => {
                    const stats = enquiryStats(contact.id);
                    return (
                      <li
                        key={contact.id}
                        className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40"
                      >
                        <Avatar className="size-9 shrink-0">
                          <AvatarFallback
                            className={cn(
                              "text-xs",
                              contact.isPrimary
                                ? "bg-accent/15 text-accent"
                                : "bg-secondary text-muted-foreground",
                            )}
                          >
                            {initials(contact.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-medium">
                              {contact.name}
                            </span>
                            {contact.isPrimary && (
                              <Badge variant="accent" className="gap-1 px-1.5 py-0">
                                <Star className="size-2.5" />
                                Primary
                              </Badge>
                            )}
                            {contact.isDecisionMaker && (
                              <Badge variant="success" className="gap-1 px-1.5 py-0">
                                <Crown className="size-2.5" />
                                Decides
                              </Badge>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {contact.role}
                            {contact.notes ? ` · ${contact.notes}` : ""}
                          </div>
                        </div>

                        {/* Who feeds us business */}
                        {stats.count > 0 && (
                          <div className="shrink-0 rounded-lg bg-secondary/70 px-2 py-1 text-center">
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Enquiries
                            </div>
                            <div className="text-sm font-semibold tabular-nums">
                              {stats.count}
                              {stats.won > 0 && (
                                <span className="ml-1 text-[10px] font-normal text-success">
                                  {stats.won} won
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => setEditingContact(contact)}
                            aria-label={`Edit ${contact.name}`}
                          >
                            <Pencil />
                          </Button>
                          <Button variant="outline" size="icon-sm" asChild>
                            <a
                              href={`tel:${contact.phone.replace(/\s/g, "")}`}
                              aria-label={`Call ${contact.name}`}
                            >
                              <Phone />
                            </a>
                          </Button>
                          <Button variant="outline" size="icon-sm" asChild>
                            <a
                              href={`https://wa.me/${contact.phone.replace(/[^\d]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`WhatsApp ${contact.name}`}
                            >
                              <MessageCircle />
                            </a>
                          </Button>
                          {contact.email ? (
                            <Button variant="outline" size="icon-sm" asChild>
                              <a
                                href={`mailto:${contact.email}`}
                                aria-label={`Email ${contact.name}`}
                              >
                                <Mail />
                              </a>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="icon-sm"
                              disabled
                              aria-label="No email on file"
                            >
                              <Mail />
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Expands in place — never a dialog */}
                {contacts.length > VISIBLE_LIMIT && (
                  <button
                    onClick={() =>
                      setExpanded((e) => ({ ...e, [companyId]: !e[companyId] }))
                    }
                    className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2 text-xs font-medium text-accent transition-colors hover:bg-secondary/50"
                  >
                    <ChevronRight
                      className={cn(
                        "size-3.5 transition-transform duration-200",
                        expanded[companyId] && "rotate-90",
                      )}
                    />
                    {expanded[companyId]
                      ? "Show less"
                      : `Show ${contacts.length - VISIBLE_LIMIT} more contact${
                          contacts.length - VISIBLE_LIMIT === 1 ? "" : "s"
                        }`}
                  </button>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={totalGroups}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        label="contact groups"
      />

      <EditContactDialog
        open={editingContact !== null}
        onOpenChange={(open) => {
          if (!open) setEditingContact(null);
        }}
        contact={editingContact}
        onSave={(id, patch) => updateContact(id, patch)}
      />
    </div>
  );
}
