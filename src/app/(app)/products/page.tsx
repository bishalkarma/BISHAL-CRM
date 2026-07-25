import type { Metadata } from "next";
import { Package } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <ComingSoon
      title="Product Catalogue"
      description="Your full SKU list with pack sizes, cost, margin and stock — the backbone of fast, accurate quoting."
      icon={Package}
      part="Part 4"
      features={[
        "Categories, brands and pack sizes",
        "Cost, list price and margin guardrails",
        "Customer-specific price lists",
        "Stock levels and lead times",
        "Product images and spec sheets",
        "Bulk import from Excel",
      ]}
    />
  );
}
