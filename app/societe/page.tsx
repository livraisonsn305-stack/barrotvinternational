import type { Metadata } from "next";

import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Actualité Société",
  description: "Les actualités de société au Sénégal suivies par Barro TV International.",
  alternates: { canonical: "https://www.barrotvinternational.com/societe" },
};

export default function SocietePage() {
  return <CategoryPage title="Société" categoryKeys={["SOCIETE", "ACTUALITESENEGAL", "ACTUALITES SENEGAL", "ACTUALITÉ SÉNÉGAL", "ACTUALITÉSÉNÉGAL"]} emptyMessage="Aucun article publié pour cette catégorie pour le moment." />;
}
