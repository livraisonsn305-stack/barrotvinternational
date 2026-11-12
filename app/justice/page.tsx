import type { Metadata } from "next";

import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Actualité Justice",
  description: "Les actualités liées à la justice suivies par Barro TV International.",
  alternates: { canonical: "https://www.barrotvinternational.com/justice" },
};

export default function JusticePage() {
  return <CategoryPage title="Justice" categoryKeys="JUSTICE" emptyMessage="Aucun article de Justice publié pour le moment." />;
}
