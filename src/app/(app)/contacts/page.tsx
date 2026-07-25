import type { Metadata } from "next";
import { ContactsView } from "@/components/contacts/contacts-view";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 sm:py-6">
      <ContactsView />
    </div>
  );
}
