import type { Metadata } from "next";

import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Actualité Afrique",
  description: "Toute l'actualité africaine suivie par Barro TV International.",
  alternates: { canonical: "https://www.barrotvinternational.com/afrique" },
};

export default function AfriquePage() {
  return <CategoryPage title="Afrique" categoryKeys="AFRIQUE" emptyMessage="Aucun article africain publié pour le moment." />;
}
