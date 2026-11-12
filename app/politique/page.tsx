import type { Metadata } from "next";

import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Actualité Politique",
  description: "Les actualités politiques suivies par Barro TV International.",
  alternates: { canonical: "https://www.barrotvinternational.com/politique" },
};

export default function PolitiquePage() {
  return <CategoryPage title="Politique" categoryKeys="POLITIQUE" emptyMessage="Aucun article politique publié pour le moment." />;
}
