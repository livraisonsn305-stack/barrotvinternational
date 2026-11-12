import type { Metadata } from "next";

import CategoryPage from "@/components/CategoryPage";

export const metadata: Metadata = {
  title: "Actualité Faits divers",
  description: "Les faits divers suivis par Barro TV International au Sénégal et ailleurs.",
  alternates: { canonical: "https://www.barrotvinternational.com/faits-divers" },
};

export default function FaitsDiversPage() {
  return <CategoryPage title="Faits divers" categoryKeys={["FAITSDIVERS", "FAITS-DIVERS", "FAITS DIVERS"]} emptyMessage="Aucun article de Faits divers publié pour le moment." />;
}
