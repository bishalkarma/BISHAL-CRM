import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataSettings } from "@/components/settings/data-settings";
import { CurrencySettings } from "@/components/settings/currency-settings";

export const metadata: Metadata = { title: "Settings" };

/**
 * Appearance lives in the top bar only — display mode, accent theme and the
 * theme gallery were all duplicated here, so they have been removed.
 */
export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader
        title="Settings"
        description="Manage your data and trading currencies."
      />
      <DataSettings />
      <CurrencySettings />
    </div>
  );
}
