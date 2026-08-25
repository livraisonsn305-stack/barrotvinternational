"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { filterArticlesByQuery, type Article } from "@/lib/articles";

export function SearchDialog({
  articles,
  isOpen,
  onClose,
}: {
  articles: Article[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const filtered = filterArticlesByQuery(articles, query);
    return query.trim() ? filtered : filtered.slice(0, 8);
  }, [articles, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 px-4 py-6 sm:py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <span className="text-xl">🔎</span>
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un article, une catégorie, un sujet..."
            className="flex-1 border-0 bg-transparent px-2 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400"
            aria-label="Recherche d'articles"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700"
          >
            Fermer
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-3 sm:p-4">
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
              Aucun résultat pour “{query}”.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug || article.id}`}
                  onClick={onClose}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#d62828] hover:shadow-md"
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d62828]">
                    {article.category}
                  </div>
                  <div className="mt-2 text-lg font-bold text-[#111b35]">{article.title}</div>
                  <div className="mt-2 line-clamp-2 text-sm text-slate-600">{article.description}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
