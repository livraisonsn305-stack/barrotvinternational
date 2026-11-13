"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { getArticleImage, normalizeSearchValue, type Article } from "@/lib/articles";

type ExternalResult = {
  title: string;
  link: string;
  source: string;
  date: string;
  snippet: string;
  image?: string;
};

function formatArticleDate(value: unknown) {
  if (!value || typeof value !== "object") return "Date non précisée";

  const timestamp = value as { toDate?: () => Date; seconds?: number };
  const date = typeof timestamp.toDate === "function"
    ? timestamp.toDate()
    : typeof timestamp.seconds === "number"
      ? new Date(timestamp.seconds * 1000)
      : null;

  if (!date || Number.isNaN(date.getTime())) return "Date non précisée";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

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
  const [externalResults, setExternalResults] = useState<ExternalResult[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalUnavailable, setExternalUnavailable] = useState(false);

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
    const normalizedQuery = normalizeSearchValue(query.trim());
    if (!normalizedQuery) return articles.slice(0, 8);

    const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
    return articles
      .map((article) => {
        const title = normalizeSearchValue(article.title);
        const category = normalizeSearchValue(article.category);
        const description = normalizeSearchValue(article.description);
        const content = normalizeSearchValue(article.content);
        const keywords = normalizeSearchValue((article.keywords ?? []).join(" "));
        const slug = normalizeSearchValue(article.slug);
        const haystack = [title, category, description, content, keywords, slug].join(" ");
        const matchingTerms = queryTerms.filter((term) => haystack.includes(term));

        if (matchingTerms.length !== queryTerms.length) return null;

        const score = (title === normalizedQuery ? 100 : 0)
          + (title.startsWith(normalizedQuery) ? 40 : 0)
          + (title.includes(normalizedQuery) ? 20 : 0)
          + matchingTerms.filter((term) => title.includes(term)).length * 10
          + matchingTerms.filter((term) => category.includes(term) || keywords.includes(term)).length * 4
          + (description.includes(normalizedQuery) ? 8 : 0)
          + (content.includes(normalizedQuery) ? 3 : 0);

        return { article, score };
      })
      .filter((result): result is { article: Article; score: number } => result !== null)
      .sort((first, second) => second.score - first.score || first.article.title.localeCompare(second.article.title, "fr"))
      .map(({ article }) => article);
  }, [articles, query]);

  const suggestions = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query.trim());
    if (normalizedQuery.length < 2) return [];

    const candidates = articles.flatMap((article) => [
      article.title,
      article.category,
      ...(article.keywords ?? []),
    ]);

    return [...new Set(candidates.filter((candidate) => {
      const normalizedCandidate = normalizeSearchValue(candidate);
      return normalizedCandidate.length > 1 && normalizedCandidate.includes(normalizedQuery);
    }))].slice(0, 5);
  }, [articles, query]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!isOpen || normalizedQuery.length < 3 || results.length > 0) {
      setExternalResults([]);
      setExternalLoading(false);
      setExternalUnavailable(false);
      return;
    }

    const controller = new AbortController();
    setExternalLoading(true);
    setExternalUnavailable(false);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          results?: ExternalResult[];
          unavailable?: boolean;
        };

        if (!response.ok) throw new Error("SEARCH_EXTERNAL_FAILED");
        setExternalResults(payload.results ?? []);
        setExternalUnavailable(Boolean(payload.unavailable));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setExternalResults([]);
        setExternalUnavailable(true);
      } finally {
        if (!controller.signal.aborted) setExternalLoading(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, query, results.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 px-4 py-6 sm:py-10" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="search-dialog-title" className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <span id="search-dialog-title" className="text-xl" aria-hidden="true">🔎</span>
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une actualité, un sujet, une personne..."
            className="flex-1 border-0 bg-transparent px-2 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400"
            aria-label="Recherche d'articles"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full px-2 py-2 text-lg leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Effacer la recherche"
            >
              ×
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-[#d62828] hover:text-[#d62828]"
            aria-label="Fermer la recherche"
          >
            Fermer
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-3 sm:p-4">
          {suggestions.length > 0 ? (
            <div className="mb-4" aria-label="Suggestions de recherche">
              <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Suggestions</div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-[#d62828] hover:bg-white hover:text-[#d62828]"
                  >
                    🔎 {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {query.trim() && results.length === 0 && externalLoading ? (
            <div className="space-y-3" aria-live="polite" aria-busy="true">
              {[1, 2].map((item) => (
                <div key={item} className="animate-pulse rounded-2xl border border-slate-200 p-4">
                  <div className="h-3 w-24 rounded bg-slate-200" />
                  <div className="mt-3 h-5 w-4/5 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-full rounded bg-slate-100" />
                </div>
              ))}
              <p className="text-center text-sm text-slate-500">Recherche en cours...</p>
            </div>
          ) : results.length === 0 && externalResults.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
              <div className="text-base font-bold text-[#111b35]">Aucun résultat trouvé</div>
              <p className="mt-2">Essayez un autre mot-clé, une personne, une ville ou une catégorie.</p>
              {externalUnavailable ? <p className="mt-3 text-xs text-slate-500">La recherche externe est temporairement indisponible.</p> : null}
            </div>
          ) : (
            <div className="space-y-5">
              {results.length > 0 ? (
                <section aria-labelledby="barro-results-heading">
                  <h2 id="barro-results-heading" className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#111b35]">
                    Barro TV International
                  </h2>
                  <div className="space-y-3">
                    {results.map((article) => (
                      <Link
                        key={article.id}
                        href={`/article/${article.slug || article.id}`}
                        onClick={onClose}
                        className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[#d62828] hover:shadow-md"
                      >
                        <img src={getArticleImage(article.image)} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d62828]">{article.category}</div>
                          <div className="mt-1 text-base font-bold text-[#111b35]">{article.title}</div>
                          <div className="mt-1 line-clamp-2 text-sm text-slate-600">{article.description}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{formatArticleDate(article.createdAt)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#d62828]">Lire l'article →</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {externalResults.length > 0 ? (
                <section aria-labelledby="external-results-heading">
                  <h2 id="external-results-heading" className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#111b35]">
                    Actualités du web
                  </h2>
                  <div className="space-y-3">
                    {externalResults.map((result) => (
                      <a key={result.link} href={result.link} target="_blank" rel="noreferrer" className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[#d62828] hover:shadow-md">
                        {result.image ? <img src={result.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" /> : null}
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Source externe · {result.source}</div>
                          <div className="mt-1 text-base font-bold text-[#111b35]">{result.title}</div>
                          <div className="mt-1 line-clamp-2 text-sm text-slate-600">{result.snippet}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            {result.date ? <span className="text-slate-500">{result.date}</span> : null}
                            <span className="font-semibold text-[#d62828]">Voir la source →</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
