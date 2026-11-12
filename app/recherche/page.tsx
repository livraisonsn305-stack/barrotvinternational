"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Pagination } from "@/components/Pagination";
import { fetchArticles, filterArticlesByQuery, type Article } from "@/lib/articles";

export default function RecherchePage() {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    let ignore = false;

    async function loadArticles() {
      setLoading(true);
      try {
        const nextArticles = await fetchArticles("published");
        if (!ignore) {
          setArticles(nextArticles);
          setError("");
        }
      } catch (loadError) {
        console.error("SEARCH_ARTICLES_READ_ERROR", loadError);
        if (!ignore) {
          setError("Impossible de charger les articles publiés. Consultez la console pour le détail technique.");
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

  const results = useMemo(() => filterArticlesByQuery(articles, query), [articles, query]);
  const paginatedResults = results.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

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
            <Link href="/politique">Politique</Link>
            <Link href="/societe">Société</Link>
            <Link href="/sport">Sport</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-black text-[#111b35] sm:text-4xl">
          Recherche
        </h1>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border bg-slate-50 p-4 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un article, une catégorie..."
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
            aria-label="Recherche"
          />
          <button
            type="button"
            className="rounded-lg bg-[#d62828] px-5 py-3 font-bold text-white"
          >
            Rechercher
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{error}</div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              Aucun article trouvé
            </div>
          ) : (
            paginatedResults.map((article) => (
              <Link
                key={article.slug}
                href={`/article/${article.slug || article.id}`}
                className="block rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="text-xs font-black uppercase tracking-wider text-[#d62828]">
                  {article.category}
                </div>
                <div className="mt-2 text-xl font-bold text-[#111b35]">
                  {article.title}
                </div>
              </Link>
            ))
          )}
          <Pagination
            currentPage={currentPage}
            totalItems={results.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>
    </main>
  );
}
