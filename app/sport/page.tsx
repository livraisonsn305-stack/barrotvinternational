"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { fetchArticles, type Article } from "@/lib/articles";

const normalizeCategory = (value?: string) => (value ?? "").toUpperCase().replace(/\s+/g, " ").trim();

export default function SportPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadArticles() {
      setLoading(true);
      try {
        const published = await fetchArticles("published");
        if (!ignore) {
          setArticles(published);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadArticles();
    return () => {
      ignore = true;
    };
  }, []);

  const sportArticles = useMemo(
    () =>
      [...articles]
        .filter((article) => normalizeCategory(article.category) === "SPORT")
        .sort((a, b) => Number(b.createdAt?.seconds ?? 0) - Number(a.createdAt?.seconds ?? 0)),
    [articles]
  );

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="bg-[#111b35] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-sm">
          <span>Dakar, Sénégal</span>
          <span className="hidden sm:block">BARRO TV INTERNATIONAL</span>
        </div>
      </div>

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="block">
            <div className="text-2xl font-black">
              BARRO <span className="text-[#d62828]">TV</span>
            </div>
            <div className="text-[10px] font-bold tracking-[0.35em] text-slate-600">
              INTERNATIONAL
            </div>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-4xl font-black text-[#111b35]">Sport</h1>
        <div className="mt-6 grid gap-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
              Chargement des articles sportifs...
            </div>
          ) : sportArticles.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
              Aucun article sportif publié pour le moment.
            </div>
          ) : (
            sportArticles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.slug || article.id}`}
                className="rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-xs font-black uppercase tracking-wider text-[#d62828]">
                  {article.category}
                </div>
                <h2 className="mt-2 text-2xl font-bold">{article.title}</h2>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
