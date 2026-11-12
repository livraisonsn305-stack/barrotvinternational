import type { Metadata } from "next";

import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Actualité Sport",
  description: "Les actualités sportives suivies par Barro TV International.",
  alternates: { canonical: "https://www.barrotvinternational.com/sport" },
};

export default function SportPage() {
  return <CategoryPage title="Sport" categoryKeys="SPORT" emptyMessage="Aucun article sportif publié pour le moment." />;
}
