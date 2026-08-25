import type { Metadata } from "next";

import { ShareButtons } from "@/components/ShareButtons";

const articles: Record<
  string,
  {
    category: string;
    title: string;
    description: string;
    image: string;
    date: string;
    author: string;
    content: string[];
  }
> = {
  "actualites-senegal": {
    category: "ACTUALITÉ SÉNÉGAL",
    title: "Sénégal : les grandes actualités à suivre aujourd'hui",
    description:
      "Retrouvez les informations essentielles, les réactions et les dernières nouvelles de la rédaction de Barro TV International.",
    image:
      "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?auto=format&fit=crop&w=1600&q=85",
    date: "24 août 2026 • 18:00",
    author: "La rédaction de Barro TV International",
    content: [
      "Barro TV International vous propose un point sur les principales actualités à suivre au Sénégal et à l'international.",
      "Cette page sera prochainement alimentée avec les articles publiés par la rédaction. Chaque actualité pourra présenter les faits essentiels, les réactions et les informations utiles aux lecteurs.",
      "Notre objectif est de proposer une information claire, rapide et accessible, avec une couverture de la politique, de la société, de l'économie, du sport, de la culture et de l'actualité internationale.",
    ],
  },

  "politique-senegal": {
    category: "POLITIQUE",
    title: "Les dernières décisions politiques au Sénégal",
    description:
      "Les principales informations politiques et les décisions qui font l'actualité.",
    image:
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80",
    date: "24 août 2026 • 17:40",
    author: "Barro TV International",
    content: [
      "Retrouvez dans cet article les principales informations politiques du Sénégal.",
      "La rédaction de Barro TV International suivra les développements et présentera les informations importantes au fur et à mesure.",
    ],
  },

  "football-senegal": {
    category: "SPORT",
    title: "Les dernières nouvelles du football sénégalais",
    description:
      "Toute l'actualité du football sénégalais, les résultats et les informations importantes.",
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80",
    date: "24 août 2026 • 17:25",
    author: "Barro TV International",
    content: [
      "Le football occupe une place importante dans l'actualité sportive sénégalaise.",
      "Barro TV International vous proposera les résultats, les réactions, les transferts et les principales informations concernant les Lions et les clubs sénégalais.",
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = articles[id] ?? articles["actualites-senegal"];

  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: `/article/${id}`,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = articles[id] ?? articles["actualites-senegal"];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="bg-[#111b35] text-white">
        <div className="mx-auto flex max-w-7xl justify-between px-4 py-2 text-sm">
          <span>Dakar, Sénégal</span>
          <span className="hidden sm:block">BARRO TV INTERNATIONAL</span>
        </div>
      </div>

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <a href="/" className="block">
            <div className="text-2xl font-black">
              BARRO <span className="text-[#d62828]">TV</span>
            </div>
            <div className="text-[10px] font-bold tracking-[0.35em] text-slate-600">
              INTERNATIONAL
            </div>
          </a>

          <nav className="hidden items-center gap-7 font-semibold md:flex">
            <a href="/" className="text-[#d62828]">
              Accueil
            </a>
            <a href="#">Politique</a>
            <a href="#">Société</a>
            <a href="#">Économie</a>
            <a href="#">Sport</a>
            <a href="#">Afrique</a>
          </nav>

          <button className="rounded-full border px-3 py-2" aria-label="Rechercher">
            🔎
          </button>
        </div>
      </header>

      <div className="border-b">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4">
          <div className="flex min-w-max gap-7 py-3 text-sm font-semibold">
            <a href="#">Politique</a>
            <a href="#">Société</a>
            <a href="#">Économie</a>
            <a href="#">Faits-divers</a>
            <a href="#">Justice</a>
            <a href="#">Sport</a>
            <a href="#">Afrique</a>
            <a href="#">International</a>
            <a href="#">Culture</a>
            <a href="#">Technologie</a>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-8 text-sm text-slate-500">
          <a href="/" className="font-semibold hover:text-[#d62828]">
            Accueil
          </a>
          <span className="mx-2">›</span>
          <span>{article.category}</span>
        </div>

        <div className="mb-4">
          <span className="rounded-md bg-[#d62828] px-3 py-2 text-xs font-black uppercase text-white">
            {article.category}
          </span>
        </div>

        <h1 className="max-w-4xl text-4xl font-black leading-tight text-[#111b35] sm:text-5xl lg:text-6xl">
          {article.title}
        </h1>

        <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600 sm:text-xl">
          {article.description}
        </p>

        <div className="mt-6 flex flex-col gap-2 border-y py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:gap-6">
          <span>✍️ {article.author}</span>
          <span>🕐 {article.date}</span>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl">
          <img
            src={article.image}
            alt={article.title}
            className="h-auto w-full object-cover"
          />
        </div>

        <ShareButtons articleTitle={article.title} />

        <div className="mt-10 max-w-4xl">
          {article.content.map((paragraph, index) => (
            <p key={index} className="mb-6 text-lg leading-8 text-slate-800">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-slate-100 p-6">
          <h2 className="text-xl font-black text-[#111b35]">
            Barro TV International
          </h2>
          <p className="mt-2 text-slate-600">Dakar, Usine Bene Tally</p>
          <p className="mt-1 font-semibold">📞 78 388 91 58</p>
        </div>
      </article>

      <footer className="mt-10 bg-[#0b1224] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="text-2xl font-black">
            BARRO <span className="text-[#d62828]">TV</span>
          </div>

          <div className="mt-1 text-xs tracking-[0.3em] text-slate-400">
            INTERNATIONAL
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Votre média d'information au Sénégal et à l'international.
          </p>

          <div className="mt-6 border-t border-white/10 pt-5 text-sm text-slate-500">
            © 2026 Barro TV International — Tous droits réservés.
          </div>
        </div>
      </footer>
    </main>
  );
}
