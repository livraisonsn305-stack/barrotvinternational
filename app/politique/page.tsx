"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { fetchArticles, type Article } from "@/lib/articles";

const normalizeCategory = (value?: string) => (value ?? "").toUpperCase().replace(/\s+/g, " ").trim();

export default function PolitiquePage() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadArticles() {
      const published = await fetchArticles("published");
      if (!ignore) {
        setArticles(published);
      }
    }

    void loadArticles();
    return () => {
      ignore = true;
    };
  }, []);

  const politiqueArticles = useMemo(
    () =>
      [...articles]
        .filter((article) => normalizeCategory(article.category) === "POLITIQUE")
        .sort((a, b) => {
          const left = Number(a.createdAt?.seconds ?? 0);
          const right = Number(b.createdAt?.seconds ?? 0);
          return right - left;
        }),
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
          <nav className="hidden items-center gap-7 font-semibold md:flex">
            <Link href="/">Accueil</Link>
            <Link href="/politique" className="text-[#d62828]">Politique</Link>
            <Link href="/societe">Société</Link>
            <Link href="/sport">Sport</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-4xl font-black text-[#111b35]">Politique</h1>
        <div className="mt-6 grid gap-5">
          {politiqueArticles.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
              Aucun article politique publié pour le moment.
            </div>
          ) : (
            politiqueArticles.map((article) => (
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
