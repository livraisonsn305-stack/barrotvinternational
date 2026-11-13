import type { Metadata } from "next";

import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Actualité Internationale",
  description: "Les actualités internationales suivies par Barro TV International.",
  alternates: { canonical: "https://www.barrotvinternational.com/international" },
};

export default function InternationalPage() {
  return <CategoryPage title="International" categoryKeys="INTERNATIONAL" emptyMessage="Aucun article international publié pour le moment." />;
}
