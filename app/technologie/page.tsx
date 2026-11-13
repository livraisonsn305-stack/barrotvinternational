import type { Metadata } from "next";

import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Actualité Technologie",
  description: "Les actualités technologiques suivies par Barro TV International.",
  alternates: { canonical: "https://www.barrotvinternational.com/technologie" },
};

export default function TechnologiePage() {
  return <CategoryPage title="Technologie" categoryKeys="TECHNOLOGIE" emptyMessage="Aucun article technologique publié pour le moment." />;
}
