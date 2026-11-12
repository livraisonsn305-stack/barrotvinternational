"use client";

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
};

function getPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push("ellipsis");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);

  return items;
}

export function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const pages = getPageItems(currentPage, totalPages);
  const goToPage = (page: number) => {
    onPageChange(Math.min(totalPages, Math.max(1, page)));
  };

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span aria-hidden="true">←</span> Précédent
      </button>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-slate-500" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => goToPage(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`min-h-11 min-w-11 rounded-lg border px-3 py-2 text-sm font-bold ${
              page === currentPage
                ? "border-[#d62828] bg-[#d62828] text-white"
                : "border-slate-300 text-slate-700"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="min-h-11 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Suivant <span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}
