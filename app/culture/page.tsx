import type { Metadata } from "next";

import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Actualité Culture",
  description: "Les actualités culturelles suivies par Barro TV International.",
  alternates: { canonical: "https://www.barrotvinternational.com/culture" },
};

export default function CulturePage() {
  return <CategoryPage title="Culture" categoryKeys="CULTURE" emptyMessage="Aucun article culturel publié pour le moment." />;
}
