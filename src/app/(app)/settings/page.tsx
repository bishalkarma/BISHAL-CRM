import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { CurrencySettings } from "@/components/settings/currency-settings";
import { DataSettings } from "@/components/settings/data-settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader
        title="Settings"
        description="Personalise how the CRM looks and manage your data."
      />
      <DataSettings />
      <AppearanceSettings />
      <CurrencySettings />
    </div>
  );
}
