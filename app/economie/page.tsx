import type { Metadata } from "next";

import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Actualité Économie",
  description: "Les actualités économiques suivies par Barro TV International.",
  alternates: { canonical: "https://www.barrotvinternational.com/economie" },
};

export default function EconomiePage() {
  return <CategoryPage title="Économie" categoryKeys="ECONOMIE" emptyMessage="Aucun article économique publié pour le moment." />;
}
