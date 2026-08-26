"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ShareButtons } from "@/components/ShareButtons";
import { fetchArticles, getArticleImage, type Article } from "@/lib/articles";

function formatArticleDate(value: unknown) {
  if (!value || typeof value !== "object" || !("seconds" in value)) {
    return "Aujourd'hui";
  }

  const seconds = Number((value as { seconds?: number }).seconds ?? 0);
  if (!seconds) return "Aujourd'hui";

  const date = new Date(seconds * 1000);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadArticle() {
      setLoading(true);
      const articles = await fetchArticles("published");
      const nextArticle = articles.find((item) => item.slug === id || item.id === id) ?? null;

      if (!ignore) {
        setArticle(nextArticle);
        setLoading(false);
      }
    }

    void loadArticle();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return <main className="min-h-screen bg-white p-8 text-slate-600">Chargement de l'article…</main>;
  }

  if (!article) {
    return <main className="min-h-screen bg-white p-8 text-slate-600">Article introuvable.</main>;
  }

  const paragraphs = article.content
    ? article.content.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : [];

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.barrotvinternational.com"}/article/${article.slug || article.id}`;

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
          <span>✍️ {article.author || "Barro TV International"}</span>
          <span>🕐 {formatArticleDate(article.createdAt)}</span>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl">
          <img
            src={getArticleImage(article.image)}
            alt={article.title}
            className="h-auto w-full object-cover"
          />
        </div>

        <ShareButtons articleTitle={article.title} articleUrl={shareUrl} />

        <div className="mt-10 max-w-4xl">
          {paragraphs.map((paragraph, index) => (
            <p key={`${article.id}-${index}`} className="mb-6 text-lg leading-8 text-slate-800">
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
