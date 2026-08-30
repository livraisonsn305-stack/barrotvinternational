"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { fetchArticles, getArticleImage, matchesCategoryKey, type Article } from "@/lib/articles";

export type CategoryPageProps = {
  title: string;
  categoryKeys: string | string[];
  emptyMessage?: string;
};

export default function CategoryPage({ title, categoryKeys, emptyMessage }: CategoryPageProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadArticles() {
      setLoading(true);
      try {
        const published = await fetchArticles("published");
        if (!ignore) {
          setArticles(published);
          setError("");
        }
      } catch (loadError) {
        console.error(`${title.toUpperCase().replace(/\s+/g, "_")}_ARTICLES_READ_ERROR`, loadError);
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
  }, [title]);

  const requestedCategoryKeys = useMemo(
    () => (Array.isArray(categoryKeys) ? categoryKeys : [categoryKeys]),
    [categoryKeys]
  );

  const categoryArticles = useMemo(
    () =>
      [...articles]
        .filter((article) => matchesCategoryKey(article.category, requestedCategoryKeys))
        .sort((a, b) => Number(b.createdAt?.seconds ?? 0) - Number(a.createdAt?.seconds ?? 0)),
    [articles, requestedCategoryKeys]
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

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-black text-[#111b35]">{title}</h1>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
            Chargement des articles de la catégorie {title}...
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>
        ) : categoryArticles.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
            {emptyMessage ?? `Aucun article publié pour cette catégorie pour le moment.`}
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {categoryArticles.map((article) => (
              <article key={article.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <img src={getArticleImage(article.image)} alt={article.title} className="h-48 w-full object-cover" />
                <div className="p-5">
                  <div className="text-xs font-black uppercase tracking-wider text-[#d62828]">{article.category}</div>
                  <h2 className="mt-2 text-xl font-black text-[#111b35]">{article.title}</h2>
                  <div className="mt-3 text-sm text-slate-500">
                    {article.createdAt && typeof article.createdAt === "object" && "seconds" in article.createdAt
                      ? new Date(Number(article.createdAt.seconds) * 1000).toLocaleDateString("fr-FR")
                      : "Date indisponible"}
                  </div>
                  <Link
                    href={`/article/${article.slug || article.id}`}
                    className="mt-5 inline-flex rounded-lg bg-[#111b35] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#d62828]"
                  >
                    Lire l&apos;article
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
